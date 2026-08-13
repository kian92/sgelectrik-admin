alter table public.dealers
add column if not exists services text[] not null default array['car_sales','rentals','workshops','commercial_evs'];

comment on column public.dealers.services is
'Which dealer-facing feature areas this dealer offers: car_sales, rentals, workshops, commercial_evs. Controls which sidebar sections are shown to the dealer. Defaults to all four so existing dealers are unaffected.';
