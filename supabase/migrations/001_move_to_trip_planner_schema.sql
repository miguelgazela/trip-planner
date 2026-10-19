-- ============================================
-- Move Trip Planner out of `public` into its own `trip_planner` schema.
--
-- The Supabase project is shared with other apps, so Trip Planner gets its
-- own schema. Run in the Dashboard SQL Editor, then:
--   1. Dashboard -> Project Settings -> Data API -> Exposed schemas: add `trip_planner`.
--   2. Deploy the app (clients now use `db: { schema: 'trip_planner' }`).
--   3. Run 002_drop_public_views.sql.
--
-- Until step 2 is live, the old app keeps working through the views this
-- migration leaves in `public` (except the one-off local data import, which
-- upserts and cannot go through a view).
--
-- The `images` storage bucket is not affected.
-- ============================================

begin;

create schema if not exists trip_planner;

grant usage on schema trip_planner to anon, authenticated, service_role;
alter default privileges in schema trip_planner
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema trip_planner
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema trip_planner
  grant all on functions to anon, authenticated, service_role;

-- Tables keep their data, indexes, policies and grants.
alter table public.trips          set schema trip_planner;
alter table public.flights        set schema trip_planner;
alter table public.accommodations set schema trip_planner;
alter table public.places         set schema trip_planner;
alter table public.expenses       set schema trip_planner;
alter table public.transports     set schema trip_planner;
alter table public.day_plans      set schema trip_planner;

-- Temporary views so the currently deployed app keeps working. RLS of the
-- underlying tables applies (security_invoker).
create view public.trips with (security_invoker = true)
  as select * from trip_planner.trips;
create view public.flights with (security_invoker = true)
  as select * from trip_planner.flights;
create view public.accommodations with (security_invoker = true)
  as select * from trip_planner.accommodations;
create view public.places with (security_invoker = true)
  as select * from trip_planner.places;
create view public.expenses with (security_invoker = true)
  as select * from trip_planner.expenses;
create view public.transports with (security_invoker = true)
  as select * from trip_planner.transports;
create view public.day_plans with (security_invoker = true)
  as select * from trip_planner.day_plans;

grant select, insert, update, delete
  on public.trips, public.flights, public.accommodations, public.places,
     public.expenses, public.transports, public.day_plans
  to anon, authenticated, service_role;

commit;
