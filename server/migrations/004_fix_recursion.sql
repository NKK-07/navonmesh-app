-- Fixes "infinite recursion detected in policy for relation users".
--
-- The users and fpos policies each contained an inline subquery reading the
-- users table to find the caller's FPO. That subquery is itself subject to
-- users_select, which runs the subquery again, forever. The manager check did
-- not have the problem because app_is_manager() is security definer and so
-- steps outside RLS; the inline subquery had no such escape.
--
-- The rule this encodes: a policy on a table must never read that table
-- directly. Any lookup it needs goes through a security definer function with
-- a pinned search_path.

begin;

create or replace function app_user_fpo() returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select fpo_id from users where id = app_user_id()
$$;

grant execute on function app_user_fpo() to navonmesh_app;

drop policy if exists users_select on users;
create policy users_select on users for select
  using (
    id = app_user_id()
    or (app_is_manager() and fpo_id = app_user_fpo())
  );

drop policy if exists fpos_select on fpos;
create policy fpos_select on fpos for select
  using (id = app_user_fpo());

commit;
