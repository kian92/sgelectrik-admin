-- Keep analytics rows from passenger, commercial, and rental inventory
-- separate when their source tables use the same numeric id.
alter table public.dealer_events
add column if not exists vehicle_type text not null default 'passenger';

alter table public.dealer_events
drop constraint if exists dealer_events_vehicle_type_check;

alter table public.dealer_events
add constraint dealer_events_vehicle_type_check
check (vehicle_type in ('passenger', 'commercial', 'rental'));

-- Dealers 32 and 34 historically carried commercial inventory only, so their
-- existing vehicle-scoped events can be classified without an id collision.
update public.dealer_events
set vehicle_type = 'commercial'
where dealer_id in (32, 34)
  and car_id is not null
  and type in ('car_view', 'car_favorited', 'whatsapp_click', 'get_deal_click');

-- Dealer 30 carries both passenger and commercial inventory. Backfill only
-- commercial ids that do not also occur in the dealer's passenger car_ids.
-- Ambiguous overlapping ids intentionally remain 'passenger'.
update public.dealer_events as event
set vehicle_type = 'commercial'
where event.dealer_id = 30
  and event.car_id is not null
  and event.type in ('car_view', 'car_favorited', 'whatsapp_click', 'get_deal_click')
  and exists (
    select 1
    from public.commercial_evs as commercial
    where commercial.dealer_id = 30
      and commercial.id::text = event.car_id::text
  )
  and not exists (
    select 1
    from public.dealers as dealer,
      lateral jsonb_array_elements_text(
        coalesce(dealer.car_ids, '[]'::jsonb)
      ) as passenger_id
    where dealer.id = 30
      and passenger_id = event.car_id::text
  );

create index if not exists dealer_events_dealer_vehicle_type_idx
on public.dealer_events (dealer_id, vehicle_type, occurred_at desc);
