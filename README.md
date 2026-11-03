# PotionLab · Questionnaire de dégustation

Application web du **Formulation Kit (Explorer Edition)** : le client scanne le QR de sa boîte test, tape le code
écrit sur la carte, goûte les canettes A → D et donne son avis. L'équipe crée les questionnaires et lit les
résultats dans l'espace admin.

- **Mise en ligne** : [`docs/GUIDE-MISE-EN-LIGNE.md`](docs/GUIDE-MISE-EN-LIGNE.md)
- **Mode d'emploi admin** : [`docs/MODE-EMPLOI-ADMIN.md`](docs/MODE-EMPLOI-ADMIN.md) (aussi dans l'app : `/admin/aide`)

## Organisation du code

| Dossier / fichier | Contenu |
|---|---|
| `messages/*.json` | **Tous les textes du parcours client** (fr, en, nl, es) |
| `public/logo.svg` | Logo (provisoire : à remplacer par le vrai) |
| `src/components/tasting/` | Parcours client (accueil, canettes, verdict, merci) |
| `src/app/admin/` | Espace admin (tableau de bord, création, résultats, bibliothèque) |
| `src/lib/results.ts` | Calcul des pourcentages et synthèse « À garder / À corriger » |
| `src/lib/pdf/` | Rapport PDF |
| `supabase/INSTALLATION.sql` | **Installation complète de la base** (à coller dans Supabase) |
| `supabase/migrations/` | Les mêmes, en deux parties : structure + sécurité (1), données de départ (2) |
| `supabase/03_admins.sql` | Liste des emails autorisés dans l'admin |

## Sécurité
- Les tables sont protégées par **RLS** : un visiteur anonyme ne peut rien lire directement.
- Le client passe uniquement par 3 fonctions (`client_open`, `client_save`, `client_submit`) qui exigent son code.
  Il ne voit que **son** questionnaire et ne peut jamais lire les réponses des autres.
- **Anti-devinette** : après 8 codes faux en 15 minutes depuis la même adresse IP, l'accès est bloqué 15 minutes
  (et au-delà de 300 échecs en 10 minutes, tous appareils confondus). Les codes font 6 caractères parmi 31,
  soit environ 887 millions de combinaisons.
- Admin : connexion Supabase (email + mot de passe), puis vérification de l'email dans la table `admins`.

## Développement local (pour un développeur)
Sans variables Supabase, l'app fonctionne avec une base PostgreSQL locale qui imite Supabase :
```bash
psql -c "create database potionlab"
psql -d potionlab -f supabase/local/00_supabase_shim.sql -f supabase/migrations/0001_schema.sql \
     -f supabase/migrations/0002_seed.sql -f supabase/local/99_local_admin.sql
LOCAL_DATABASE_URL=postgres://postgres@localhost:5432/potionlab npm run dev
```
Admin local : `admin@potionlab.local` / `potionlab`. Code de démo : `DEMO-01`.

Stack : Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase · Netlify.
