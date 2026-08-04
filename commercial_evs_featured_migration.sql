alter table public.commercial_evs
add column if not exists featured boolean not null default false;

comment on column public.commercial_evs.featured is
'Sponsored/promoted commercial EV — boosted in AI quiz suggestions and listing pages, same convention as public.cars.featured.';
