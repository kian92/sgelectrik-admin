alter table public.workshops
alter column dealer_id drop not null;

comment on column public.workshops.dealer_id is
'Dealer that owns this workshop. Optional — an admin may create a workshop that is not yet associated with any dealer.';
