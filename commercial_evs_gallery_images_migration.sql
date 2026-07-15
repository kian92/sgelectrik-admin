alter table public.commercial_evs
add column if not exists gallery_images text[] not null default '{}';
