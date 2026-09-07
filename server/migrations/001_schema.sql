-- NAVONMESH: schema
--
-- Tenancy shape, and the reason for it:
--   An FPO owns units. A farmer belongs to an FPO and is a member of the
--   units they actually store produce in. A farmer sees their own units. An
--   FPO manager sees every unit their FPO owns. Nobody sees another FPO.
--
-- The gateway is not a user. It authenticates as a device holding a key
-- scoped to one unit, and it can only write alerts and readings for that
-- unit. That separation is what stops a leaked gateway key from reading a
-- farmer's produce or contact details.

begin;

create table if not exists fpos (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  district    text,
  created_at  timestamptz not null default now()
);

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,          -- E.164, the farmer's identity
  name          text not null,
  pin_hash      text not null,                 -- scrypt, never the PIN itself
  role          text not null default 'farmer'
                check (role in ('farmer', 'fpo_manager', 'admin')),
  fpo_id        uuid references fpos(id) on delete set null,
  lang          text not null default 'en',
  failed_logins int  not null default 0,
  locked_until  timestamptz,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

create table if not exists units (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,           -- NM-004
  label        text not null,
  fpo_id       uuid not null references fpos(id) on delete cascade,
  district     text,
  capacity_kg  int  not null default 200,
  installed_on date,
  created_at   timestamptz not null default now()
);

-- Which farmers may see which unit. An FPO manager does not need a row here;
-- their access comes from the unit's fpo_id matching their own.
create table if not exists unit_members (
  unit_id  uuid not null references units(id)  on delete cascade,
  user_id  uuid not null references users(id)  on delete cascade,
  added_at timestamptz not null default now(),
  primary key (unit_id, user_id)
);

-- The gateway's credential. Only the hash is stored, so a database dump does
-- not hand over the ability to post alerts.
create table if not exists device_keys (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references units(id) on delete cascade,
  key_hash   text not null unique,             -- sha256 of the bearer token
  label      text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

create table if not exists alerts (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references units(id) on delete cascade,
  level      text not null check (level in ('action', 'info')),
  kind       text not null,                    -- door_open, high_temp, ...
  title      text not null,
  body       text not null default '',
  action     text not null default '',
  raised_at  timestamptz not null default now(),
  cleared_at timestamptz
);

create table if not exists readings (
  id          bigserial primary key,
  unit_id     uuid not null references units(id) on delete cascade,
  taken_at    timestamptz not null default now(),
  temp_c      numeric(5,2),
  humidity_pct numeric(5,2),
  battery_pct int,
  solar_kw    numeric(5,2),
  load_kg     numeric(6,2),
  door_open   boolean,
  pcm_pct     int
);

create table if not exists batches (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references units(id) on delete cascade,
  owner_id    uuid references users(id) on delete set null,
  crop_id     text not null,                   -- matches app/src/data/crops.js
  weight_kg   numeric(6,2) not null,
  stored_on   date not null default current_date,
  removed_on  date,
  created_at  timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  levels      text[] not null default '{action}',
  quiet_from  int not null default 21,
  quiet_to    int not null default 5,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz,
  failures    int not null default 0
);

-- Delivery log. Without it there is no way to answer "did the farmer
-- actually get told", which is the first question after produce spoils.
create table if not exists notifications (
  id         bigserial primary key,
  alert_id   uuid references alerts(id) on delete cascade,
  user_id    uuid references users(id) on delete cascade,
  channel    text not null check (channel in ('push', 'sms', 'in_app')),
  status     text not null check (status in ('sent', 'failed', 'expired', 'skipped')),
  detail     text,
  sent_at    timestamptz not null default now()
);

create index if not exists idx_units_fpo          on units(fpo_id);
create index if not exists idx_unit_members_user  on unit_members(user_id);
create index if not exists idx_alerts_unit_time   on alerts(unit_id, raised_at desc);
-- One open alert of a kind per unit. The gateway can retry without stacking
-- duplicates on the farmer's phone. A partial unique index does this without
-- needing the btree_gist extension an EXCLUDE constraint would require.
create unique index if not exists alerts_one_open_per_kind
  on alerts(unit_id, kind) where cleared_at is null;
create index if not exists idx_readings_unit_time on readings(unit_id, taken_at desc);
create index if not exists idx_batches_unit       on batches(unit_id) where removed_on is null;
create index if not exists idx_push_user          on push_subscriptions(user_id);
create index if not exists idx_notif_alert        on notifications(alert_id);

commit;
