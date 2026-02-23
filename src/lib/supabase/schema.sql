-- Trip Planner AI — Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables, RLS policies, and indexes.

-- ============================================================
-- 1. TRIPS
-- ============================================================
create table if not exists trips (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  destination text not null,
  start_date text not null,
  end_date text not null,
  date_mode text,
  currency text not null default 'EUR',
  image_url text,
  budget numeric,
  daily_food_budget numeric,
  created_at text not null,
  updated_at text not null
);

alter table trips enable row level security;

create policy "Users can CRUD own trips"
  on trips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 2. FLIGHTS
-- ============================================================
create table if not exists flights (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  flight_number text not null,
  airline text,
  departure_airport text not null,
  arrival_airport text not null,
  departure_time text not null,
  arrival_time text not null,
  cost numeric,
  confirmation_code text,
  notes text,
  created_at text not null
);

alter table flights enable row level security;

create policy "Users can CRUD own flights"
  on flights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_flights_trip_id on flights(trip_id);

-- ============================================================
-- 3. ACCOMMODATIONS
-- ============================================================
create table if not exists accommodations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  address text not null,
  check_in text not null,
  check_out text not null,
  check_in_time text,
  check_out_time text,
  booking_url text,
  image_url text,
  cost numeric,
  split_count integer,
  confirmation_code text,
  free_cancellation_before text,
  latitude numeric,
  longitude numeric,
  notes text,
  created_at text not null
);

alter table accommodations enable row level security;

create policy "Users can CRUD own accommodations"
  on accommodations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_accommodations_trip_id on accommodations(trip_id);

-- ============================================================
-- 4. PLACES
-- ============================================================
create table if not exists places (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  categories jsonb not null default '[]',
  website text,
  estimated_duration integer,
  cost numeric,
  image_url text,
  city text,
  rating numeric,
  schedule_status text not null default 'unscheduled',
  scheduled_day_ids jsonb not null default '[]',
  tip text,
  notes text,
  is_event boolean,
  start_time text,
  created_at text not null
);

alter table places enable row level security;

create policy "Users can CRUD own places"
  on places for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_places_trip_id on places(trip_id);

-- ============================================================
-- 5. EXPENSES
-- ============================================================
create table if not exists expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  description text not null,
  amount numeric not null,
  split_count integer,
  category text not null,
  status text not null,
  date text,
  notes text,
  created_at text not null
);

alter table expenses enable row level security;

create policy "Users can CRUD own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_expenses_trip_id on expenses(trip_id);

-- ============================================================
-- 6. TRANSPORTS
-- ============================================================
create table if not exists transports (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  type text not null,
  "from" text not null,
  "to" text not null,
  departure_time text not null,
  duration_minutes integer not null,
  cost numeric,
  split_count integer,
  notes text,
  schedule_status text not null default 'unscheduled',
  scheduled_day_ids jsonb not null default '[]',
  created_at text not null
);

alter table transports enable row level security;

create policy "Users can CRUD own transports"
  on transports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_transports_trip_id on transports(trip_id);

-- ============================================================
-- 7. PACKING ITEMS
-- ============================================================
create table if not exists packing_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  name text not null,
  category text not null,
  checked boolean not null default false,
  created_at text not null
);

alter table packing_items enable row level security;

create policy "Users can CRUD own packing_items"
  on packing_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_packing_items_trip_id on packing_items(trip_id);

-- ============================================================
-- 8. DAY PLANS
-- ============================================================
create table if not exists day_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  date text not null,
  items jsonb not null default '[]',
  theme text,
  notes text
);

alter table day_plans enable row level security;

create policy "Users can CRUD own day_plans"
  on day_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_day_plans_trip_id on day_plans(trip_id);

-- ============================================================
-- STORAGE: images bucket (run in Supabase dashboard or via API)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('images', 'images', true);
--
-- create policy "Authenticated users can upload images"
--   on storage.objects for insert
--   with check (bucket_id = 'images' and auth.role() = 'authenticated');
--
-- create policy "Anyone can read images"
--   on storage.objects for select
--   using (bucket_id = 'images');
--
-- create policy "Users can delete own images"
--   on storage.objects for delete
--   using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);
