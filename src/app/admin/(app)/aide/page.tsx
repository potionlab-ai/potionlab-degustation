import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Mode d'emploi · Admin PotionLab" };

const STEPS = [
  {
    title: "Créer un questionnaire (5 minutes)",
    items: [
      <>
        Cliquez sur <b>Nouveau questionnaire</b>.
      </>,
      <>
        <b>1. Client et projet</b> : nom du client, nom du projet, type de boisson. Les questions du type choisi
        (ex. Bière : amertume, rondeur…) s&apos;ajoutent toutes seules.
      </>,
      <>
        <b>2. Ce qui change</b> : une phrase courte par canette (A = référence, B = sucre −10 %…). Le client la lit
        avant de goûter.
      </>,
      <>
        <b>3. Questions</b> : cochez ou décochez. L&apos;appréciation globale (1 à 9) et le commentaire libre sont
        toujours posés.
      </>,
      <>
        <b>4. Sur mesure</b> (facultatif) : ajoutez une question propre à ce client (ex. « La note de framboise »).
      </>,
      <>
        Cliquez sur <b>Créer et générer le code</b>.
      </>,
    ],
  },
  {
    title: "Préparer la boîte",
    items: [
      <>
        Le code (ex. <span className="font-mono font-semibold">K7P-M4X</span>) s&apos;affiche en grand :{" "}
        <b>recopiez-le au stylo</b> sur la carte, en majuscules. Pas de risque de confusion : il ne contient jamais
        0/O ni 1/I/L.
      </>,
      <>
        Le QR code imprimé est le même pour tous : le client le scanne, tape son code et arrive sur son
        questionnaire.
      </>,
      <>
        Pour vérifier : bouton <b>Voir comme le client</b>.
      </>,
    ],
  },
  {
    title: "Suivre et lire les résultats",
    items: [
      <>
        Le <b>tableau de bord</b> montre le statut de chaque boîte : <b>Envoyé</b> (pas encore ouvert),{" "}
        <b>Commencé</b>, <b>Terminé</b>.
      </>,
      <>
        Ouvrez un questionnaire : la <b>synthèse automatique</b> donne la version préférée et, pour chaque
        canette, ce qu&apos;il faut <b className="text-[#1f7a58]">garder</b> (✓) ou{" "}
        <b className="text-[#b23f1c]">corriger</b> (↓ réduire, ↑ augmenter).
      </>,
      <>
        Règle : un critère est « à garder » quand au moins 50 % des dégustateurs le trouvent « juste bien ». Sinon,
        on suit la majorité (« trop » → réduire, « pas assez » → augmenter).
      </>,
      <>
        Les barres montrent la répartition <b>Pas assez</b> (bleu) / <b>Juste bien</b> (gris) / <b>Trop</b>{" "}
        (orange) pour chaque critère.
      </>,
      <>
        Plusieurs personnes peuvent répondre avec le même code (une équipe qui goûte ensemble) : les pourcentages
        les regroupent.
      </>,
    ],
  },
  {
    title: "Partager et ranger",
    items: [
      <>
        <b>PDF</b> : rapport propre à envoyer au client ou au patron. <b>CSV</b> : toutes les réponses, à ouvrir
        dans Excel.
      </>,
      <>
        <b>Dupliquer</b> : repartir d&apos;un ancien questionnaire (nouvelle itération, autre client). Un nouveau
        code est créé.
      </>,
      <>
        <b>Archiver</b> : le code ne fonctionne plus, les résultats restent consultables.
      </>,
      <>
        Une réponse de test ? Supprimez-la dans la liste « Dégustateurs » (icône corbeille).
      </>,
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader kicker="Pour l'équipe" title="Mode d'emploi" />
      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <section key={s.title} className="card p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="bg-brand flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <ul className="space-y-2 text-[15px] leading-relaxed text-ink/90">
              {s.items.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-rose" aria-hidden />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Pour modifier les questions proposées par défaut : <Link href="/admin/questions" className="font-medium text-rose underline-offset-2 hover:underline">Bibliothèque de questions</Link>.
      </p>
    </>
  );
}
