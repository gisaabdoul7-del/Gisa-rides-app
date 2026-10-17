-- Gisa Rides initial schema for Supabase/Postgres.
-- Run this in Supabase SQL Editor on a NEW project or apply as a migration.
-- Never put a Supabase service_role/secret key in the Flutter app.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Gisa Rides user',
  role text not null default 'passenger'
    check (role in ('passenger', 'driver_pending', 'driver', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id) on delete restrict,
  driver_id uuid references public.profiles(id) on delete restrict,
  pickup_lat double precision not null check (pickup_lat between -90 and 90),
  pickup_lng double precision not null check (pickup_lng between -180 and 180),
  destination_lat double precision not null check (destination_lat between -90 and 90),
  destination_lng double precision not null check (destination_lng between -180 and 180),
  service_type text not null check (service_type in ('moto', 'car')),
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')),
  estimated_km numeric(10,3) not null check (estimated_km > 0),
  fare_estimate_frw integer not null check (fare_estimate_frw >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rides_passenger_created_idx
  on public.rides (passenger_id, created_at desc);
create index if not exists rides_driver_created_idx
  on public.rides (driver_id, created_at desc);
create index if not exists rides_requested_created_idx
  on public.rides (status, created_at asc) where status = 'requested';

-- Create a least-privilege profile for each new auth user.
-- User-supplied metadata can request a driver profile, but cannot approve it.
create or replace function public.handle_new_gisa_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  display_name text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'account_type', 'passenger');
  display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Gisa Rides user');
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    display_name,
    case when requested_role = 'driver' then 'driver_pending' else 'passenger' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_gisa on auth.users;
create trigger on_auth_user_created_gisa
after insert on auth.users
for each row execute procedure public.handle_new_gisa_user();

alter table public.profiles enable row level security;
alter table public.rides enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.rides from anon, authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.rides to authenticated;

drop policy if exists "Users can read their own Gisa profile" on public.profiles;
create policy "Users can read their own Gisa profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists "Passengers and relevant drivers can read rides" on public.rides;
create policy "Passengers and relevant drivers can read rides"
on public.rides for select to authenticated
using (
  passenger_id = (select auth.uid())
  or driver_id = (select auth.uid())
  or (
    status = 'requested'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('driver', 'admin')
    )
  )
);

-- Haversine distance (straight-line GPS estimate), not road distance.
-- Rates match the currently proposed values in the app: moto 500 FRW/km,
-- car 2,500 FRW/km. Change both app fare.dart and this function together
-- if the business adopts different rates. Final fare policy needs owner approval.
create or replace function public.request_ride(
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_destination_lat double precision,
  p_destination_lng double precision,
  p_service_type text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_distance double precision;
  v_rate integer;
  v_fare integer;
  v_ride_id uuid;
  v_role text;
  v_a double precision;
begin
  if v_user_id is null then raise exception 'Please sign in before requesting a ride'; end if;
  select role into v_role from public.profiles where id = v_user_id;
  if v_role is distinct from 'passenger' then raise exception 'Only passenger accounts can request rides'; end if;
  if p_service_type not in ('moto', 'car') then raise exception 'Service must be moto or car'; end if;
  if p_pickup_lat not between -90 and 90 or p_destination_lat not between -90 and 90
     or p_pickup_lng not between -180 and 180 or p_destination_lng not between -180 and 180 then
    raise exception 'Invalid coordinates';
  end if;

  v_a := power(sin(radians(p_destination_lat - p_pickup_lat) / 2), 2)
      + cos(radians(p_pickup_lat)) * cos(radians(p_destination_lat))
      * power(sin(radians(p_destination_lng - p_pickup_lng) / 2), 2);
  v_distance := 2 * 6371.0 * asin(sqrt(least(1.0, greatest(0.0, v_a))));
  if v_distance < 0.05 then raise exception 'Choose a destination at least 50 metres away'; end if;

  v_rate := case when p_service_type = 'car' then 2500 else 500 end;
  v_fare := ceil(v_distance * v_rate)::integer;

  insert into public.rides (
    passenger_id, pickup_lat, pickup_lng, destination_lat, destination_lng,
    service_type, status, estimated_km, fare_estimate_frw
  ) values (
    v_user_id, p_pickup_lat, p_pickup_lng, p_destination_lat, p_destination_lng,
    p_service_type, 'requested', round(v_distance::numeric, 3), v_fare
  ) returning id into v_ride_id;
  return v_ride_id;
end;
$$;

create or replace function public.accept_ride(p_ride_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Please sign in'; end if;
  if not exists (select 1 from public.profiles where id = v_user_id and role = 'driver') then
    raise exception 'Only approved drivers can accept rides';
  end if;
  update public.rides
  set driver_id = v_user_id, status = 'accepted', updated_at = now()
  where id = p_ride_id and status = 'requested' and driver_id is null;
  if not found then raise exception 'This ride is no longer available'; end if;
end;
$$;

create or replace function public.update_driver_ride_status(
  p_ride_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_status text;
  v_expected_status text;
begin
  if v_user_id is null then raise exception 'Please sign in'; end if;
  select status into v_current_status from public.rides
    where id = p_ride_id and driver_id = v_user_id for update;
  if not found then raise exception 'Ride not found for this driver'; end if;
  v_expected_status := case v_current_status
    when 'accepted' then 'arrived'
    when 'arrived' then 'in_progress'
    when 'in_progress' then 'completed'
    else null
  end;
  if v_expected_status is null or p_new_status is distinct from v_expected_status then
    raise exception 'Invalid trip status transition';
  end if;
  update public.rides set status = p_new_status, updated_at = now() where id = p_ride_id;
end;
$$;

revoke all on function public.request_ride(double precision, double precision, double precision, double precision, text) from public, anon;
revoke all on function public.accept_ride(uuid) from public, anon;
revoke all on function public.update_driver_ride_status(uuid, text) from public, anon;
grant execute on function public.request_ride(double precision, double precision, double precision, double precision, text) to authenticated;
grant execute on function public.accept_ride(uuid) to authenticated;
grant execute on function public.update_driver_ride_status(uuid, text) to authenticated;

-- Enable Postgres Changes for the rides stream used by the app.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rides'
  ) then
    alter publication supabase_realtime add table public.rides;
  end if;
exception when undefined_object then
  raise notice 'Publication supabase_realtime not found; enable Realtime for public.rides in Supabase dashboard.';
end;
$$;

-- SECURITY NOTE: Never expose the Supabase service-role key in this client app.
-- Promote a verified driver only after checking their identity and required documents:
-- update public.profiles set role = 'driver' where id = '<auth-user-uuid>';
