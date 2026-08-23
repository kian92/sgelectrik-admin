alter table public.rental_company_fleet
add column if not exists status text not null default 'draft';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rental_company_fleet_status_check'
  ) then
    alter table public.rental_company_fleet
    add constraint rental_company_fleet_status_check
    check (status in ('draft', 'published'));
  end if;
end $$;

comment on column public.rental_company_fleet.status is
'draft = hidden from the public site while the listing is being set up; published = visible publicly (still subject to the available flag for the "currently available for rent" badge).';

-- Existing rows were already live on the public site before this column existed,
-- so grandfather them in as published rather than hiding them.
update public.rental_company_fleet set status = 'published';
