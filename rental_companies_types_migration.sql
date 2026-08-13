alter table public.rental_companies
add column if not exists types text[] not null default '{}';

update public.rental_companies
set types = array[type]
where type is not null and type <> '' and types = '{}';

comment on column public.rental_companies.types is
'Rental types offered (Car Sharing, Subscription, Long-term Lease, Short-term Rental) — multi-select, replaces the old scalar "type" column.';
