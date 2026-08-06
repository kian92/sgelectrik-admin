alter table public.dealers
add column if not exists logo_url text;

comment on column public.dealers.logo_url is
'Dealer logo image URL, uploaded via the admin dealer form. Optional — shown on the charging map pin and dealer listings when set.';
