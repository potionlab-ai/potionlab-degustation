-- =====================================================================
-- Fichier 3 : qui a le droit d'entrer dans l'espace admin ?
-- Remplacez les adresses ci-dessous par les vraies (en minuscules), puis Run.
-- Chaque personne doit AUSSI avoir un compte dans Supabase > Authentication > Users.
-- =====================================================================
insert into public.admins (email) values
  ('production@potionlab.ai'),
  ('prenom.patron@potionlab.ai'),
  ('prenom.mixologue@potionlab.ai')
on conflict do nothing;

-- Pour retirer un accès :
-- delete from public.admins where email = 'adresse@potionlab.ai';

-- Pour voir la liste :
-- select * from public.admins;
