alter table public.cars
add column if not exists brochure_url text;

alter table public.commercial_evs
add column if not exists brochure_url text;

comment on column public.cars.brochure_url is
'Optional PDF brochure link — either uploaded to Bunny storage or an external URL.';

comment on column public.commercial_evs.brochure_url is
'Optional PDF brochure link — either uploaded to Bunny storage or an external URL.';
