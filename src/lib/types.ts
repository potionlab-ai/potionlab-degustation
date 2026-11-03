export const LANGS = ["fr", "en", "nl", "es"] as const;
export type Lang = (typeof LANGS)[number];
export type Localized = Partial<Record<Lang, string>>;

export type QuestionKind = "jar" | "scale9" | "choice" | "text";

export type Question = {
  id: string;
  module: string;
  kind: QuestionKind;
  key?: string | null;
  label: Localized;
  short: Localized;
  options: Localized[];
  multiple?: boolean;
  default_on?: boolean;
  position?: number;
  /** Question créée uniquement pour ce questionnaire */
  custom?: boolean;
};

export type Iteration = { letter: Letter; change: string };
export const LETTERS = ["A", "B", "C", "D"] as const;
export type Letter = (typeof LETTERS)[number];

export type JarValue = "low" | "ok" | "high";
export type AnswerValue = JarValue | number | number[] | string;

export type CanAnswers = {
  overall?: number;
  q?: Record<string, AnswerValue>;
  comment?: string;
};

export type Answers = {
  cans?: Partial<Record<Letter, CanAnswers>>;
  ranking?: Letter[];
  keep?: Partial<Record<Letter, string>>;
  general_comment?: string;
  name?: string;
  email?: string;
};

export type Questionnaire = {
  id: string;
  client_name: string;
  project_name: string;
  beverage_type: string;
  iterations: Iteration[];
  questions: Question[];
  access_code: string;
  archived: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
};

export type QuestionnaireStatus = "sent" | "started" | "done";

export type QuestionnaireListItem = {
  id: string;
  client_name: string;
  project_name: string;
  beverage_type: string;
  access_code: string;
  archived: boolean;
  created_at: string;
  in_progress: number;
  submitted: number;
  last_activity: string | null;
  status: QuestionnaireStatus;
};

export type ResponseRow = {
  id: string;
  answers: Answers;
  step: number;
  lang: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Ce que le client reçoit avec son code */
export type PublicQuestionnaire = {
  code: string;
  client_name: string;
  project_name: string;
  beverage_type: string;
  iterations: Iteration[];
  questions: Question[];
};

export function loc(l: Localized | undefined | null, lang: Lang): string {
  if (!l) return "";
  return l[lang] || l.fr || l.en || Object.values(l).find(Boolean) || "";
}
