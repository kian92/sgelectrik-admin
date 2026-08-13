alter table public.rental_company_fleet
add column if not exists phv_requirements text[] not null default '{}';

alter table public.rental_company_fleet
add column if not exists corporate_requirements text[] not null default '{}';

alter table public.rental_company_fleet
add column if not exists types text[] not null default '{}';

alter table public.rental_company_fleet
add column if not exists deposit_required text not null default '';

comment on column public.rental_company_fleet.phv_requirements is
'Minimum requirements for PHV (private-hire) leasing of this vehicle, one requirement per array element. Shown as a bullet list on the public car page.';

comment on column public.rental_company_fleet.corporate_requirements is
'Minimum requirements for consumer/corporate leasing of this vehicle, one requirement per array element. Shown as a bullet list on the public car page.';

comment on column public.rental_company_fleet.types is
'Rental types this specific vehicle is offered under (Car Sharing, Subscription, Long-term Lease, Short-term Rental) — independent of the parent rental_companies.types.';

comment on column public.rental_company_fleet.deposit_required is
'Per-vehicle deposit amount, overriding/supplementing the parent company''s deposit_required if set.';
