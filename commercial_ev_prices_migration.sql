-- Commercial EV price list (admin-managed, public /commercial-ev-price-list)
-- Run this in the Supabase SQL editor for the SGElectrik project.
-- Separate from passenger `brands` / `ev_prices` so commercial brands
-- (Farizon, Foton, etc.) do not mix into the passenger EV price tab.

create table if not exists public.commercial_ev_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.commercial_ev_prices (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.commercial_ev_brands(id) on delete restrict,
  model text not null,
  -- Indicative starting price in SGD, excluding Category C COE.
  price_from integer not null check (price_from >= 0),
  updated_at timestamptz not null default now(),
  unique (brand_id, model)
);

create index if not exists commercial_ev_prices_brand_id_idx
  on public.commercial_ev_prices (brand_id);

alter table public.commercial_ev_brands enable row level security;
alter table public.commercial_ev_prices enable row level security;

drop policy if exists "Service role has full access to commercial_ev_brands"
  on public.commercial_ev_brands;
create policy "Service role has full access to commercial_ev_brands"
  on public.commercial_ev_brands for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role has full access to commercial_ev_prices"
  on public.commercial_ev_prices;
create policy "Service role has full access to commercial_ev_prices"
  on public.commercial_ev_prices for all
  to service_role
  using (true)
  with check (true);

insert into public.commercial_ev_brands (name) values
  ('BYD'),
  ('Chenglong'),
  ('DFSK'),
  ('Farizon'),
  ('Foton'),
  ('Maxus'),
  ('Nissan'),
  ('OHM'),
  ('Opel'),
  ('SANY'),
  ('SRM'),
  ('Victory')
on conflict (name) do nothing;

insert into public.commercial_ev_prices (brand_id, model, price_from)
select b.id, v.model, v.price_from
from (
  values
    ('BYD', 'T3 Electric', 43800),
    ('Chenglong', 'L2 Electric', 78800),
    ('DFSK', 'EC31 Refrigerated Electric', 47800),
    ('Farizon', 'SuperVan Electric', 58000),
    ('Farizon', 'V7E Electric', 47800),
    ('Foton', 'eView Connect Electric', 58500),
    ('Foton', 'eMiler Electric', 72888),
    ('Foton', 'eAuman Electric', 157000),
    ('Maxus', 'eDeliver 5 Electric', 147500),
    ('Maxus', 'eDeliver 7 Electric', 160000),
    ('Maxus', 'eDeliver 9 Electric', 163500),
    ('Nissan', 'Townstar Electric', 152800),
    ('OHM', '35 Electric', 139900),
    ('Opel', 'Combo-e Electric', 49800),
    ('Opel', 'Vivaro-e Electric', 63800),
    ('SANY', 'EV490 Electric', 280000),
    ('SRM', 'T3EV Electric', 63800),
    ('Victory', 'e-Response Electric', 37800)
) as v(brand_name, model, price_from)
join public.commercial_ev_brands b on b.name = v.brand_name
on conflict (brand_id, model) do nothing;
