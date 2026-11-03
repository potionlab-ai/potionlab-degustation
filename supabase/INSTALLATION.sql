-- =====================================================================
-- PotionLab · INSTALLATION COMPLÈTE (structure + sécurité + questions + démo)
-- Copiez TOUT ce fichier dans Supabase > SQL Editor > New query, puis Run.
-- Fichier généré à partir de supabase/migrations/0001 et 0002.
-- =====================================================================

-- =====================================================================
-- PotionLab · Questionnaire de dégustation
-- Fichier 1/2 : structure de la base, sécurité (RLS) et fonctions.
-- À coller tel quel dans Supabase > SQL Editor > New query > Run.
-- Le fichier peut être relancé sans danger (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Liste des personnes autorisées à entrer dans l'espace admin.
create table if not exists public.admins (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- Bibliothèque de questions (base commune + modules par type de boisson).
create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  module     text not null,                       -- 'base', 'biere', 'limonade', ...
  kind       text not null check (kind in ('jar', 'scale9', 'choice', 'text')),
  key        text,                                -- clé technique facultative (ex. 'aftertaste')
  label      jsonb not null,                      -- {"fr": "...", "en": "...", "nl": "...", "es": "..."}
  short      jsonb not null default '{}'::jsonb,  -- nom court du critère, pour la synthèse
  options    jsonb not null default '[]'::jsonb,  -- choix multiple : [{"fr": "...", ...}, ...]
  multiple   boolean not null default false,      -- choix multiple : plusieurs réponses possibles
  default_on boolean not null default true,       -- cochée par défaut à la création d'un questionnaire
  position   integer not null default 0,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un questionnaire = une boîte test envoyée à un client, avec son code.
create table if not exists public.questionnaires (
  id            uuid primary key default gen_random_uuid(),
  client_name   text not null,
  project_name  text not null,
  beverage_type text not null,
  iterations    jsonb not null default '[]'::jsonb,  -- [{"letter": "A", "change": "..."}, ...]
  questions     jsonb not null default '[]'::jsonb,  -- copie figée des questions posées
  access_code   text not null unique check (access_code ~ '^[A-Z0-9]{6}$'),
  archived      boolean not null default false,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Réponses (une par dégustateur ; plusieurs personnes peuvent répondre avec le même code).
create table if not exists public.responses (
  id               uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  respondent_token uuid not null,
  answers          jsonb not null default '{}'::jsonb,
  step             integer not null default 0,
  lang             text,
  respondent_name  text,
  respondent_email text,
  consent          boolean not null default false,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (questionnaire_id, respondent_token)
);
create index if not exists responses_questionnaire_idx on public.responses (questionnaire_id);

-- Journal des codes erronés (protection contre ceux qui essaient de deviner un code).
create table if not exists public.access_attempts (
  id          bigserial primary key,
  fingerprint text not null,
  created_at  timestamptz not null default now()
);
create index if not exists access_attempts_fp_idx on public.access_attempts (fingerprint, created_at);
create index if not exists access_attempts_time_idx on public.access_attempts (created_at);

-- ---------------------------------------------------------------------
-- Sécurité : RLS activée partout. Personne (anonyme) ne lit les tables
-- directement. Les clients passent uniquement par les fonctions client_*,
-- qui exigent le bon code. Les admins voient tout.
-- ---------------------------------------------------------------------

alter table public.admins          enable row level security;
alter table public.questions       enable row level security;
alter table public.questionnaires  enable row level security;
alter table public.responses       enable row level security;
alter table public.access_attempts enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists admins_read on public.admins;
create policy admins_read on public.admins
  for select to authenticated using (public.is_admin());

drop policy if exists questions_admin on public.questions;
create policy questions_admin on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists questionnaires_admin on public.questionnaires;
create policy questionnaires_admin on public.questionnaires
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists responses_admin on public.responses;
create policy responses_admin on public.responses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- access_attempts : aucune politique => inaccessible sauf via les fonctions internes.

grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on public.access_attempts from authenticated;
grant select on public.admins to authenticated;
grant select, insert, update, delete on public.questions, public.questionnaires, public.responses to authenticated;

-- ---------------------------------------------------------------------
-- Outils sur les codes d'accès
-- ---------------------------------------------------------------------

-- "abc-def", " ABC DEF " -> "ABCDEF"
create or replace function public.normalize_code(p text)
returns text language sql immutable
as $$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')); $$;

-- 6 caractères aléatoires (aléa cryptographique), sans 0/O, 1/I/L.
create or replace function public.generate_access_code()
returns text
language plpgsql volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- 31 caractères
  v_code text;
  v_bytes bytea;
  b int;
begin
  loop
    v_code := '';
    while length(v_code) < 6 loop
      v_bytes := uuid_send(gen_random_uuid());
      for i in 0..15 loop
        continue when i in (6, 8);             -- octets de version/variante, non aléatoires
        b := get_byte(v_bytes, i);
        if b < 248 and length(v_code) < 6 then  -- 248 = 31 * 8 : pas de biais
          v_code := v_code || substr(alphabet, (b % 31) + 1, 1);
        end if;
      end loop;
    end loop;
    exit when not exists (select 1 from public.questionnaires where access_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Identifie l'appareil qui appelle (adresse IP transmise par Supabase).
create or replace function public._client_fingerprint()
returns text language plpgsql stable
as $$
declare
  h json;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;
  return coalesce(
    nullif(trim(h ->> 'cf-connecting-ip'), ''),
    nullif(trim(split_part(h ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(trim(h ->> 'x-real-ip'), ''),
    'unknown'
  );
end;
$$;

-- Vérifie un code. Retourne l'id du questionnaire, ou une erreur :
--   'too_many_attempts' : trop de codes faux depuis cet appareil (8 en 15 min)
--                         ou attaque massive en cours (300 en 10 min au total)
--   'invalid_code'      : code inconnu (l'essai est enregistré)
create or replace function public._check_code(p_code text, out q_id uuid, out err text)
language plpgsql volatile security definer
set search_path = public
as $$
declare
  fp text := public._client_fingerprint();
  v_code text := public.normalize_code(p_code);
begin
  if (select count(*) from access_attempts
      where fingerprint = fp and created_at > now() - interval '15 minutes') >= 8
     or (select count(*) from access_attempts
         where created_at > now() - interval '10 minutes') >= 300 then
    err := 'too_many_attempts';
    return;
  end if;

  select id into q_id from questionnaires
  where access_code = v_code and not archived;

  if q_id is null then
    insert into access_attempts (fingerprint) values (fp);
    -- ménage occasionnel
    if random() < 0.02 then
      delete from access_attempts where created_at < now() - interval '1 day';
    end if;
    err := 'invalid_code';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Fonctions CLIENT (accessibles sans compte, uniquement avec le code)
-- ---------------------------------------------------------------------

-- Ouvre le questionnaire correspondant au code (+ reprise de la réponse en cours).
create or replace function public.client_open(p_code text, p_respondent uuid default null)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  c record;
  q questionnaires;
  r responses;
begin
  select * into c from public._check_code(p_code);
  if c.err is not null then
    return jsonb_build_object('error', c.err);
  end if;

  select * into q from questionnaires where id = c.q_id;
  if p_respondent is not null then
    select * into r from responses
    where questionnaire_id = q.id and respondent_token = p_respondent;
  end if;
  -- Nouvel appareil : on reprend le questionnaire en cours (non envoyé) le plus récent.
  if r.id is null then
    select * into r from responses
    where questionnaire_id = q.id and submitted_at is null
    order by updated_at desc limit 1;
  end if;

  return jsonb_build_object(
    'questionnaire', jsonb_build_object(
      'code',          q.access_code,
      'client_name',   q.client_name,
      'project_name',  q.project_name,
      'beverage_type', q.beverage_type,
      'iterations',    q.iterations,
      'questions',     q.questions
    ),
    'response', case when r.id is null then null else jsonb_build_object(
      'token',     r.respondent_token,
      'answers',   r.answers,
      'step',      r.step,
      'submitted', r.submitted_at is not null
    ) end,
    'submitted_count', (select count(*) from responses
                        where questionnaire_id = q.id and submitted_at is not null)
  );
end;
$$;

-- Sauvegarde automatique (brouillon).
create or replace function public.client_save(
  p_code text, p_respondent uuid, p_answers jsonb, p_step integer, p_lang text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  c record;
  r responses;
begin
  select * into c from public._check_code(p_code);
  if c.err is not null then
    return jsonb_build_object('error', c.err);
  end if;
  if p_respondent is null or jsonb_typeof(p_answers) <> 'object'
     or octet_length(p_answers::text) > 200000 then
    return jsonb_build_object('error', 'invalid_payload');
  end if;

  select * into r from responses
  where questionnaire_id = c.q_id and respondent_token = p_respondent;

  if r.id is null then
    if (select count(*) from responses where questionnaire_id = c.q_id) >= 100 then
      return jsonb_build_object('error', 'too_many_responses');
    end if;
    insert into responses (questionnaire_id, respondent_token, answers, step, lang)
    values (c.q_id, p_respondent, p_answers, coalesce(p_step, 0), left(p_lang, 5));
  elsif r.submitted_at is not null then
    return jsonb_build_object('error', 'already_submitted');
  else
    update responses
       set answers = p_answers, step = coalesce(p_step, step),
           lang = coalesce(left(p_lang, 5), lang), updated_at = now()
     where id = r.id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Envoi définitif.
create or replace function public.client_submit(
  p_code text, p_respondent uuid, p_answers jsonb, p_lang text,
  p_name text, p_email text, p_consent boolean
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  c record;
  saved jsonb;
begin
  if coalesce(p_consent, false) is not true then
    return jsonb_build_object('error', 'consent_required');
  end if;
  saved := public.client_save(p_code, p_respondent, p_answers, 99, p_lang);
  if saved ? 'error' then
    return saved;
  end if;
  select * into c from public._check_code(p_code);
  update responses
     set submitted_at     = now(),
         consent          = true,
         respondent_name  = nullif(left(trim(coalesce(p_name, '')), 120), ''),
         respondent_email = nullif(left(lower(trim(coalesce(p_email, ''))), 200), ''),
         updated_at       = now()
   where questionnaire_id = c.q_id and respondent_token = p_respondent;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Fonctions ADMIN (connexion obligatoire + email dans la table admins)
-- Elles s'exécutent avec les droits de l'utilisateur : la RLS s'applique.
-- ---------------------------------------------------------------------

create or replace function public._require_admin()
returns void language plpgsql stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_whoami()
returns jsonb language plpgsql stable
as $$
begin
  return jsonb_build_object('email', auth.jwt() ->> 'email', 'is_admin', public.is_admin());
end;
$$;

create or replace function public.admin_list_questions()
returns jsonb language plpgsql stable
as $$
begin
  perform public._require_admin();
  return coalesce((
    select jsonb_agg(to_jsonb(q) order by q.module, q.position, q.created_at)
    from public.questions q where not q.archived
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_save_question(p jsonb)
returns jsonb language plpgsql volatile
as $$
declare
  v public.questions;
begin
  perform public._require_admin();
  if nullif(p ->> 'id', '') is null then
    insert into public.questions (module, kind, key, label, short, options, multiple, default_on, position)
    values (
      p ->> 'module', p ->> 'kind', nullif(p ->> 'key', ''),
      coalesce(p -> 'label', '{}'), coalesce(p -> 'short', '{}'), coalesce(p -> 'options', '[]'),
      coalesce((p ->> 'multiple')::boolean, false), coalesce((p ->> 'default_on')::boolean, true),
      coalesce((p ->> 'position')::int,
               (select coalesce(max(position), 0) + 10 from public.questions where module = p ->> 'module'))
    )
    returning * into v;
  else
    update public.questions set
      module     = coalesce(p ->> 'module', module),
      kind       = coalesce(p ->> 'kind', kind),
      label      = coalesce(p -> 'label', label),
      short      = coalesce(p -> 'short', short),
      options    = coalesce(p -> 'options', options),
      multiple   = coalesce((p ->> 'multiple')::boolean, multiple),
      default_on = coalesce((p ->> 'default_on')::boolean, default_on),
      position   = coalesce((p ->> 'position')::int, position),
      updated_at = now()
    where id = (p ->> 'id')::uuid
    returning * into v;
  end if;
  return to_jsonb(v);
end;
$$;

create or replace function public.admin_archive_question(p_id uuid)
returns void language plpgsql volatile
as $$
begin
  perform public._require_admin();
  update public.questions set archived = true, updated_at = now() where id = p_id;
end;
$$;

-- Liste des questionnaires avec leur statut et leurs compteurs.
create or replace function public.admin_list_questionnaires()
returns jsonb language plpgsql stable
as $$
begin
  perform public._require_admin();
  return coalesce((
    select jsonb_agg(row_to_json(t) order by t.created_at desc)
    from (
      select q.id, q.client_name, q.project_name, q.beverage_type, q.access_code,
             q.archived, q.created_at, q.created_by,
             count(r.id) filter (where r.submitted_at is null)     as in_progress,
             count(r.id) filter (where r.submitted_at is not null) as submitted,
             max(coalesce(r.submitted_at, r.updated_at))           as last_activity,
             case
               when count(r.id) filter (where r.submitted_at is not null) > 0 then 'done'
               when count(r.id) > 0 then 'started'
               else 'sent'
             end as status
      from public.questionnaires q
      left join public.responses r on r.questionnaire_id = q.id
      group by q.id
    ) t
  ), '[]'::jsonb);
end;
$$;

-- Derniers retours reçus (pour le tableau de bord).
create or replace function public.admin_recent_feedback(p_limit int default 8)
returns jsonb language plpgsql stable
as $$
begin
  perform public._require_admin();
  return coalesce((
    select jsonb_agg(row_to_json(t))
    from (
      select r.id, r.submitted_at, r.respondent_name, r.answers -> 'general_comment' as general_comment,
             r.answers -> 'ranking' as ranking,
             q.id as questionnaire_id, q.client_name, q.project_name
      from public.responses r
      join public.questionnaires q on q.id = r.questionnaire_id
      where r.submitted_at is not null
      order by r.submitted_at desc
      limit p_limit
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_get_questionnaire(p_id uuid)
returns jsonb language plpgsql stable
as $$
begin
  perform public._require_admin();
  return (select to_jsonb(q) from public.questionnaires q where q.id = p_id);
end;
$$;

-- Crée (sans id) ou met à jour (avec id) un questionnaire. Le code est généré à la création.
create or replace function public.admin_save_questionnaire(p jsonb)
returns jsonb language plpgsql volatile
as $$
declare
  v public.questionnaires;
begin
  perform public._require_admin();
  if coalesce(trim(p ->> 'client_name'), '') = '' or coalesce(trim(p ->> 'project_name'), '') = '' then
    raise exception 'missing_fields';
  end if;
  if nullif(p ->> 'id', '') is null then
    insert into public.questionnaires (client_name, project_name, beverage_type, iterations, questions,
                                       access_code, created_by)
    values (trim(p ->> 'client_name'), trim(p ->> 'project_name'), coalesce(p ->> 'beverage_type', 'autre'),
            coalesce(p -> 'iterations', '[]'), coalesce(p -> 'questions', '[]'),
            public.generate_access_code(), auth.jwt() ->> 'email')
    returning * into v;
  else
    update public.questionnaires set
      client_name   = trim(p ->> 'client_name'),
      project_name  = trim(p ->> 'project_name'),
      beverage_type = coalesce(p ->> 'beverage_type', beverage_type),
      iterations    = coalesce(p -> 'iterations', iterations),
      questions     = coalesce(p -> 'questions', questions),
      updated_at    = now()
    where id = (p ->> 'id')::uuid
    returning * into v;
  end if;
  return to_jsonb(v);
end;
$$;

create or replace function public.admin_set_questionnaire_archived(p_id uuid, p_archived boolean)
returns void language plpgsql volatile
as $$
begin
  perform public._require_admin();
  update public.questionnaires set archived = p_archived, updated_at = now() where id = p_id;
end;
$$;

-- Questionnaire + toutes ses réponses (pour la page résultats et les exports).
create or replace function public.admin_get_results(p_id uuid)
returns jsonb language plpgsql stable
as $$
begin
  perform public._require_admin();
  return jsonb_build_object(
    'questionnaire', (select to_jsonb(q) from public.questionnaires q where q.id = p_id),
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'answers', r.answers, 'step', r.step, 'lang', r.lang,
        'respondent_name', r.respondent_name, 'respondent_email', r.respondent_email,
        'submitted_at', r.submitted_at, 'created_at', r.created_at, 'updated_at', r.updated_at
      ) order by r.created_at)
      from public.responses r where r.questionnaire_id = p_id
    ), '[]'::jsonb)
  );
end;
$$;

-- Supprimer une réponse (ex. un test interne).
create or replace function public.admin_delete_response(p_id uuid)
returns void language plpgsql volatile
as $$
begin
  perform public._require_admin();
  delete from public.responses where id = p_id;
end;
$$;

-- Petit signe de vie quotidien (évite la mise en pause du projet Supabase gratuit).
create or replace function public.ping()
returns text language sql stable
as $$ select 'ok'::text; $$;

-- ---------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.client_open(text, uuid)                                        to anon, authenticated;
grant execute on function public.client_save(text, uuid, jsonb, integer, text)                  to anon, authenticated;
grant execute on function public.client_submit(text, uuid, jsonb, text, text, text, boolean)    to anon, authenticated;
grant execute on function public.normalize_code(text)                                           to anon, authenticated;
grant execute on function public.ping()                                                         to anon, authenticated;

grant execute on function public.is_admin()                                to authenticated;
grant execute on function public._require_admin()                          to authenticated;
grant execute on function public.generate_access_code()                    to authenticated;
grant execute on function public.admin_whoami()                            to authenticated;
grant execute on function public.admin_list_questions()                    to authenticated;
grant execute on function public.admin_save_question(jsonb)                to authenticated;
grant execute on function public.admin_archive_question(uuid)              to authenticated;
grant execute on function public.admin_list_questionnaires()               to authenticated;
grant execute on function public.admin_recent_feedback(int)                to authenticated;
grant execute on function public.admin_get_questionnaire(uuid)             to authenticated;
grant execute on function public.admin_save_questionnaire(jsonb)           to authenticated;
grant execute on function public.admin_set_questionnaire_archived(uuid, boolean) to authenticated;
grant execute on function public.admin_get_results(uuid)                   to authenticated;
grant execute on function public.admin_delete_response(uuid)               to authenticated;

-- =====================================================================
-- PotionLab · Questionnaire de dégustation
-- Fichier 2/2 : bibliothèque de questions pré-remplie + questionnaire de
-- démonstration (code DEMO-01, limonade) avec 3 réponses fictives.
-- À coller dans Supabase > SQL Editor > New query > Run (après le fichier 1).
-- Ne remplit la bibliothèque que si elle est vide.
-- =====================================================================

do $$
begin
  if exists (select 1 from public.questions) then
    raise notice 'Bibliothèque déjà remplie : rien à faire.';
    return;
  end if;

  insert into public.questions (module, kind, key, label, short, options, default_on, position) values
  -- Base commune ------------------------------------------------------
  ('base', 'jar', 'sweetness',
   '{"fr":"Le niveau de sucre","en":"Sweetness level","nl":"Zoetheid","es":"Nivel de dulzor"}',
   '{"fr":"sucre","en":"sweetness","nl":"zoetheid","es":"dulzor"}', '[]', true, 10),
  ('base', 'jar', 'acidity',
   '{"fr":"L''acidité","en":"Acidity","nl":"Zuurheid","es":"Acidez"}',
   '{"fr":"acidité","en":"acidity","nl":"zuurheid","es":"acidez"}', '[]', true, 20),
  ('base', 'jar', 'intensity',
   '{"fr":"L''intensité du goût","en":"Flavour intensity","nl":"Smaakintensiteit","es":"Intensidad del sabor"}',
   '{"fr":"intensité du goût","en":"flavour intensity","nl":"smaakintensiteit","es":"intensidad del sabor"}', '[]', true, 30),
  ('base', 'jar', 'carbonation',
   '{"fr":"La pétillance","en":"Fizziness","nl":"Prik (koolzuur)","es":"Burbujas (gas)"}',
   '{"fr":"pétillance","en":"fizziness","nl":"prik","es":"gas"}', '[]', true, 40),
  ('base', 'choice', 'aftertaste',
   '{"fr":"L''arrière-goût","en":"Aftertaste","nl":"Nasmaak","es":"Regusto"}',
   '{"fr":"arrière-goût","en":"aftertaste","nl":"nasmaak","es":"regusto"}',
   '[{"fr":"Agréable","en":"Pleasant","nl":"Aangenaam","es":"Agradable"},
     {"fr":"Neutre","en":"Neutral","nl":"Neutraal","es":"Neutro"},
     {"fr":"Désagréable","en":"Unpleasant","nl":"Onaangenaam","es":"Desagradable"}]', true, 50),
  ('base', 'choice', 'purchase',
   '{"fr":"Achèteriez-vous cette version ?","en":"Would you buy this version?","nl":"Zou u deze versie kopen?","es":"¿Compraría esta versión?"}',
   '{"fr":"intention d''achat","en":"purchase intent","nl":"koopintentie","es":"intención de compra"}',
   '[{"fr":"Oui, sans hésiter","en":"Yes, definitely","nl":"Ja, zeker","es":"Sí, sin duda"},
     {"fr":"Peut-être","en":"Maybe","nl":"Misschien","es":"Quizás"},
     {"fr":"Non","en":"No","nl":"Nee","es":"No"}]', false, 60),

  -- Bière -------------------------------------------------------------
  ('biere', 'jar', 'bitterness',
   '{"fr":"L''amertume","en":"Bitterness","nl":"Bitterheid","es":"Amargor"}',
   '{"fr":"amertume","en":"bitterness","nl":"bitterheid","es":"amargor"}', '[]', true, 10),
  ('biere', 'jar', 'body',
   '{"fr":"La rondeur en bouche","en":"Body (roundness)","nl":"Body (volheid in de mond)","es":"Cuerpo (redondez)"}',
   '{"fr":"rondeur","en":"body","nl":"body","es":"cuerpo"}', '[]', true, 20),
  ('biere', 'jar', 'hop_aroma',
   '{"fr":"L''arôme de houblon","en":"Hop aroma","nl":"Hoparoma","es":"Aroma a lúpulo"}',
   '{"fr":"arôme de houblon","en":"hop aroma","nl":"hoparoma","es":"aroma a lúpulo"}', '[]', true, 30),
  ('biere', 'jar', 'finish',
   '{"fr":"La longueur en finale","en":"Length of the finish","nl":"Lengte van de afdronk","es":"Persistencia del final"}',
   '{"fr":"finale","en":"finish","nl":"afdronk","es":"final"}', '[]', true, 40),

  -- Thé glacé ---------------------------------------------------------
  ('the_glace', 'jar', 'infusion',
   '{"fr":"L''intensité d''infusion","en":"Brew strength","nl":"Sterkte van de thee","es":"Intensidad de la infusión"}',
   '{"fr":"infusion","en":"brew strength","nl":"theesterkte","es":"infusión"}', '[]', true, 10),
  ('the_glace', 'jar', 'astringency',
   '{"fr":"L''astringence (sensation sèche en bouche)","en":"Astringency (dry feeling in the mouth)","nl":"Wrangheid (droog gevoel in de mond)","es":"Astringencia (sensación seca en boca)"}',
   '{"fr":"astringence","en":"astringency","nl":"wrangheid","es":"astringencia"}', '[]', true, 20),

  -- Cold brew ---------------------------------------------------------
  ('cold_brew', 'jar', 'roast',
   '{"fr":"La note de torréfaction","en":"Roast character","nl":"Brandingstoon","es":"Nota de tostado"}',
   '{"fr":"torréfaction","en":"roast","nl":"branding","es":"tostado"}', '[]', true, 10),
  ('cold_brew', 'jar', 'coffee_bitterness',
   '{"fr":"L''amertume","en":"Bitterness","nl":"Bitterheid","es":"Amargor"}',
   '{"fr":"amertume","en":"bitterness","nl":"bitterheid","es":"amargor"}', '[]', true, 20),

  -- Limonade ----------------------------------------------------------
  ('limonade', 'jar', 'freshness',
   '{"fr":"La sensation de fraîcheur","en":"Freshness","nl":"Frisheid","es":"Sensación de frescor"}',
   '{"fr":"fraîcheur","en":"freshness","nl":"frisheid","es":"frescor"}', '[]', true, 10),
  ('limonade', 'jar', 'fruit',
   '{"fr":"L''intensité du fruit","en":"Fruit intensity","nl":"Fruitintensiteit","es":"Intensidad de la fruta"}',
   '{"fr":"intensité du fruit","en":"fruit intensity","nl":"fruitintensiteit","es":"intensidad de la fruta"}', '[]', true, 20),

  -- Hard seltzer ------------------------------------------------------
  ('hard_seltzer', 'jar', 'alcohol',
   '{"fr":"L''alcool ressenti","en":"Perceived alcohol","nl":"Waargenomen alcohol","es":"Alcohol percibido"}',
   '{"fr":"alcool ressenti","en":"perceived alcohol","nl":"alcohol","es":"alcohol percibido"}', '[]', true, 10),
  ('hard_seltzer', 'jar', 'sweetness_feel',
   '{"fr":"La sucrosité (sensation sucrée)","en":"Perceived sweetness","nl":"Zoetigheid (zoet gevoel)","es":"Sensación dulce"}',
   '{"fr":"sucrosité","en":"perceived sweetness","nl":"zoetigheid","es":"sensación dulce"}', '[]', true, 20),

  -- Bissap / Maté -----------------------------------------------------
  ('bissap_mate', 'jar', 'botanical',
   '{"fr":"L''intensité de la plante (hibiscus, maté…)","en":"Botanical intensity (hibiscus, mate…)","nl":"Intensiteit van de plant (hibiscus, maté…)","es":"Intensidad de la planta (hibisco, mate…)"}',
   '{"fr":"intensité de la plante","en":"botanical intensity","nl":"plantintensiteit","es":"intensidad de la planta"}', '[]', true, 10),

  -- Autre -------------------------------------------------------------
  ('autre', 'text', 'evokes',
   '{"fr":"Qu''est-ce que cette version vous évoque ?","en":"What does this version remind you of?","nl":"Waar doet deze versie u aan denken?","es":"¿Qué le evoca esta versión?"}',
   '{"fr":"évocation","en":"evocation","nl":"associatie","es":"evocación"}', '[]', false, 10);
end;
$$;

-- ---------------------------------------------------------------------
-- Questionnaire de démonstration : code DEMO-01 (limonade)
-- ---------------------------------------------------------------------
do $$
declare
  v_id uuid;
  v_questions jsonb;
  qid jsonb;  -- clé technique -> id de question
  v_answers jsonb;
  persona int;
  can text;
  -- Réponses fictives : pour chaque canette, 3 dégustateurs.
  -- Ordre : sucre, acidité, intensité, pétillance, fraîcheur, fruit, arrière-goût(0/1/2), note /9
  demo jsonb := '{
    "A": [["low","ok","low","ok","ok","low",1,5],["low","ok","low","high","ok","low",1,6],["ok","ok","low","ok","ok","ok",0,6]],
    "B": [["ok","high","ok","ok","ok","ok",0,7],["ok","high","ok","ok","high","ok",0,8],["ok","ok","ok","ok","ok","ok",0,8]],
    "C": [["high","ok","ok","ok","low","ok",2,4],["high","low","high","ok","low","ok",1,5],["ok","ok","ok","low","ok","high",1,6]],
    "D": [["ok","high","high","high","ok","high",2,5],["low","high","high","ok","ok","high",1,6],["ok","high","high","ok","ok","ok",2,5]]
  }';
  comments jsonb := '{
    "A": ["Agréable mais un peu fade.", "", "Bonne base, manque de peps."],
    "B": ["Ma préférée, très équilibrée.", "Un poil trop acide pour moi.", ""],
    "C": ["Trop sucrée.", "", "Le citron vert se perd."],
    "D": ["Très intense, presque trop.", "Arrière-goût un peu amer.", ""]
  }';
  rankings jsonb := '[["B","A","D","C"],["B","D","A","C"],["B","C","A","D"]]';
  names jsonb := '["Démo — Julie","Démo — Marc","Démo — Sofia"]';
  keys text[] := array['sweetness','acidity','intensity','carbonation','freshness','fruit'];
  vals jsonb;
  cans_obj jsonb;
  qmap jsonb;
  i int;
begin
  if exists (select 1 from public.questionnaires where access_code = 'DEMO01') then
    raise notice 'Démo déjà présente.';
    return;
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', q.id, 'module', q.module, 'kind', q.kind, 'key', q.key, 'label', q.label,
           'short', q.short, 'options', q.options, 'multiple', q.multiple)
         order by case when q.module = 'base' then 0 else 1 end, q.position)
    into v_questions
  from public.questions q
  where q.module in ('base', 'limonade') and q.default_on and not q.archived;

  select jsonb_object_agg(q ->> 'key', q ->> 'id') into qid
  from jsonb_array_elements(v_questions) q;

  insert into public.questionnaires (client_name, project_name, beverage_type, iterations, questions, access_code, created_by)
  values (
    'Démo PotionLab',
    'Limonade citron vert & gingembre',
    'limonade',
    '[{"letter":"A","change":"Recette de référence : citron vert, gingembre doux, sucre de canne."},
      {"letter":"B","change":"Sucre réduit de 15 %, un peu plus de citron vert."},
      {"letter":"C","change":"Version plus douce : sirop d''agave à la place du sucre de canne."},
      {"letter":"D","change":"Gingembre doublé et pointe de piment pour plus de caractère."}]',
    v_questions,
    'DEMO01',
    'demo'
  ) returning id into v_id;

  for persona in 0..2 loop
    cans_obj := '{}';
    foreach can in array array['A','B','C','D'] loop
      vals := demo -> can -> persona;
      qmap := '{}';
      for i in 1..6 loop
        qmap := qmap || jsonb_build_object(qid ->> keys[i], vals ->> (i - 1));
      end loop;
      qmap := qmap || jsonb_build_object(qid ->> 'aftertaste', (vals ->> 6)::int);
      cans_obj := cans_obj || jsonb_build_object(can, jsonb_build_object(
        'overall', (vals ->> 7)::int,
        'q', qmap,
        'comment', comments -> can ->> persona
      ));
    end loop;
    v_answers := jsonb_build_object(
      'cans', cans_obj,
      'ranking', rankings -> persona,
      'keep', case persona
                when 0 then '{"A":"La douceur","B":"L''équilibre général","C":"","D":"Le gingembre"}'::jsonb
                when 1 then '{"A":"","B":"Le sucre","C":"","D":"Le côté épicé"}'::jsonb
                else '{"A":"Le citron vert","B":"Tout","C":"La rondeur","D":""}'::jsonb end,
      'general_comment', case persona
                when 0 then 'B est top. Un peu plus de gingembre comme dans D serait parfait.'
                when 1 then 'Belle progression, B se démarque nettement.'
                else 'B avec un peu moins d''acidité et ce serait la bonne.' end
    );
    insert into public.responses (questionnaire_id, respondent_token, answers, step, lang,
                                  respondent_name, consent, submitted_at, created_at, updated_at)
    values (v_id, gen_random_uuid(), v_answers, 99, 'fr', names ->> persona, true,
            now() - make_interval(hours => (3 - persona) * 5), now() - make_interval(hours => (3 - persona) * 6),
            now() - make_interval(hours => (3 - persona) * 5));
  end loop;
end;
$$;
