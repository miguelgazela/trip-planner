-- Run only after the app using `db: { schema: 'trip_planner' }` is deployed.
-- Drops the temporary views left in `public` by 001_move_to_trip_planner_schema.sql.

drop view if exists public.day_plans;
drop view if exists public.transports;
drop view if exists public.expenses;
drop view if exists public.places;
drop view if exists public.accommodations;
drop view if exists public.flights;
drop view if exists public.trips;
