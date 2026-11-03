-- Développement local : compte admin de test.
insert into public.admins (email) values ('admin@potionlab.local') on conflict do nothing;
