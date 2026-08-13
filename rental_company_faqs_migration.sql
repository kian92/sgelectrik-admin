create table if not exists public.rental_company_faqs (
  id bigint generated always as identity primary key,
  rental_company_id bigint not null references public.rental_companies(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists rental_company_faqs_rental_company_id_idx
  on public.rental_company_faqs (rental_company_id);

comment on table public.rental_company_faqs is
'Company-level FAQ entries shown across all of a rental company''s car listing pages on the public site.';
