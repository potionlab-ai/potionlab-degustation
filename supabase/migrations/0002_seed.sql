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
