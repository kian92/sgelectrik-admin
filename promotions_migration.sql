-- Promotions / roadshows table
-- Run this in the Supabase SQL editor for the SGElectrik project
-- (xolqiionlysdarlpfhvi.supabase.co)

create table if not exists promotions (
  id bigint generated always as identity primary key,
  dealer_id bigint not null references dealers(id) on delete cascade,
  title text not null,
  slug text not null unique,
  venue text,
  area text,
  start_date date not null,
  end_date date not null,
  time_range text,
  perks text[] not null default '{}',
  image text,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_date_range_check check (end_date >= start_date)
);

create index if not exists promotions_dealer_id_idx on promotions (dealer_id);
create index if not exists promotions_status_idx on promotions (status);
create index if not exists promotions_dates_idx on promotions (start_date, end_date);

-- Row Level Security
-- The admin and public sites both read/write via the service-role key
-- server-side, which bypasses RLS. These policies are defense-in-depth
-- in case an anon/browser client is ever added later.
alter table promotions enable row level security;

create policy "Public can read active promotions"
  on promotions for select
  to anon, authenticated
  using (status = 'active');

create policy "Service role has full access"
  on promotions for all
  to service_role
  using (true)
  with check (true);
