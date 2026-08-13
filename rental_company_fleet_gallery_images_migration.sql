alter table public.rental_company_fleet
add column if not exists gallery_images text[] not null default '{}';

comment on column public.rental_company_fleet.gallery_images is
'Additional photos for this fleet vehicle, shown in a gallery alongside the main image_id photo.';
