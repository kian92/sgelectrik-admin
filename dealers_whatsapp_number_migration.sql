alter table public.dealers
add column if not exists whatsapp_number text;

comment on column public.dealers.whatsapp_number is
'Dealer WhatsApp contact in international format, for example +65 8123 4567.';
