# Mettre en ligne le questionnaire de dégustation PotionLab

Guide pas à pas, sans connaissances techniques. Comptez **45 minutes** la première fois. Tout est **gratuit**.

| Service | À quoi il sert | Analogie |
|---|---|---|
| **GitHub** | Garde le code de l'application | Le classeur des plans |
| **Supabase** | Stocke les questionnaires et les réponses, gère les connexions admin | L'entrepôt fermé à clé |
| **Netlify** | Fait tourner le site et le rend accessible sur Internet | La vitrine |

> Pourquoi Netlify plutôt que Vercel ? L'offre gratuite de Vercel est réservée à un usage non commercial et refuse
> les dépôts privés d'une organisation GitHub. Celle de Netlify accepte les deux.

---

## Étape 1 — GitHub ✅ (déjà fait)
Le code est sur `github.com/potionlab-ai/potionlab-degustation`.

---

## Étape 2 — Supabase (la base de données)

### 2.1 Projet ✅ (déjà fait)
Région Europe, mot de passe de la base gardé en lieu sûr.

### 2.2 Installer la base (1 copier-coller)
1. Sur GitHub, ouvrez le fichier `supabase/INSTALLATION.sql`, puis cliquez l'icône **Copy raw file** (deux carrés, en haut à droite du fichier).
2. Dans Supabase, menu de gauche : **SQL Editor** → **New query** → collez → **Run** (ou Ctrl/Cmd + Entrée).
3. Si Supabase vous avertit d'une « opération potentiellement destructive », confirmez : **Run this query**.
   ✅ « Success. No rows returned ».

### 2.3 Dire qui est admin
Dans **SQL Editor** → **New query**, collez le texte suivant en mettant les vraies adresses (en minuscules), puis **Run** :
```sql
insert into public.admins (email) values
  ('votre.adresse@potionlab.ai'),
  ('adresse.de.david@potionlab.ai'),
  ('adresse.du.mixologue@potionlab.ai')
on conflict do nothing;
```

### 2.4 Créer les comptes admin
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email (le même qu'au point 2.3) + mot de passe, cochez **Auto Confirm User** → **Create user**.
3. Recommencez pour chaque personne.

### 2.5 Fermer les inscriptions (sécurité)
**Authentication** → **Sign In / Providers** → décochez **Allow new users to sign up** → **Save**.

### 2.6 Récupérer les 2 clés
Bouton **Connect** en haut de la page (ou **Project Settings** → **API Keys**). Notez :
- **Project URL**, par exemple `https://abcdxyz.supabase.co`
- **Publishable key**, qui commence par `sb_publishable_…` (sur les anciens écrans : **anon public key**)

> ⚠️ Ne copiez **jamais** la clé « secret » ou « service_role ».

---

## Étape 3 — Netlify (la mise en ligne)

1. Allez sur **netlify.com** → **Sign up** → **GitHub** → autorisez Netlify.
2. **Add new project** (ou **Add new site**) → **Import an existing project** → **GitHub**.
3. GitHub demande à quels dépôts Netlify peut accéder : choisissez l'organisation **potionlab-ai**, puis **Only select repositories** → `potionlab-degustation` → **Install**.
4. Sélectionnez `potionlab-degustation`. Netlify reconnaît tout seul Next.js : ne touchez pas aux réglages de build.
5. **Environment variables** → **Add environment variables** → ajoutez les 2 lignes :

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la Project URL (étape 2.6) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la Publishable key (étape 2.6) |

6. **Deploy**, puis patientez 2 à 4 minutes. 🎉 Netlify affiche l'adresse du site, par exemple `potionlab-degustation.netlify.app`.
   Pour une adresse plus jolie : **Site configuration** → **Change site name** → `potionlab-degustation`.

### 3.1 Tester (5 minutes)
- Sur l'adresse du site, tapez `demo-01` : vous devez arriver sur « Limonade citron vert & gingembre ».
- Sur `…/admin`, connectez-vous avec un compte de l'étape 2.4 : le tableau de bord affiche la démo.
- Créez un questionnaire test, cliquez « Voir comme le client », répondez jusqu'au bout, puis vérifiez les résultats et le PDF.

### 3.2 Dire à Supabase où vit le site
Supabase → **Authentication** → **URL Configuration** → **Site URL** : collez l'adresse Netlify → **Save**.

---

## Étape 4 — Pour David : brancher le QR code

### 4.1 Redirection `potionlab.ai/degustation` (indispensable)
Le site potionlab.ai tourne sur Webflow :
1. Webflow → **Site settings** → **Publishing** → **301 redirects**.
2. Old path : `/degustation`. Redirect to : l'adresse du site (par exemple `https://potionlab-degustation.netlify.app`).
3. **Add redirect path**, puis **Publish**.

✅ En scannant le QR de la boîte, on doit arriver sur « Bienvenue au labo ».

### 4.2 Adresse `degustation.potionlab.ai` (facultatif)
1. Netlify → **Domain management** → **Add a domain** → `degustation.potionlab.ai`.
2. Chez le gestionnaire du domaine potionlab.ai, créez l'enregistrement **CNAME** indiqué par Netlify : `degustation` → `potionlab-degustation.netlify.app`.
3. Netlify active le HTTPS automatiquement. Mettez ensuite à jour la redirection Webflow (4.1) et la Site URL Supabase (3.2).

---

## Étape 5 — Le vrai logo
- **Site** : remplacez `public/logo.svg` dans GitHub (**Add file → Upload files**, même nom). Netlify remet le site à jour tout seul.
- **PDF** (facultatif) : déposez une version PNG sous `src/assets/logo-pdf.png`.

---

## Au quotidien
- **Toute modification envoyée sur GitHub** est mise en ligne automatiquement par Netlify.
- **Changer un texte côté client** : fichiers `messages/fr.json`, `en.json`, `nl.json`, `es.json`.
- **Ajouter ou retirer un admin** : étapes 2.3 et 2.4.
- **Mot de passe oublié** : Supabase → Authentication → Users → la personne → **Send password recovery**, ou supprimez-la puis recréez-la.
- **Mise en veille** : Supabase gratuit se met en pause après 7 jours sans activité. Une tâche Netlify le réveille chaque jour (fichier `netlify/functions/keepalive.mts`) : rien à faire.

## En cas de souci
| Symptôme | Solution |
|---|---|
| « Ce code ne correspond à aucune dégustation » pour un bon code | Le questionnaire est-il archivé ? |
| Le client voit « Trop d'essais » | 8 codes faux en 15 minutes : il faut attendre 15 minutes. |
| Impossible de se connecter à l'admin | L'adresse est-elle dans la table admins (2.3) **et** dans Authentication > Users (2.4) ? |
| Erreur ou page vide après la mise en ligne | Vérifiez les 2 variables Netlify (aucune espace en trop), puis **Deploys → Trigger deploy → Clear cache and deploy site**. |
