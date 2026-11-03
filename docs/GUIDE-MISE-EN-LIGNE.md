# Mettre en ligne le questionnaire de dégustation PotionLab

Guide pas à pas, sans connaissances techniques. Comptez **45 minutes** la première fois.

On va brancher trois services gratuits :

| Service | À quoi il sert | Analogie |
|---|---|---|
| **GitHub** | Garde le code de l'application | Le classeur des plans |
| **Supabase** | Stocke les questionnaires et les réponses, gère les connexions admin | L'entrepôt fermé à clé |
| **Vercel** | Fait tourner le site et le rend accessible sur Internet | La vitrine |

> 💡 Gardez un gestionnaire de mots de passe ouvert (ou une note sécurisée) : vous allez créer 2 ou 3 mots de passe.

---

## Étape 1 — GitHub (le code)

1. Connectez-vous au compte GitHub de la société.
2. En haut à droite : **+** → **New repository**.
3. Nom : `potionlab-degustation`. Visibilité : **Private**. Ne cochez **rien** d'autre (pas de README).
4. **Create repository**.
5. Prévenez Claude : « le dépôt est branché ». Claude y envoie tout le code.

✅ Vous devez voir les dossiers `src`, `supabase`, `docs`… dans le dépôt.

---

## Étape 2 — Supabase (la base de données)

### 2.1 Créer le compte et le projet
1. Allez sur **supabase.com** → **Start your project** → inscrivez-vous avec **production@potionlab.ai**, puis confirmez l'email reçu.
2. **New project** :
   - Organization : `PotionLab` (plan **Free**)
   - Project name : `potionlab-degustation`
   - Database password : cliquez **Generate a password**, puis **enregistrez-le** dans votre gestionnaire.
   - Region : **Europe (Frankfurt ou Paris)**. Les données restent en Europe, ce qui est important pour le RGPD.
3. **Create new project**, puis patientez environ 2 minutes.

### 2.2 Installer la base (3 copier-coller)
Dans le menu de gauche : **SQL Editor** → **New query**.

1. Ouvrez sur GitHub le fichier `supabase/migrations/0001_schema.sql`, cliquez sur l'icône **Copy raw file**, collez dans Supabase, puis **Run**.
   ✅ « Success. No rows returned ».
2. **New query** → même chose avec `supabase/migrations/0002_seed.sql` → **Run**.
   Cela installe la bibliothèque de questions et le questionnaire de démo **DEMO-01**.
3. **New query** → collez `supabase/03_admins.sql`, **remplacez les 3 adresses** par les vraies (la vôtre, celle du patron, celle du mixologue), puis **Run**.

### 2.3 Créer les comptes admin
1. Menu **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email + mot de passe, cochez **Auto Confirm User** → **Create user**.
3. Recommencez pour chaque personne (mêmes adresses qu'au point 2.2.3).

### 2.4 Fermer les inscriptions (sécurité)
**Authentication** → **Sign In / Providers** (ou **Settings**) → décochez **Allow new users to sign up** → **Save**.
Seules les personnes que vous ajoutez vous-même pourront se connecter.

### 2.5 Récupérer les 2 clés
Bouton **Connect** en haut (ou **Project Settings** → **API Keys**). Notez :
- **Project URL**, par exemple `https://abcdxyz.supabase.co`
- **Publishable key**, qui commence par `sb_publishable_…` (sur les anciens écrans : **anon public key**)

> ⚠️ Ne copiez **jamais** la clé « secret » ou « service_role » : elle ne doit aller nulle part.

---

## Étape 3 — Vercel (la mise en ligne)

1. Allez sur **vercel.com** → **Sign up** → **Continue with GitHub** (compte de la société) → autorisez l'accès au dépôt `potionlab-degustation`.
2. **Add New…** → **Project** → à côté de `potionlab-degustation`, cliquez **Import**.
3. Ouvrez **Environment Variables** et ajoutez les 2 lignes :

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la Project URL (étape 2.5) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la Publishable key (étape 2.5) |

4. **Deploy**, puis patientez environ 2 minutes. 🎉 Vercel affiche l'adresse du site, par exemple `potionlab-degustation.vercel.app`.

> ℹ️ L'offre gratuite de Vercel (« Hobby ») est prévue pour un usage non commercial. Pour un outil d'entreprise, Vercel demande en principe l'offre Pro (environ 20 $/mois). À valider avec votre patron. Le site fonctionne de la même façon dans les deux cas.

### 3.1 Tester (5 minutes)
- `https://VOTRE-ADRESSE.vercel.app` : tapez `demo-01` → vous devez arriver sur « Limonade citron vert & gingembre ».
- `https://VOTRE-ADRESSE.vercel.app/admin` : connectez-vous avec un compte de l'étape 2.3 → le tableau de bord affiche la démo et ses 3 réponses fictives.
- Créez un questionnaire test, ouvrez « Voir comme le client », répondez jusqu'au bout, puis regardez les résultats et téléchargez le PDF.

### 3.2 Dire à Supabase où vit le site
Supabase → **Authentication** → **URL Configuration** → **Site URL** : collez l'adresse Vercel → **Save**.

---

## Étape 4 — Une jolie adresse et le QR code

### 4.1 Adresse `degustation.potionlab.ai` (recommandé)
1. Vercel → votre projet → **Settings** → **Domains** → ajoutez `degustation.potionlab.ai`.
2. Vercel indique un enregistrement **CNAME** à créer chez le gestionnaire du nom de domaine potionlab.ai (souvent la personne qui gère le site Webflow ou le registrar) : `degustation` → `cname.vercel-dns.com`.
3. Après quelques minutes, Vercel affiche « Valid Configuration ».

### 4.2 Redirection du QR code : `potionlab.ai/degustation`
Le site potionlab.ai tourne sur Webflow :
1. Webflow → **Site settings** → **Publishing** → **301 redirects**.
2. Old path : `/degustation`. Redirect to : `https://degustation.potionlab.ai` (ou l'adresse Vercel).
3. **Add redirect path**, puis **Publish** le site.

✅ Scannez le QR de la boîte avec votre téléphone : vous devez arriver sur « Bienvenue au labo ».

---

## Étape 5 — Le vrai logo
Le logo affiché aujourd'hui est provisoire.
- **Site** : remplacez le fichier `public/logo.svg` dans GitHub (bouton **Add file → Upload files**, même nom `logo.svg`). Vercel remet le site à jour tout seul en 1 à 2 minutes.
- **PDF** (facultatif) : déposez une version PNG du logo sous `src/assets/logo-pdf.png`.

---

## Au quotidien
- **Toute modification envoyée sur GitHub** est mise en ligne automatiquement par Vercel.
- **Changer un texte côté client** : fichiers `messages/fr.json`, `en.json`, `nl.json`, `es.json`.
- **Ajouter ou retirer un admin** : étape 2.3, plus le fichier `supabase/03_admins.sql`.
- **Mot de passe admin oublié** : Supabase → Authentication → Users → la personne → **Reset password** (ou supprimez-la puis recréez-la).
- **Mise en veille** : Supabase gratuit se met en pause après 7 jours sans activité. L'application le réveille automatiquement chaque matin (fichier `vercel.json`) : rien à faire.

## En cas de souci
| Symptôme | Solution |
|---|---|
| « Ce code ne correspond à aucune dégustation » pour un bon code | Vérifiez que le questionnaire n'est pas archivé. |
| Le client voit « Trop d'essais » | Il a tapé 8 codes faux en 15 minutes : il doit attendre 15 minutes. |
| Impossible de se connecter à l'admin | L'adresse est-elle dans `03_admins.sql` **et** dans Authentication > Users ? |
| Page blanche ou erreur après la mise en ligne | Vérifiez les 2 variables Vercel (aucune espace en trop), puis **Deployments → Redeploy**. |
