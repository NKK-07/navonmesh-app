-- Produce a farmer can manage, and a target temperature a manager can set.
--
-- Three gaps this closes, all of them things the app showed but could not do:
--
--   1. A farmer could see their batches and change nothing about them. Storing
--      produce is half the job; the other half is deciding what to sell and at
--      what price, which is the part that turns a cold room into income.
--   2. There was no target temperature anywhere. The app displayed "Set point
--      8 to 10 degrees" as a constant in a JavaScript file. Nobody could set
--      it, so it applied to nothing.
--   3. The Call operator button had no number to call, because no table held
--      one.
--
-- Deliberately NOT here: a delete policy on batches. Removing produce is
-- `removed_on`, a soft delete the existing batches_update policy already
-- allows. Hard deleting would take the row out of the tonnage saved figure the
-- whole project is measured on.

begin;

-- ---------------------------------------------------------------- produce

alter table batches
  add column if not exists for_sale     boolean not null default false,
  add column if not exists ask_price_inr numeric(8,2),
  add column if not exists note          text;

comment on column batches.for_sale is
  'Farmer has offered this batch for sale. Storage continues either way.';
comment on column batches.ask_price_inr is
  'Asking price per kg in rupees. Null means offered without a price.';

-- A price is per kg and cannot be negative; weight has to be real.
alter table batches drop constraint if exists batches_price_sane;
alter table batches add constraint batches_price_sane
  check (ask_price_inr is null or ask_price_inr >= 0);

alter table batches drop constraint if exists batches_weight_sane;
alter table batches add constraint batches_weight_sane
  check (weight_kg > 0 and weight_kg <= 10000);

-- --------------------------------------------------------------- setpoint

alter table units
  add column if not exists setpoint_c      numeric(4,1),
  add column if not exists setpoint_set_by uuid references users(id) on delete set null,
  add column if not exists setpoint_set_at timestamptz;

comment on column units.setpoint_c is
  'Target chamber temperature. Set by an FPO manager, read by every farmer on the unit.';

-- The band the hardware can actually hold, and outside which produce is
-- damaged rather than preserved. 0 is the floor because most of what goes in
-- here takes chilling injury below it; king chilli is unhappy under 4.
alter table units drop constraint if exists units_setpoint_sane;
alter table units add constraint units_setpoint_sane
  check (setpoint_c is null or (setpoint_c >= 0 and setpoint_c <= 25));

-- ------------------------------------------------------- operator contact

alter table fpos
  add column if not exists operator_phone text;

comment on column fpos.operator_phone is
  'Who a farmer reaches from the Call operator button. E.164.';

-- ------------------------------------------------------------- policies

-- A manager may change their own FPO's units. app_can_see_unit already covers
-- managers, so USING is the same test the select policy uses; WITH CHECK stops
-- a row being moved to another FPO on the way out.
drop policy if exists units_update on units;
create policy units_update on units for update
  using (app_is_manager() and app_can_see_unit(id))
  with check (app_is_manager() and app_can_see_unit(id));

-- ...but only the setpoint. RLS grants the row, not the column, so without
-- this a manager with a valid update path could rename a unit, move its
-- capacity, or change its code, none of which they should be doing from a
-- phone. Same shape as app_guard_user_fields in 002.
create or replace function app_guard_unit_fields() returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.id          is distinct from old.id
  or new.code        is distinct from old.code
  or new.label       is distinct from old.label
  or new.fpo_id      is distinct from old.fpo_id
  or new.district    is distinct from old.district
  or new.capacity_kg is distinct from old.capacity_kg
  or new.installed_on is distinct from old.installed_on
  then
    raise exception 'only the setpoint may be changed here';
  end if;
  return new;
end;
$$;

drop trigger if exists units_guard on units;
create trigger units_guard before update on units
  for each row execute function app_guard_unit_fields();

commit;
