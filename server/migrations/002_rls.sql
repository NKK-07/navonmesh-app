-- NAVONMESH: row level security
--
-- How the request context reaches the database.
--   The API opens a transaction and does `set local app.user_id = '<uuid>'`
--   (or `app.device_unit_id` for the gateway). `set local` dies with the
--   transaction, so a pooled connection can never leak one request's identity
--   into the next. Every policy below reads that setting and nothing else.
--
-- Two things that make this real rather than decorative:
--   1. FORCE row level security. Without it the table OWNER bypasses every
--      policy, and since migrations run as the owner, the app would appear to
--      work while enforcing nothing.
--   2. The API connects as navonmesh_app, which owns no tables and is not
--      superuser. Superusers bypass RLS unconditionally and no policy can
--      stop them.

begin;

-- ---------------------------------------------------------------- context

create or replace function app_user_id() returns uuid
language sql stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

create or replace function app_device_unit_id() returns uuid
language sql stable
as $$
  select nullif(current_setting('app.device_unit_id', true), '')::uuid
$$;

-- security definer so the check itself is not subject to the policies it is
-- used by, which would recurse. search_path is pinned: a security definer
-- function with a mutable search_path is a privilege escalation waiting to
-- happen.
create or replace function app_can_see_unit(target uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from unit_members m
    where m.unit_id = target and m.user_id = app_user_id()
  ) or exists (
    select 1
    from users u
    join units n on n.fpo_id = u.fpo_id
    where u.id = app_user_id()
      and n.id = target
      and u.role in ('fpo_manager', 'admin')
  )
$$;

create or replace function app_is_manager() returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from users u
    where u.id = app_user_id() and u.role in ('fpo_manager', 'admin')
  )
$$;

-- ------------------------------------------------------------------ arm it

alter table fpos               enable row level security;
alter table users              enable row level security;
alter table units              enable row level security;
alter table unit_members       enable row level security;
alter table device_keys        enable row level security;
alter table alerts             enable row level security;
alter table readings           enable row level security;
alter table batches            enable row level security;
alter table push_subscriptions enable row level security;
alter table notifications      enable row level security;

alter table fpos               force row level security;
alter table users              force row level security;
alter table units              force row level security;
alter table unit_members       force row level security;
alter table device_keys        force row level security;
alter table alerts             force row level security;
alter table readings           force row level security;
alter table batches            force row level security;
alter table push_subscriptions force row level security;
alter table notifications      force row level security;

-- ---------------------------------------------------------------- policies

-- fpos: you see the one you belong to, nothing else.
drop policy if exists fpos_select on fpos;
create policy fpos_select on fpos for select
  using (id = (select fpo_id from users where id = app_user_id()));

-- users: yourself always. A manager also sees members of their own FPO, which
-- is what makes the fleet view possible without exposing other FPOs.
drop policy if exists users_select on users;
create policy users_select on users for select
  using (
    id = app_user_id()
    or (app_is_manager()
        and fpo_id = (select u.fpo_id from users u where u.id = app_user_id()))
  );

-- You may edit your own row. Role and fpo_id are locked by a trigger below,
-- because a WITH CHECK alone cannot stop you rewriting your own role.
drop policy if exists users_update_self on users;
create policy users_update_self on users for update
  using (id = app_user_id()) with check (id = app_user_id());

drop policy if exists units_select on units;
create policy units_select on units for select
  using (app_can_see_unit(id));

drop policy if exists unit_members_select on unit_members;
create policy unit_members_select on unit_members for select
  using (user_id = app_user_id() or app_can_see_unit(unit_id));

-- Device keys are never readable by any user. The API reads them through a
-- dedicated lookup function, not through a policy.
drop policy if exists device_keys_none on device_keys;
create policy device_keys_none on device_keys for select using (false);

-- alerts: read what your units raise. Insert only as the device that owns the
-- unit, so a logged in farmer cannot fabricate an alert on someone's unit.
drop policy if exists alerts_select on alerts;
create policy alerts_select on alerts for select
  using (app_can_see_unit(unit_id));

drop policy if exists alerts_device_insert on alerts;
create policy alerts_device_insert on alerts for insert
  with check (unit_id = app_device_unit_id());

drop policy if exists alerts_device_update on alerts;
create policy alerts_device_update on alerts for update
  using (unit_id = app_device_unit_id())
  with check (unit_id = app_device_unit_id());

-- A farmer may acknowledge an alert on a unit they can see, which is the one
-- write a user is allowed on this table.
drop policy if exists alerts_user_clear on alerts;
create policy alerts_user_clear on alerts for update
  using (app_can_see_unit(unit_id))
  with check (app_can_see_unit(unit_id));

drop policy if exists readings_select on readings;
create policy readings_select on readings for select
  using (app_can_see_unit(unit_id));

drop policy if exists readings_device_insert on readings;
create policy readings_device_insert on readings for insert
  with check (unit_id = app_device_unit_id());

-- batches: visible to anyone who can see the unit, because a shared unit is
-- shared. Only the owner, or a manager, may change one.
drop policy if exists batches_select on batches;
create policy batches_select on batches for select
  using (app_can_see_unit(unit_id));

drop policy if exists batches_insert on batches;
create policy batches_insert on batches for insert
  with check (app_can_see_unit(unit_id) and owner_id = app_user_id());

drop policy if exists batches_update on batches;
create policy batches_update on batches for update
  using (owner_id = app_user_id() or app_is_manager())
  with check (owner_id = app_user_id() or app_is_manager());

-- push subscriptions are strictly personal. Not even a manager reads them:
-- they are device identifiers and there is no reason to expose them.
drop policy if exists push_own on push_subscriptions;
create policy push_own on push_subscriptions for all
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

drop policy if exists notifications_own on notifications;
create policy notifications_own on notifications for select
  using (user_id = app_user_id() or app_is_manager());

-- The API must verify a gateway's bearer token without being able to read the
-- key table. One security definer function answers exactly one question and
-- exposes nothing else, so a SQL injection in the alert path still cannot
-- enumerate keys.
create or replace function app_device_unit_for_key(candidate text) returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select unit_id from device_keys
  where key_hash = candidate and revoked_at is null
  limit 1
$$;

-- ------------------------------------------------- privilege is not enough

-- A policy cannot stop you setting your own role to admin on your own row,
-- because the row still passes `id = app_user_id()`. A trigger can.
create or replace function app_guard_user_fields() returns trigger
language plpgsql as $$
begin
  -- Changing your own PIN is legitimate and the API verifies the old one
  -- first. Promoting yourself to admin, or moving yourself into another FPO,
  -- is not: the policy alone cannot stop it, because the row still passes
  -- `id = app_user_id()`.
  if new.role is distinct from old.role
     or new.fpo_id is distinct from old.fpo_id then
    if app_user_id() is not null then
      raise exception 'role and fpo cannot be changed through this path';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists trg_guard_user_fields on users;
create trigger trg_guard_user_fields
  before update on users
  for each row execute function app_guard_user_fields();

-- ------------------------------------------------------------- app role

-- The API connects as this role. It owns nothing and is not superuser, so
-- FORCE plus non-ownership means the policies above actually bind.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'navonmesh_app') then
    create role navonmesh_app login password 'change_me_in_railway';
  end if;
end
$$;

grant usage on schema public to navonmesh_app;
grant select, insert, update, delete on all tables in schema public to navonmesh_app;
grant usage, select on all sequences in schema public to navonmesh_app;
alter default privileges in schema public
  grant select, insert, update, delete on tables to navonmesh_app;
alter default privileges in schema public
  grant usage, select on sequences to navonmesh_app;

-- The app must never be able to turn policies off or read the key table.
revoke all on device_keys from navonmesh_app;
grant execute on function app_device_unit_for_key(text) to navonmesh_app;
grant execute on function app_user_id()        to navonmesh_app;
grant execute on function app_device_unit_id() to navonmesh_app;
grant execute on function app_can_see_unit(uuid) to navonmesh_app;
grant execute on function app_is_manager()     to navonmesh_app;

commit;
