alter table public.rental_company_faqs
drop constraint rental_company_faqs_rental_company_id_fkey;

alter table public.rental_company_faqs
rename column rental_company_id to fleet_car_id;

alter table public.rental_company_faqs
add constraint rental_company_faqs_fleet_car_id_fkey
  foreign key (fleet_car_id) references public.rental_company_fleet(id) on delete cascade;

drop index if exists rental_company_faqs_rental_company_id_idx;
create index if not exists rental_company_faqs_fleet_car_id_idx
  on public.rental_company_faqs (fleet_car_id);

comment on table public.rental_company_faqs is
'Per-vehicle FAQ entries shown on each fleet car''s listing page.';
