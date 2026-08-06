alter table public.dealers
add column if not exists latitude double precision;

alter table public.dealers
add column if not exists longitude double precision;

comment on column public.dealers.latitude is
'Dealer showroom latitude, for example 1.3040. Optional — dealers without coordinates are not shown on the charging map.';

comment on column public.dealers.longitude is
'Dealer showroom longitude, for example 103.8318. Optional — dealers without coordinates are not shown on the charging map.';
