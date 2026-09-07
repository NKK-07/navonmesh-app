-- The device could write but not read back, which broke both RETURNING and
-- ON CONFLICT.
--
-- Postgres applies the SELECT policy, not just the INSERT WITH CHECK, whenever
-- a statement has to look at the row it just touched. `insert ... returning`
-- and `insert ... on conflict do update` both do. With only an INSERT policy
-- in place, a plain insert succeeded and either of those failed with "new row
-- violates row-level security policy", which reads like a WITH CHECK problem
-- and is not one.
--
-- The API's own /api/device/alert uses both, so this was a live fault and not
-- a test artefact. A device may read its own unit's rows and nothing else.

begin;

drop policy if exists alerts_device_select on alerts;
create policy alerts_device_select on alerts for select
  using (unit_id = app_device_unit_id());

drop policy if exists readings_device_select on readings;
create policy readings_device_select on readings for select
  using (unit_id = app_device_unit_id());

-- A device reports against a unit, so it may confirm that unit exists. This
-- is what lets the gateway resolve its own code without a user session. It
-- still sees exactly one row.
drop policy if exists units_device_select on units;
create policy units_device_select on units for select
  using (id = app_device_unit_id());

commit;
