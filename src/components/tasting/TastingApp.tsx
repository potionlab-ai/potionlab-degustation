"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientRpc } from "@/lib/backend/client-rpc";
import { MESSAGES, detectLang, fmt, type Messages } from "@/lib/i18n";
import { formatCode, normalizeCode } from "@/lib/code";
import { beverageLabel } from "@/lib/modules";
import {
  LANGS,
  LETTERS,
  loc,
  type AnswerValue,
  type Answers,
  type CanAnswers,
  type JarValue,
  type Lang,
  type Letter,
  type PublicQuestionnaire,
  type Question,
} from "@/lib/types";
import {
  Bubbles,
  CanIcon,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCloud,
  IconDrop,
  IconLock,
  IconOrder,
  IconThermo,
} from "../icons";
import { ChoiceInput, JarInput, NineScale, TextArea } from "./inputs";
import { Ranking } from "./Ranking";

// ---------------------------------------------------------------------------
// Étapes : 0 = projet, 1..4 = canettes A..D, 5 = verdict, 99 = envoyé
// ---------------------------------------------------------------------------
const STEP_FINAL = 5;
const STEP_DONE = 99;

type Screen = "loading" | "welcome" | "flow" | "thanks" | "already";
type SaveState = "idle" | "saving" | "saved" | "offline";
type OpenResult = {
  error?: string;
  questionnaire?: PublicQuestionnaire;
  response?: { token: string; answers: Answers; step: number; submitted: boolean } | null;
  submitted_count?: number;
};

// ---------------------------------------------------------------------------
// Stockage sur l'appareil (protégé : le navigateur peut le refuser)
// ---------------------------------------------------------------------------
const LS_SESSION = "pl_session_v1";
const LS_LANG = "pl_lang";
const draftKey = (code: string, token: string) => `pl_draft_v1_${code}_${token}`;

function lsGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function lsDel(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
type Session = { code?: string; tokens?: Record<string, string> };

function newToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16),
  );
}

// ---------------------------------------------------------------------------
// Validation d'une canette : quelles questions obligatoires manquent ?
// ---------------------------------------------------------------------------
function isRequired(q: Question) {
  return q.kind === "jar" || q.kind === "scale9" || (q.kind === "choice" && !q.multiple);
}
function missingFor(can: CanAnswers | undefined, questions: Question[]): string[] {
  const miss: string[] = [];
  if (!can?.overall) miss.push("overall");
  for (const q of questions) {
    if (isRequired(q) && (can?.q?.[q.id] === undefined || can?.q?.[q.id] === null)) miss.push(q.id);
  }
  return miss;
}

// ===========================================================================
export default function TastingApp() {
  const [lang, setLangState] = useState<Lang>("fr");
  const m = MESSAGES[lang];
  const [screen, setScreen] = useState<Screen>("loading");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [qn, setQn] = useState<PublicQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [savedStep, setSavedStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);

  // Langue -----------------------------------------------------------------
  const setLang = (l: Lang) => {
    setLangState(l);
    lsSet(LS_LANG, l);
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Ouverture d'un questionnaire avec un code --------------------------------
  const open = useCallback(async (rawCode: string, opts: { silent?: boolean } = {}) => {
    const c = normalizeCode(rawCode);
    if (!c) {
      setCodeError("empty");
      return;
    }
    setBusy(true);
    setCodeError(null);
    const session = lsGet<Session>(LS_SESSION) ?? {};
    const known = session.tokens?.[c] ?? null;
    let res: OpenResult;
    try {
      res = await clientRpc<OpenResult>("client_open", { p_code: c, p_respondent: known });
    } catch {
      setBusy(false);
      setCodeError("network");
      if (opts.silent) setScreen("welcome");
      return;
    }
    setBusy(false);
    if (res.error || !res.questionnaire) {
      if (opts.silent) {
        lsSet(LS_SESSION, { ...session, code: undefined });
        setScreen("welcome");
        return;
      }
      setCodeError(res.error ?? "invalid_code");
      return;
    }
    const r = res.response;
    const tok = r?.token ?? known ?? newToken();
    lsSet(LS_SESSION, { code: c, tokens: { ...(session.tokens ?? {}), [c]: tok } });
    setCode(c);
    setToken(tok);
    setQn(res.questionnaire);

    if (r?.submitted) {
      setStep(STEP_DONE);
      setScreen("thanks");
      return;
    }
    if (!r && (res.submitted_count ?? 0) > 0 && !known) {
      setAnswers({});
      setSavedStep(0);
      setStep(0);
      setScreen("already");
      return;
    }
    // Brouillon local (plus récent) prioritaire sur celui du serveur
    const local = lsGet<{ answers: Answers; step: number }>(draftKey(c, tok));
    const a = local?.answers ?? r?.answers ?? {};
    const s = Math.min(Math.max(local?.step ?? 0, r?.step ?? 0), STEP_FINAL);
    setAnswers(a);
    setSavedStep(s);
    setStep(0);
    setScreen("flow");
  }, []);

  // Démarrage : langue mémorisée, code mémorisé ou présent dans l'adresse ------
  useEffect(() => {
    const storedLang = lsGet<Lang>(LS_LANG);
    // Lecture du stockage de l'appareil après le premier rendu (évite les écarts serveur/navigateur)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(storedLang && LANGS.includes(storedLang) ? storedLang : detectLang());
    const urlCode = new URLSearchParams(window.location.search).get("code");
    const session = lsGet<Session>(LS_SESSION);
    const c = urlCode || session?.code;
    if (c) {
      setCodeInput(formatCode(c));
      open(c, { silent: true });
    } else {
      setScreen("welcome");
    }
  }, [open]);

  // Sauvegarde automatique ---------------------------------------------------
  useEffect(() => {
    if (!dirty.current || !code || !token || screen !== "flow") return;
    const s = Math.max(step, savedStep);
    lsSet(draftKey(code, token), { answers, step: s });
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await clientRpc<{ ok?: boolean; error?: string }>("client_save", {
          p_code: code,
          p_respondent: token,
          p_answers: answers,
          p_step: s,
          p_lang: lang,
        });
        if (res.error === "already_submitted") {
          setScreen("thanks");
          return;
        }
        setSaveState(res.ok ? "saved" : "offline");
      } catch {
        setSaveState("offline");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [answers, step, savedStep, code, token, lang, screen]);

  const update = (fn: (a: Answers) => Answers) => {
    dirty.current = true;
    setAnswers((a) => fn(a));
  };
  const goTo = (s: number) => {
    dirty.current = true;
    setStep(s);
    setSavedStep((prev) => Math.max(prev, s));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const restartForSomeoneElse = () => {
    const tok = newToken();
    const session = lsGet<Session>(LS_SESSION) ?? {};
    lsSet(LS_SESSION, { code, tokens: { ...(session.tokens ?? {}), [code]: tok } });
    setToken(tok);
    setAnswers({});
    setSavedStep(0);
    setStep(0);
    dirty.current = false;
    setScreen("flow");
    window.scrollTo({ top: 0 });
  };

  const changeCode = () => {
    const session = lsGet<Session>(LS_SESSION) ?? {};
    lsSet(LS_SESSION, { ...session, code: undefined });
    setQn(null);
    setCode("");
    setCodeInput("");
    setScreen("welcome");
  };

  const submit = async (consent: boolean): Promise<string | null> => {
    try {
      const res = await clientRpc<{ ok?: boolean; error?: string }>("client_submit", {
        p_code: code,
        p_respondent: token,
        p_answers: answers,
        p_lang: lang,
        p_name: answers.name ?? "",
        p_email: answers.email ?? "",
        p_consent: consent,
      });
      if (res.ok || res.error === "already_submitted") {
        lsDel(draftKey(code, token));
        dirty.current = false;
        setStep(STEP_DONE);
        setScreen("thanks");
        window.scrollTo({ top: 0 });
        return null;
      }
      return res.error ?? "error";
    } catch {
      return "network";
    }
  };

  // Rendu --------------------------------------------------------------------
  const wide = screen === "welcome";
  const viewKey = screen === "flow" ? `flow-${step}` : screen;
  return (
    <div className="flex min-h-dvh flex-col">
      <Header lang={lang} setLang={setLang} m={m} />
      <main
        className={`mx-auto w-full flex-1 px-4 pb-14 pt-6 sm:px-6 sm:pt-10 ${wide ? "max-w-6xl" : "max-w-2xl"}`}
      >
        <div key={viewKey} className="animate-rise">
          {screen === "loading" && <Loading m={m} />}
          {screen === "welcome" && (
            <Welcome
              m={m}
              value={codeInput}
              onChange={(v) => {
                setCodeInput(v);
                setCodeError(null);
              }}
              onSubmit={() => open(codeInput)}
              error={codeError}
              busy={busy}
            />
          )}
          {screen === "flow" && qn && step === 0 && (
            <ProjectIntro
              m={m}
              lang={lang}
              qn={qn}
              code={code}
              resumeStep={savedStep}
              onStart={() => goTo(savedStep > 0 ? savedStep : 1)}
              onChangeCode={changeCode}
            />
          )}
          {screen === "flow" && qn && step >= 1 && step <= 4 && (
            <CanStep
              key={step}
              m={m}
              lang={lang}
              qn={qn}
              letter={LETTERS[step - 1]}
              step={step}
              can={answers.cans?.[LETTERS[step - 1]]}
              saveState={saveState}
              onChange={(can) =>
                update((a) => ({ ...a, cans: { ...(a.cans ?? {}), [LETTERS[step - 1]]: can } }))
              }
              onBack={() => goTo(step - 1)}
              onNext={() => goTo(step + 1)}
            />
          )}
          {screen === "flow" && qn && step === STEP_FINAL && (
            <FinalStep
              m={m}
              qn={qn}
              answers={answers}
              saveState={saveState}
              update={update}
              onBack={() => goTo(4)}
              onSubmit={submit}
            />
          )}
          {screen === "thanks" && <Thanks m={m} onAnother={restartForSomeoneElse} />}
          {screen === "already" && (
            <Already m={m} onStart={restartForSomeoneElse} onChangeCode={changeCode} />
          )}
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1.5 px-4 pb-8 pt-4 text-center">
        <p className="text-brand text-[11px] font-semibold uppercase tracking-[0.28em]">{m.common.motto}</p>
        <p className="text-xs text-faint">
          Crafted by{" "}
          <a className="font-medium text-muted underline-offset-2 hover:underline" href="https://www.potionlab.ai">
            potionlab.ai
          </a>{" "}
          · Liège
        </p>
      </footer>
    </div>
  );
}

// ===========================================================================
// En-tête et éléments communs
// ===========================================================================
function Header({ lang, setLang, m }: { lang: Lang; setLang: (l: Lang) => void; m: Messages }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
      <a href="https://www.potionlab.ai" className="flex shrink-0 items-center gap-3" aria-label="PotionLab">
        {/* Logo : remplacer le fichier public/logo.svg */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="PotionLab" className="h-7 w-auto sm:h-8" />
        <span className="hidden border-l border-line pl-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted sm:inline">
          {m.common.tasting}
        </span>
      </a>
      <div role="group" aria-label={m.common.language} className="seg">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={l === lang}
            title={MESSAGES[l].langName}
            lang={l}
            className="min-w-9 uppercase"
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  );
}

function Loading({ m }: { m: Messages }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5" aria-busy="true">
      <div className="flex items-end gap-2">
        {LETTERS.map((l, i) => (
          <div key={l} className="animate-float" style={{ animationDelay: `${i * -0.4}s`, animationDuration: "1.6s" }}>
            <CanIcon letter={l} size={22} />
          </div>
        ))}
      </div>
      <p className="eyebrow">{m.common.loading}</p>
    </div>
  );
}

function Progress({ step, m, saveState }: { step: number; m: Messages; saveState: SaveState }) {
  const labels = [...LETTERS, "✓"];
  return (
    <div className="sticky top-2 z-20 mb-7 rounded-2xl border border-white/80 bg-white/80 px-4 pb-2.5 pt-3 shadow-[0_8px_30px_-14px_rgb(60_40_30/0.25)] backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="font-medium">{fmt(m.can.progress, { current: step, total: 5 })}</span>
        <SaveIndicator state={saveState} m={m} />
      </div>
      <div
        className="grid grid-cols-5 gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={step}
        aria-label={fmt(m.can.progress, { current: step, total: 5 })}
      >
        {labels.map((l, i) => (
          <div key={l} className="flex flex-col items-center gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className={`bg-brand h-full rounded-full transition-[width] duration-700 ease-out ${i < step ? "w-full" : "w-0"}`}
              />
            </div>
            <span
              className={`font-mono text-[10px] font-semibold ${i + 1 === step ? "text-rose" : i < step ? "text-ink/60" : "text-faint"}`}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaveIndicator({ state, m }: { state: SaveState; m: Messages }) {
  if (state === "idle") return <span />;
  const text = state === "saving" ? m.common.saving : state === "saved" ? m.common.saved : m.common.offline;
  return (
    <span className="inline-flex items-center gap-1" aria-live="polite">
      {state === "saved" ? (
        <IconCheck width={14} height={14} className="text-[#2f9e78]" />
      ) : (
        <IconCloud width={14} height={14} />
      )}
      {text}
    </span>
  );
}

function Section({
  title,
  aside,
  children,
  id,
  n,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
  id?: string;
  n?: number;
}) {
  return (
    <section className="card p-5 sm:p-7" aria-labelledby={id}>
      <div className="mb-5 flex items-baseline gap-3">
        {n != null && (
          <span className="font-mono text-xs font-semibold text-rose" aria-hidden>
            {String(n).padStart(2, "0")}
          </span>
        )}
        <h2 id={id} className="text-lg font-semibold leading-snug tracking-tight text-ink sm:text-xl">
          {title}
          {aside && <span className="ml-2 text-sm font-normal text-faint">({aside})</span>}
        </h2>
      </div>
      {children}
    </section>
  );
}

function NavButtons({
  m,
  onBack,
  onNext,
  nextLabel,
  nextIcon,
  disabled,
}: {
  m: Messages;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="mt-7 flex gap-3">
      <button type="button" className="btn-secondary" onClick={onBack} aria-label={m.can.back}>
        <IconArrowLeft />
        <span className="hidden sm:inline">{m.can.back}</span>
      </button>
      <button type="button" className="btn-primary flex-1" onClick={onNext} disabled={disabled}>
        {nextLabel}
        {nextIcon}
      </button>
    </div>
  );
}

// ===========================================================================
// 1. Accueil : saisie du code
// ===========================================================================
function Welcome({
  m,
  value,
  onChange,
  onSubmit,
  error,
  busy,
}: {
  m: Messages;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
  busy: boolean;
}) {
  const errText = error ? ((m.welcome.errors as Record<string, string>)[error] ?? m.welcome.errors.invalid_code) : null;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <div className="stagger">
        <p className="kicker kicker-bar">{m.welcome.kicker}</p>
        <h1 className="display mt-6 text-[2.75rem] leading-[0.98] sm:text-6xl lg:text-7xl">
          {m.welcome.title}
          <span className="text-brand">.</span>
        </h1>
        <p className="mt-4 text-xl font-light text-ink sm:text-2xl">{m.welcome.subtitle}</p>
        <p className="mt-3 max-w-md text-[17px] leading-relaxed text-muted">{m.welcome.intro}</p>
        <CansShowcase />
      </div>

      <div className="stagger">
        <form
          className="card relative overflow-hidden p-6 pt-8 sm:p-8 sm:pt-10"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <div className="bg-dots absolute inset-x-0 top-0 h-3 opacity-80" aria-hidden />
          <div className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor="code" className="block text-2xl font-semibold tracking-tight">
                {m.welcome.codeLabel}
              </label>
              <p id="code-help" className="mt-1 text-sm leading-snug text-muted">
                {m.welcome.codeHelp}
              </p>
            </div>
            {/* Rappel visuel : le code est écrit au stylo sur la carte */}
            <div
              className="mt-1 shrink-0 rotate-[-4deg] rounded-lg border border-line bg-white px-3 py-2 shadow-[0_6px_16px_-8px_rgb(60_40_30/0.35)]"
              aria-hidden
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-faint">{m.welcome.cardField}</p>
              <p className="hand -mt-0.5 text-[22px] leading-none">K7P-M4X</p>
            </div>
          </div>
          <input
            id="code"
            name="code"
            className={`input mt-5 h-16 text-center font-mono text-[26px] font-semibold uppercase tracking-[0.22em] sm:text-3xl ${
              errText ? "border-rose ring-4 ring-rose/15" : ""
            }`}
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 12))}
            placeholder={m.welcome.codePlaceholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={!!errText}
            aria-describedby="code-help code-error"
          />
          <p id="code-error" role="alert" className="mt-2 min-h-5 text-sm font-medium text-rose">
            {errText}
          </p>
          <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
            {busy ? m.welcome.checking : m.welcome.submit}
            {!busy && <IconArrowRight />}
          </button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-2 px-6 text-center text-xs text-muted">
          <IconLock width={14} height={14} className="shrink-0" />
          {m.welcome.privacy}
        </p>
      </div>
    </div>
  );
}

/** Les 4 canettes, légèrement flottantes, avec quelques bulles. */
function CansShowcase() {
  return (
    <div className="relative mt-8 h-[150px] max-w-lg sm:mt-10 sm:h-[176px] lg:mt-12 lg:h-[230px]">
      <div
        className="bg-dots absolute -left-4 bottom-0 h-14 w-[calc(100%+2rem)] opacity-50 [mask-image:radial-gradient(closest-side,black,transparent)]"
        aria-hidden
      />
      <Bubbles count={14} />
      <div className="relative flex h-full items-end gap-4 pb-3 sm:gap-5 lg:gap-7">
        {LETTERS.map((l, i) => (
          <div
            key={l}
            className="animate-float drop-shadow-[0_14px_14px_rgb(60_40_30/0.18)]"
            style={{ animationDelay: `${i * -1.4}s` }}
          >
            <CanIcon
              letter={l}
              size={i === 0 ? 62 : 54}
              className={`h-auto ${i === 0 ? "w-[62px] lg:w-[86px]" : "w-[54px] lg:w-[76px]"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// 2. Présentation du projet
// ===========================================================================
function ProjectIntro({
  m,
  lang,
  qn,
  code,
  resumeStep,
  onStart,
  onChangeCode,
}: {
  m: Messages;
  lang: Lang;
  qn: PublicQuestionnaire;
  code: string;
  resumeStep: number;
  onStart: () => void;
  onChangeCode: () => void;
}) {
  const how = [
    { icon: <IconThermo />, text: m.project.how1 },
    { icon: <IconOrder />, text: m.project.how2 },
    { icon: <IconDrop />, text: m.project.how3 },
  ];
  return (
    <div className="stagger space-y-5">
      <div className="px-1">
        <p className="kicker kicker-bar">{fmt(m.project.for, { client: qn.client_name })}</p>
        <h1 className="display mt-5 text-4xl leading-[1.05] sm:text-5xl">{qn.project_name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
            {beverageLabel(qn.beverage_type, lang)}
          </span>
          <span className="rounded-full border border-line bg-white/80 px-3 py-1 font-mono text-xs tracking-[0.18em] text-muted">
            {formatCode(code)}
          </span>
        </div>
      </div>

      <section className="card p-5 sm:p-7">
        <p className="eyebrow">{m.project.howTitle}</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {how.map((h, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl bg-paper/80 px-4 py-3.5 sm:flex-col sm:items-start sm:gap-2">
              <span className="flex items-center gap-2 text-rose">
                <span className="font-mono text-[11px] font-semibold">{String(i + 1).padStart(2, "0")}</span>
                {h.icon}
              </span>
              <span className="text-[15px] leading-snug text-ink">{h.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5 sm:p-7">
        <p className="eyebrow">{m.project.iterationsTitle}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LETTERS.map((l) => {
            const it = qn.iterations.find((x) => x.letter === l);
            return (
              <li key={l} className="flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3.5">
                <CanIcon letter={l} size={30} />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                    {m.can.iteration} {l}
                  </p>
                  <p className="hand text-[21px] leading-[1.15]">{it?.change || "—"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="pt-1">
        <p className="mb-4 text-center text-sm text-muted">{m.project.duration}</p>
        <button type="button" className="btn-primary w-full" onClick={onStart}>
          {resumeStep > 0 ? m.project.resume : m.project.start}
          <IconArrowRight />
        </button>
        <div className="mt-2 text-center">
          <button type="button" className="btn-ghost" onClick={onChangeCode}>
            {m.common.changeCode}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 3. Une canette
// ===========================================================================
function CanStep({
  m,
  lang,
  qn,
  letter,
  step,
  can,
  saveState,
  onChange,
  onBack,
  onNext,
}: {
  m: Messages;
  lang: Lang;
  qn: PublicQuestionnaire;
  letter: Letter;
  step: number;
  can?: CanAnswers;
  saveState: SaveState;
  onChange: (c: CanAnswers) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const jarQs = qn.questions.filter((q) => q.kind === "jar");
  const otherQs = qn.questions.filter((q) => q.kind !== "jar");
  const missing = useMemo(() => missingFor(can, qn.questions), [can, qn.questions]);
  const invalid = (id: string) => showErrors && missing.includes(id);
  const change = qn.iterations.find((x) => x.letter === letter)?.change ?? "";

  const setQ = (id: string, v: AnswerValue) => onChange({ ...can, q: { ...(can?.q ?? {}), [id]: v } });

  const next = () => {
    if (missing.length) {
      setShowErrors(true);
      requestAnimationFrame(() => {
        document.querySelector("[data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    onNext();
  };

  let n = 1;
  return (
    <div>
      <Progress step={step} m={m} saveState={saveState} />
      <div className="mb-7 flex items-center gap-5 px-1">
        <div className="animate-float drop-shadow-[0_12px_12px_rgb(60_40_30/0.18)]">
          <CanIcon letter={letter} size={52} />
        </div>
        <div className="min-w-0">
          <p className="kicker">
            {m.can.iteration} {letter}
          </p>
          <h1 className="display mt-1 text-4xl">{fmt(m.can.title, { letter })}</h1>
          {change && (
            <p className="mt-1.5 leading-tight">
              <span className="mr-2 align-middle text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                {m.can.whatChanges}
              </span>
              <span className="hand align-middle text-[22px]">{change}</span>
            </p>
          )}
        </div>
      </div>

      <div className="stagger space-y-4">
        <Section title={m.can.overallTitle} id="overall-title" n={n++}>
          <div data-invalid={invalid("overall") || undefined}>
            <NineScale
              value={can?.overall}
              onChange={(v) => onChange({ ...can, overall: v })}
              labels={m.can.hedonic}
              lowLabel={m.can.hedonic[0]}
              highLabel={m.can.hedonic[8]}
              placeholder={invalid("overall") ? m.can.required : m.can.pickNote}
              invalid={invalid("overall")}
              labelledBy="overall-title"
            />
          </div>
        </Section>

        {jarQs.length > 0 && (
          <Section title={m.can.jarTitle} n={n++}>
            <div className="space-y-1">
              {jarQs.map((q) => (
                <JarInput
                  key={q.id}
                  label={loc(q.label, lang)}
                  value={can?.q?.[q.id] as JarValue | undefined}
                  onChange={(v) => setQ(q.id, v)}
                  options={m.can.jar as Record<JarValue, string>}
                  invalid={invalid(q.id)}
                  requiredText={m.can.required}
                />
              ))}
            </div>
          </Section>
        )}

        {otherQs.length > 0 && (
          <Section title={m.can.moreTitle} n={n++}>
            <div className="space-y-4">
              {otherQs.map((q) => {
                const v = can?.q?.[q.id];
                if (q.kind === "choice")
                  return (
                    <ChoiceInput
                      key={q.id}
                      label={loc(q.label, lang)}
                      options={q.options.map((o) => loc(o, lang))}
                      multiple={q.multiple}
                      value={v as number | number[] | undefined}
                      onChange={(x) => setQ(q.id, x)}
                      invalid={invalid(q.id)}
                      requiredText={m.can.required}
                      multipleHint={m.can.multipleHint}
                    />
                  );
                if (q.kind === "scale9")
                  return (
                    <div
                      key={q.id}
                      data-invalid={invalid(q.id) || undefined}
                      className={`-mx-3 rounded-2xl p-3 ${invalid(q.id) ? "bg-blush/70" : ""}`}
                    >
                      <p id={`q-${q.id}`} className="mb-2 text-[15px] font-medium">
                        {loc(q.label, lang)}
                        {invalid(q.id) && <span className="ml-2 text-xs font-normal text-rose">{m.can.required}</span>}
                      </p>
                      <NineScale
                        value={v as number | undefined}
                        onChange={(x) => setQ(q.id, x)}
                        lowLabel={m.can.scaleLow}
                        highLabel={m.can.scaleHigh}
                        invalid={invalid(q.id)}
                        labelledBy={`q-${q.id}`}
                      />
                    </div>
                  );
                return (
                  <div key={q.id}>
                    <label htmlFor={`q-${q.id}`} className="mb-2 block text-[15px] font-medium">
                      {loc(q.label, lang)} <span className="text-sm font-normal text-faint">({m.can.optional})</span>
                    </label>
                    <TextArea
                      id={`q-${q.id}`}
                      value={v as string | undefined}
                      onChange={(x) => setQ(q.id, x)}
                      placeholder={m.can.textPlaceholder}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <Section title={fmt(m.can.commentLabel, { letter })} aside={m.can.optional} n={n++}>
          <TextArea
            value={can?.comment}
            onChange={(v) => onChange({ ...can, comment: v })}
            placeholder={m.can.commentPlaceholder}
          />
        </Section>
      </div>

      {showErrors && missing.length > 0 && (
        <p role="alert" className="mt-5 rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-rose">
          {fmt(m.can.missing, { count: missing.length })}
        </p>
      )}

      <NavButtons
        m={m}
        onBack={onBack}
        onNext={next}
        nextLabel={step < 4 ? m.can.next : m.can.toFinal}
        nextIcon={<IconArrowRight />}
      />
    </div>
  );
}

// ===========================================================================
// 4. Verdict final
// ===========================================================================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FinalStep({
  m,
  qn,
  answers,
  saveState,
  update,
  onBack,
  onSubmit,
}: {
  m: Messages;
  qn: PublicQuestionnaire;
  answers: Answers;
  saveState: SaveState;
  update: (fn: (a: Answers) => Answers) => void;
  onBack: () => void;
  onSubmit: (consent: boolean) => Promise<string | null>;
}) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Classement pré-rempli selon les notes données (modifiable)
  const [prefilled] = useState(!answers.ranking);
  const ranking: Letter[] = useMemo(() => {
    if (answers.ranking?.length === 4) return answers.ranking;
    return [...LETTERS].sort(
      (a, b) => (answers.cans?.[b]?.overall ?? 0) - (answers.cans?.[a]?.overall ?? 0),
    );
  }, [answers.ranking, answers.cans]);
  useEffect(() => {
    if (!answers.ranking) update((a) => ({ ...a, ranking }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = Object.fromEntries(
    LETTERS.map((l) => [
      l,
      {
        letter: l,
        subtitle: qn.iterations.find((x) => x.letter === l)?.change ?? "",
        score: answers.cans?.[l]?.overall,
      },
    ]),
  ) as Record<Letter, { letter: Letter; subtitle: string; score?: number }>;

  const emailInvalid = !!answers.email && !EMAIL_RE.test(answers.email.trim());

  const send = async () => {
    if (emailInvalid) {
      setError(m.final.emailInvalid);
      document.getElementById("email")?.focus();
      return;
    }
    if (!consent) {
      setError(m.final.consentRequired);
      document.getElementById("consent")?.focus();
      return;
    }
    setError(null);
    setSending(true);
    const err = await onSubmit(true);
    setSending(false);
    if (err) setError(err === "consent_required" ? m.final.consentRequired : m.final.error);
  };

  return (
    <div>
      <Progress step={5} m={m} saveState={saveState} />
      <div className="mb-7 px-1">
        <p className="kicker kicker-bar">{m.final.kicker}</p>
        <h1 className="display mt-5 text-4xl">{m.final.title}</h1>
      </div>
      <div className="stagger space-y-4">
        <Section title={m.final.rankingTitle} n={1}>
          <p className="-mt-2 mb-4 text-sm leading-relaxed text-muted">
            {m.final.rankingHelp}
            {prefilled && <span className="mt-1 block text-rose">{m.final.rankingPrefilled}</span>}
          </p>
          <Ranking order={ranking} items={items} onChange={(o) => update((a) => ({ ...a, ranking: o }))} m={m} />
        </Section>

        <Section title={m.final.keepTitle} aside={m.can.optional} n={2}>
          <div className="space-y-3">
            {LETTERS.map((l) => (
              <div key={l} className="flex items-center gap-3">
                <CanIcon letter={l} size={20} />
                <input
                  className="input"
                  aria-label={`${m.final.keepTitle} ${l}`}
                  value={answers.keep?.[l] ?? ""}
                  maxLength={300}
                  placeholder={m.final.keepPlaceholder}
                  onChange={(e) => update((a) => ({ ...a, keep: { ...(a.keep ?? {}), [l]: e.target.value } }))}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title={m.final.generalTitle} aside={m.can.optional} n={3}>
          <TextArea
            value={answers.general_comment}
            onChange={(v) => update((a) => ({ ...a, general_comment: v }))}
            placeholder={m.final.generalPlaceholder}
            rows={4}
          />
        </Section>

        <Section title={m.final.contactTitle} aside={m.can.optional} n={4}>
          <p className="-mt-2 mb-4 text-sm text-muted">{m.final.contactHelp}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                {m.final.name}
              </label>
              <input
                id="name"
                className="input"
                autoComplete="name"
                maxLength={120}
                value={answers.name ?? ""}
                onChange={(e) => update((a) => ({ ...a, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="email" className="label">
                {m.final.email}
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={200}
                className={`input ${emailInvalid ? "border-rose" : ""}`}
                value={answers.email ?? ""}
                onChange={(e) => update((a) => ({ ...a, email: e.target.value }))}
                aria-invalid={emailInvalid}
              />
              {emailInvalid && <p className="mt-1 text-xs text-rose">{m.final.emailInvalid}</p>}
            </div>
          </div>
        </Section>

        <label
          htmlFor="consent"
          className={`card flex cursor-pointer items-start gap-3 p-5 transition ${
            consent ? "border-rose/30 bg-blush/40" : ""
          } ${error === m.final.consentRequired ? "border-rose" : ""}`}
        >
          <input
            id="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setError(null);
            }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8457A]"
          />
          <span className="text-sm leading-relaxed text-ink">
            {fmt(m.final.consent, { email: m.common.privacyEmail })}
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-rose">
          {error}
        </p>
      )}

      <NavButtons
        m={m}
        onBack={onBack}
        onNext={send}
        disabled={sending}
        nextLabel={sending ? m.final.sending : m.final.submit}
        nextIcon={sending ? null : <IconCheck />}
      />
    </div>
  );
}

// ===========================================================================
// 5. Merci / déjà répondu
// ===========================================================================
function Thanks({ m, onAnother }: { m: Messages; onAnother: () => void }) {
  return (
    <div className="card relative overflow-hidden px-6 pb-12 pt-14 text-center sm:px-12">
      <div className="bg-dots absolute inset-x-0 top-0 h-3 opacity-80" aria-hidden />
      <Bubbles count={20} />
      <div className="relative">
        <div className="flex items-end justify-center gap-3" aria-hidden>
          {LETTERS.map((l, i) => (
            <div key={l} style={{ animation: `pop .6s ${0.1 + i * 0.1}s cubic-bezier(.2,.7,.2,1) both` }}>
              <div className="animate-float" style={{ animationDelay: `${i * -1.3}s` }}>
                <CanIcon letter={l} size={i === 1 || i === 2 ? 50 : 44} />
              </div>
            </div>
          ))}
        </div>
        <h1 className="display mt-8 text-5xl sm:text-6xl">
          {m.thanks.title.replace(/!$/, "")}
          <span className="text-brand">!</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[17px] leading-relaxed text-muted">{m.thanks.text}</p>
        <p className="hand mt-5 text-[26px]">{m.thanks.sign}</p>
        <a href="https://www.potionlab.ai" className="btn-primary mt-8 w-full sm:w-auto">
          {m.thanks.cta}
          <IconArrowRight />
        </a>
        <div className="mt-4">
          <button type="button" className="btn-ghost" onClick={onAnother}>
            {m.thanks.another}
          </button>
        </div>
      </div>
    </div>
  );
}

function Already({ m, onStart, onChangeCode }: { m: Messages; onStart: () => void; onChangeCode: () => void }) {
  return (
    <div className="card relative overflow-hidden px-6 pb-10 pt-12 text-center sm:px-10">
      <div className="bg-dots absolute inset-x-0 top-0 h-3 opacity-80" aria-hidden />
      <div className="mx-auto flex w-fit items-end gap-2" aria-hidden>
        {LETTERS.map((l) => (
          <CanIcon key={l} letter={l} size={30} />
        ))}
      </div>
      <h1 className="display mt-6 text-3xl">{m.already.title}</h1>
      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">{m.already.text}</p>
      <button type="button" className="btn-primary mt-7 w-full sm:w-auto" onClick={onStart}>
        {m.already.cta}
        <IconArrowRight />
      </button>
      <div className="mt-3">
        <button type="button" className="btn-ghost" onClick={onChangeCode}>
          {m.common.changeCode}
        </button>
      </div>
    </div>
  );
}
