-- Run once in Supabase.
-- Replace the old admin/dealer constraint before changing existing rows.
begin;

alter table public.dealers
  drop constraint if exists dealers_role_check;

update public.dealers
set role = 'superadmin'
where role = 'admin';

alter table public.dealers
  add constraint dealers_role_check
  check (role in ('dealer', 'editor', 'superadmin'));

commit;
