alter table public.rental_companies
alter column type drop not null;

comment on column public.rental_companies.type is
'Deprecated — superseded by the types text[] column. Left nullable and unused for backward compatibility; do not write to this column.';
