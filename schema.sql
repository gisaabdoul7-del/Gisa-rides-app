create extension if not exists pgcrypto;
create type public.ride_type as enum ('moto','car');
create type public.ride_status as enum ('requested','accepted','arriving','in_progress','completed','cancelled');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text,phone text,role text not null default 'rider' check(role in ('rider','driver','admin')),created_at timestamptz not null default now());
create table public.driver_profiles(user_id uuid primary key references public.profiles(id) on delete cascade,vehicle_type public.ride_type not null,vehicle_plate text,is_online boolean not null default false,latitude double precision,longitude double precision,updated_at timestamptz not null default now());
create table public.rides(id uuid primary key default gen_random_uuid(),rider_id uuid not null references public.profiles(id),driver_id uuid references public.profiles(id),ride_type public.ride_type not null,pickup_lat double precision not null,pickup_lng double precision not null,pickup_address text,destination_lat double precision,destination_lng double precision,destination_address text not null,distance_km numeric(10,2),fare_rwf integer,status public.ride_status not null default 'requested',created_at timestamptz not null default now(),accepted_at timestamptz,completed_at timestamptz);
alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.rides enable row level security;
create policy "read own profile" on public.profiles for select using(auth.uid()=id);
create policy "insert own profile" on public.profiles for insert with check(auth.uid()=id);
create policy "update own profile" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
create policy "driver manages own profile" on public.driver_profiles for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "rider creates own ride" on public.rides for insert with check(auth.uid()=rider_id);
create policy "participants read ride" on public.rides for select using(auth.uid()=rider_id or auth.uid()=driver_id);
create policy "assigned driver updates ride" on public.rides for update using(auth.uid()=driver_id) with check(auth.uid()=driver_id);
-- Add secure server-side matching so eligible drivers can discover requests without exposing all rider data.
