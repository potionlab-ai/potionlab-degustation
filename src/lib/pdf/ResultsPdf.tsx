// Rapport PDF des résultats, aux couleurs PotionLab.
import path from "node:path";
import fs from "node:fs";
import {
  Defs,
  Document,
  Font,
  Image,
  LinearGradient,
  Page,
  Rect,
  StyleSheet,
  Stop,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { fmtNum, JAR_FR, type ResultsSummary } from "../results";
import { loc, type Questionnaire } from "../types";
import { beverageLabel } from "../modules";
import { formatCode } from "../code";

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");
let fontFamily: string | null = null;
/** Enregistre Outfit ; si les fichiers sont absents sur l'hébergeur, repli sur Helvetica. */
function registerFonts(): string {
  if (fontFamily) return fontFamily;
  const files = [400, 500, 600, 700].map((w) => ({ src: path.join(FONT_DIR, `Outfit-${w}.woff`), fontWeight: w }));
  if (files.every((f) => fs.existsSync(f.src))) {
    Font.register({ family: "Outfit", fonts: files });
    fontFamily = "Outfit";
  } else {
    fontFamily = "Helvetica";
  }
  Font.registerHyphenationCallback((word) => [word]);
  return fontFamily;
}

/** Logo PNG facultatif pour le PDF : src/assets/logo-pdf.png */
function logoPng(): string | null {
  const p = path.join(process.cwd(), "src/assets/logo-pdf.png");
  return fs.existsSync(p) ? p : null;
}

const C = {
  ink: "#2B2B2B",
  muted: "#6E6862",
  faint: "#A39D97",
  line: "#E8E3DD",
  paper: "#F7F5F2",
  rose: "#E8457A",
  coral: "#F28C5B",
  low: "#4F78D0",
  ok: "#8A8279",
  high: "#E05A35",
  green: "#1F7A58",
  greenBg: "#EAF6F0",
  redBg: "#FDECE6",
  red: "#B23F1C",
  blueBg: "#E9EFFB",
  blue: "#2F57AD",
};

const s = StyleSheet.create({
  page: { fontFamily: "Outfit", fontSize: 9.5, color: C.ink, paddingTop: 0, paddingBottom: 48, paddingHorizontal: 36, backgroundColor: "#FFFFFF" },
  band: { marginHorizontal: -36, height: 6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 22, marginBottom: 18 },
  kicker: { fontSize: 7.5, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted },
  h1: { fontSize: 22, fontWeight: 600, marginTop: 4 },
  h2: { fontSize: 13, fontWeight: 600, marginBottom: 8 },
  meta: { fontSize: 9, color: C.muted, marginTop: 4 },
  box: { borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 14, marginBottom: 14 },
  headline: { fontSize: 13, fontWeight: 600, lineHeight: 1.35 },
  bullet: { flexDirection: "row", marginTop: 3 },
  chip: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1.5, fontSize: 7.5, fontWeight: 600, marginRight: 4, marginBottom: 3 },
  row: { flexDirection: "row", alignItems: "center" },
  th: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint },
  letter: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});

function Letter({ l, filled }: { l: string; filled?: boolean }) {
  return (
    <View style={[s.letter, { backgroundColor: filled ? C.rose : C.paper, borderWidth: filled ? 0 : 1, borderColor: C.line }]}>
      <Text style={{ fontSize: 9, fontWeight: 700, color: filled ? "#FFF" : C.ink }}>{l}</Text>
    </View>
  );
}

function GradientBand() {
  return (
    <Svg style={s.band} viewBox="0 0 600 6" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={C.rose} />
          <Stop offset="1" stopColor={C.coral} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="600" height="6" fill="url(#g)" />
    </Svg>
  );
}

function Wordmark() {
  const logo = logoPng();
  // eslint-disable-next-line jsx-a11y/alt-text -- composant PDF, pas d'attribut alt
  if (logo) return <Image src={logo} style={{ height: 22, objectFit: "contain" }} />;
  return (
    <Text style={{ fontSize: 16, fontWeight: 600 }}>
      Potion<Text style={{ color: C.rose }}>Lab</Text>
    </Text>
  );
}

function Bar({ value, max, color }: { value: number | null; max: number; color: string }) {
  const w = value == null ? 0 : Math.max(1.5, (value / max) * 100);
  return (
    <View style={{ height: 6, backgroundColor: C.paper, borderRadius: 3, flexGrow: 1 }}>
      <View style={{ height: 6, width: `${w}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export function ResultsPdf({ qn, s: r }: { qn: Questionnaire; s: ResultsSummary }) {
  const family = registerFonts();
  const today = new Date().toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels" });
  return (
    <Document title={`PotionLab · ${qn.client_name} · ${qn.project_name}`} author="PotionLab">
      <Page size="A4" style={[s.page, { fontFamily: family }]}>
        <View fixed>
          <GradientBand />
        </View>
        <View style={s.header}>
          <View style={{ maxWidth: 360 }}>
            <Text style={s.kicker}>Résultats de dégustation · Formulation Kit</Text>
            <Text style={s.h1}>{qn.project_name}</Text>
            <Text style={s.meta}>
              {qn.client_name} · {beverageLabel(qn.beverage_type)} · code {formatCode(qn.access_code)}
            </Text>
            <Text style={s.meta}>
              {r.nSubmitted} dégustateur{r.nSubmitted > 1 ? "s" : ""} · {today}
            </Text>
          </View>
          <Wordmark />
        </View>

        {/* Synthèse */}
        <View style={[s.box, { backgroundColor: C.paper, borderColor: C.paper }]} wrap={false}>
          <Text style={s.kicker}>Synthèse</Text>
          <Text style={[s.headline, { marginTop: 4 }]}>{r.headline ?? "Pas encore de réponse envoyée."}</Text>
          {r.recipe.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: 600 }}>Piste pour la prochaine itération</Text>
              {r.recipe.map((x) => (
                <View key={x} style={s.bullet}>
                  <Text style={{ width: 10, color: C.rose }}>•</Text>
                  <Text style={{ flex: 1 }}>{x}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ marginTop: 10 }}>
            {r.cans.map((c) => (
              <View key={c.letter} style={[s.row, { marginTop: 5, alignItems: "flex-start" }]}>
                <Letter l={c.letter} filled={c.letter === r.best} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {c.keep.map((k) => (
                      <Text key={k} style={[s.chip, { backgroundColor: C.greenBg, color: C.green }]}>
                        {k}
                      </Text>
                    ))}
                    {c.fix.map((f) => (
                      <Text
                        key={f.label}
                        style={[
                          s.chip,
                          f.action === "increase"
                            ? { backgroundColor: C.blueBg, color: C.blue }
                            : f.action === "mixed"
                              ? { backgroundColor: "#FFF", color: C.muted }
                              : { backgroundColor: C.redBg, color: C.red },
                        ]}
                      >
                        {f.action === "increase" ? "↑" : f.action === "reduce" ? "↓" : f.action === "mixed" ? "≈" : "!"} {f.label} {f.pct} %
                      </Text>
                    ))}
                  </View>
                  <Text style={{ color: C.muted }}>{c.sentence}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tableau */}
        <View style={s.box} wrap={false}>
          <Text style={s.h2}>Appréciation et classement</Text>
          <View style={[s.row, { paddingBottom: 4, borderBottomWidth: 1, borderColor: C.line }]}>
            <Text style={[s.th, { width: 60 }]}>Canette</Text>
            <Text style={[s.th, { flex: 1 }]}>Note moyenne /9</Text>
            <Text style={[s.th, { width: 70, textAlign: "center" }]}>Classée 1re</Text>
            <Text style={[s.th, { width: 70, textAlign: "center" }]}>Rang moyen</Text>
          </View>
          {r.cans.map((c) => (
            <View key={c.letter} style={[s.row, { paddingVertical: 5, borderBottomWidth: 1, borderColor: C.line }]}>
              <View style={{ width: 60 }}>
                <Letter l={c.letter} filled={c.letter === r.best} />
              </View>
              <View style={[s.row, { flex: 1, paddingRight: 14 }]}>
                <Bar value={c.overallMean} max={9} color={c.letter === r.best ? C.rose : "#CFC9C3"} />
                <Text style={{ width: 28, textAlign: "right", fontWeight: 600 }}>{fmtNum(c.overallMean)}</Text>
              </View>
              <Text style={{ width: 70, textAlign: "center" }}>
                {c.rankCounts[0]} / {r.nSubmitted}
              </Text>
              <Text style={{ width: 70, textAlign: "center" }}>{fmtNum(c.meanRank)}</Text>
            </View>
          ))}
          {r.bestByCriterion.length > 0 && (
            <Text style={{ marginTop: 8, color: C.muted }}>
              Le plus « juste » par critère : {r.bestByCriterion.map((b) => `${b.label} : ${b.letter} (${b.ok} %)`).join(" · ")}
            </Text>
          )}
        </View>

        {/* Légende */}
        <View style={[s.row, { marginBottom: 8, marginTop: 22 }]} break>
          <Text style={[s.h2, { marginBottom: 0, flex: 1 }]}>Détail par canette</Text>
          {(["low", "ok", "high"] as const).map((k) => (
            <View key={k} style={[s.row, { marginLeft: 10 }]}>
              <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: C[k], marginRight: 3 }} />
              <Text style={{ fontSize: 8, color: C.muted }}>{JAR_FR[k]}</Text>
            </View>
          ))}
        </View>

        {r.cans.map((c) => (
          <View key={c.letter} style={s.box} wrap={false}>
            <View style={[s.row, { marginBottom: 8 }]}>
              <Letter l={c.letter} filled={c.letter === r.best} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>
                  Canette {c.letter}
                  {c.letter === r.best ? <Text style={{ color: C.rose, fontSize: 8 }}>   PRÉFÉRÉE</Text> : null}
                </Text>
                {c.change ? <Text style={{ color: C.muted }}>{c.change}</Text> : null}
              </View>
              <Text style={{ fontSize: 14, fontWeight: 600 }}>
                {fmtNum(c.overallMean)}
                <Text style={{ fontSize: 9, color: C.muted, fontWeight: 400 }}>/9</Text>
              </Text>
            </View>
            {c.stats.map((st) => {
              const label = loc(st.question.label, "fr");
              if (st.kind === "jar")
                return (
                  <View key={st.question.id} style={[s.row, { marginBottom: 5 }]}>
                    <Text style={{ width: 150 }}>{label}</Text>
                    <View style={{ flex: 1, flexDirection: "row", height: 8 }}>
                      {(["low", "ok", "high"] as const)
                        .filter((k) => st.pct[k] > 0)
                        .map((k, i, arr) => (
                          <View
                            key={k}
                            style={{
                              width: `${st.pct[k]}%`,
                              backgroundColor: C[k],
                              marginRight: i < arr.length - 1 ? 1.5 : 0,
                              borderTopLeftRadius: i === 0 ? 4 : 0,
                              borderBottomLeftRadius: i === 0 ? 4 : 0,
                              borderTopRightRadius: i === arr.length - 1 ? 4 : 0,
                              borderBottomRightRadius: i === arr.length - 1 ? 4 : 0,
                            }}
                          />
                        ))}
                    </View>
                    <Text style={{ width: 120, textAlign: "right", fontSize: 8, color: C.muted }}>
                      {st.pct.low} % · <Text style={{ color: C.ink, fontWeight: 600 }}>{st.pct.ok} %</Text> · {st.pct.high} %
                    </Text>
                  </View>
                );
              if (st.kind === "choice")
                return (
                  <View key={st.question.id} style={[s.row, { marginBottom: 5 }]}>
                    <Text style={{ width: 150 }}>{label}</Text>
                    <Text style={{ flex: 1, color: C.muted }}>
                      {st.question.options.map((o, i) => `${loc(o, "fr")} ${st.pct[i]} %`).join("  ·  ")}
                    </Text>
                  </View>
                );
              if (st.kind === "scale9")
                return (
                  <View key={st.question.id} style={[s.row, { marginBottom: 5 }]}>
                    <Text style={{ width: 150 }}>{label}</Text>
                    <Text style={{ flex: 1, fontWeight: 600 }}>{fmtNum(st.mean)}/9</Text>
                  </View>
                );
              return st.texts.length ? (
                <View key={st.question.id} style={{ marginBottom: 5 }}>
                  <Text style={{ fontWeight: 600 }}>{label}</Text>
                  {st.texts.map((t, i) => (
                    <Text key={i} style={{ color: C.muted }}>
                      « {t.text} » — {t.who}
                    </Text>
                  ))}
                </View>
              ) : null;
            })}
            {(c.keeps.length > 0 || c.comments.length > 0) && (
              <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderColor: C.line }}>
                {c.keeps.map((k, i) => (
                  <Text key={`k${i}`} style={{ marginBottom: 2 }}>
                    <Text style={{ color: C.green, fontWeight: 600 }}>À garder : </Text>
                    {k.text} <Text style={{ color: C.faint }}>— {k.who}</Text>
                  </Text>
                ))}
                {c.comments.map((k, i) => (
                  <Text key={`c${i}`} style={{ marginBottom: 2 }}>
                    « {k.text} » <Text style={{ color: C.faint }}>— {k.who}</Text>
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}

        {r.generalComments.length > 0 && (
          <View style={s.box} wrap={false}>
            <Text style={s.h2}>Commentaires généraux</Text>
            {r.generalComments.map((g, i) => (
              <Text key={i} style={{ marginBottom: 4, lineHeight: 1.4 }}>
                « {g.text} » <Text style={{ color: C.faint }}>— {g.who}</Text>
              </Text>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>PotionLab · Liège, Belgique · potionlab.ai</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
