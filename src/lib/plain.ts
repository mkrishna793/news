import { findTerms, countTerms, type Term } from "@/lib/glossary";
import { sentences, clip, keywords } from "@/lib/text";

export type PlainSection = {
  key: string;
  title: string;
  icon: string;
  text: string;
};
export type Plain = {
  tldr: string;
  sections: PlainSection[];
  glossary: { term: string; meaning: string }[];
  analogy?: string;
  numbers: { value: string; context: string }[];
  questions: string[];
  level: "Beginner-friendly" | "Some background helps" | "Technical";
  readMinutes: number;
  keywords: { word: string; count: number }[];
};

type In = {
  kind: string;
  domain?: string;
  title: string;
  summary: string;
  tags?: string[];
};

const SWAPS: [RegExp, string][] = [
  [/\bwe propose\b/gi, "the authors propose"],
  [/\bwe introduce\b/gi, "the authors introduce"],
  [/\bwe present\b/gi, "the authors present"],
  [/\bwe show\b/gi, "the authors show"],
  [/\bwe demonstrate\b/gi, "the authors show"],
  [/\bwe find\b/gi, "the authors find"],
  [/\bwe develop\b/gi, "the authors build"],
  [/\bwe report\b/gi, "the authors report"],
  [/\bwe study\b/gi, "the authors study"],
  [/\bwe investigate\b/gi, "the authors investigate"],
  [/\bwe\b/gi, "the authors"],
  [/\bour\b/gi, "their"],
  [/\bleverag(e|es|ing)\b/gi, "use"],
  [/\butili[sz](e|es|ing)\b/gi, "use"],
  [/\bdemonstrates?\b/gi, "shows"],
  [/\bnovel\b/gi, "new"],
  [/\bsubstantially|significantly\b/gi, "clearly"],
  [/\bfurthermore|moreover|additionally\b/gi, "also"],
  [/\bhowever\b/gi, "but"],
  [/\bin order to\b/gi, "to"],
  [/\bnumerous\b/gi, "many"],
  [/\bfacilitates?\b/gi, "helps with"],
  [/\bapproximately\b/gi, "about"],
  [/\bexhibits?\b/gi, "shows"],
  [/\bsuperior\b/gi, "better"],
  [/\bendeavou?r\b/gi, "effort"],
  [/\bempirical(ly)?\b/gi, "experimental"],
];

export function simplify(s: string): string {
  let out = s;
  for (const [re, r] of SWAPS) out = out.replace(re, r);
  out = out.replace(/\s*\((?:[A-Z][A-Za-z0-9-]{1,10}s?)\)/g, ""); // drop (ABBR)
  out = out.replace(/^the authors/, "The authors");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

const CUES = {
  problem:
    /\b(however|challenge|challenging|remains?|limited|limitation|despite|lack|lacks|difficult|hard to|unclear|unknown|bottleneck|struggle|problem|fail|poorly|expensive|costly|open question|little is known|not well understood|prone)\b/i,
  method:
    /\b(we (propose|introduce|present|develop|build|design|use|train|apply|show how|implement|construct|combine|study|investigate|perform|measure|record|analy[sz]e)|this (paper|work|study) (proposes|introduces|presents|develops|studies|investigates)|novel|framework|architecture|algorithm|technique|approach|pipeline|experiment|by (using|combining|training|leveraging))\b/i,
  result:
    /\b(outperform|achiev|improv|reduc|increas|surpass|reach|obtain|results? (show|indicate|reveal|suggest)|we (find|found|observe|observed|demonstrate|show that|report)|demonstrat|reveal|state-of-the-art|faster|accuracy|record|first (time|demonstration|observation)|\d+(\.\d+)?\s?(%|x|×|-fold|times))\b/i,
  impact:
    /\b(enable|enabling|paves?|pave the way|promising|potential|future|applications?|implications?|could|may help|opens? (up|the door)|useful for|important for|toward|towards)\b/i,
};

function pick(
  sents: string[],
  re: RegExp,
  used: Set<number>,
  bias: "start" | "end" | "any" = "any",
): string {
  let best = -1;
  let bestScore = 0;
  sents.forEach((s, i) => {
    if (used.has(i)) return;
    const matches = s.match(new RegExp(re.source, "gi"))?.length ?? 0;
    if (!matches) return;
    let sc = matches;
    if (bias === "start") sc += (sents.length - i) / sents.length;
    if (bias === "end") sc += i / sents.length;
    if (sc > bestScore) {
      bestScore = sc;
      best = i;
    }
  });
  if (best >= 0) {
    used.add(best);
    return sents[best];
  }
  return "";
}

const ANALOGY_DEFAULT: Record<string, string> = {
  neuro:
    "Think of the brain as a city: neurons are houses, synapses are roads, and brain waves are the traffic rhythms that decide what gets through.",
  quantum:
    "Think of ordinary computers as light switches (on or off) and quantum computers as dimmers that can be many levels at once — powerful, but easily disturbed.",
  ai: "Think of an AI model as a student that has read a huge library and learned the patterns, not the exact pages.",
  inter:
    "Think of this as two fields swapping tools: ideas from one become instruments for the other.",
};

export function numbersIn(text: string): { value: string; context: string }[] {
  const out: { value: string; context: string }[] = [];
  const re =
    /(\d[\d,]*(?:\.\d+)?)\s?(%|percent|x|×|-fold|times|qubits?|parameters?|billion|million|trillion|[BMK]\b|ms|GPUs?|hours?|days?|years?|km|nm|K\b|Hz|GHz|TB|GB)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < 4) {
    const unit = m[2].replace("percent", "%");
    const s = Math.max(0, m.index - 46);
    const e = Math.min(text.length, m.index + m[0].length + 34);
    const val = `${m[1]}${/^[%x×]|-fold/i.test(unit) ? unit : " " + unit}`;
    if (out.some((o) => o.value === val)) continue;
    out.push({
      value: val,
      context:
        (s > 0 ? "…" : "") +
        text.slice(s, e).trim() +
        (e < text.length ? "…" : ""),
    });
  }
  return out;
}

function levelOf(text: string): Plain["level"] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return "Some background helps";
  const avg = words.reduce((a, w) => a + w.length, 0) / words.length;
  const dens = countTerms(text) / Math.max(1, words.length / 60);
  const score = avg * 0.9 + dens * 0.6;
  if (score < 5.6) return "Beginner-friendly";
  if (score < 6.9) return "Some background helps";
  return "Technical";
}

function questionsFor(terms: Term[], input: In): string[] {
  const q: string[] = [];
  for (const t of terms.slice(0, 2))
    q.push(
      `What exactly is ${/^[aeiou]/i.test(t.t) ? "an" : "a"} ${t.t}, and why does it matter?`,
    );
  const dom = input.domain;
  if (input.kind === "paper" || input.kind === "applied") {
    q.push("What would change in everyday life if this works at scale?");
    q.push(
      "What’s the strongest argument that this result might be wrong or overstated?",
    );
    if (dom === "neuro")
      q.push(
        "Could this idea be used to build better AI, or to treat a brain disease?",
      );
    else if (dom === "quantum")
      q.push(
        "Which real-world problem could this unlock first — and how far away is it?",
      );
    else
      q.push("What was the previous best approach, and why did it hit a wall?");
  } else if (input.kind === "geo") {
    q.push(
      "How could this change things for a student or graduate in the next 12 months?",
    );
    q.push("Who benefits, who loses, and what does each side say?");
  } else if (input.kind === "industry") {
    q.push("Is this a one-day reaction or a lasting shift in the industry?");
    q.push("What does this signal about where AI money is flowing?");
  } else {
    q.push("What problem is this solving, and who would use it?");
    q.push("What could go wrong or be misused?");
  }
  return q.slice(0, 4);
}

const WHY_GEO: Record<string, string> = {
  students:
    "Policies like these can change visas, scholarships, fees, admissions or job options for students — worth tracking early.",
  india:
    "India’s external relationships shape trade, jobs, technology access and the opportunities open to young people here.",
  conflict:
    "Conflicts ripple outward: energy and food prices, supply chains, travel safety and global alliances all shift.",
  tech: "Control over chips, data and AI is now a form of national power — rules here decide who gets to build the next technology.",
  world:
    "Big shifts between countries tend to change trade, prices, technology access and security for everyone.",
};
const WATCH_GEO: Record<string, string> = {
  students:
    "Official notices from the education ministry or embassy, and how universities react in the next few weeks.",
  india:
    "Statements from the Ministry of External Affairs, trade figures, and reactions from partner countries.",
  conflict:
    "Whether talks or a ceasefire follow, what sanctions or aid are announced, and impact on oil prices.",
  tech: "Follow-up rules, company responses, and whether other countries copy or retaliate.",
  world:
    "Official statements, follow-up meetings, and market or travel reactions.",
};

const COUNTRIES = [
  "India",
  "China",
  "United States",
  "US",
  "USA",
  "Russia",
  "Ukraine",
  "Israel",
  "Gaza",
  "Iran",
  "Pakistan",
  "Taiwan",
  "Japan",
  "South Korea",
  "North Korea",
  "Germany",
  "France",
  "United Kingdom",
  "UK",
  "Britain",
  "European Union",
  "EU",
  "Canada",
  "Australia",
  "Saudi Arabia",
  "UAE",
  "Turkey",
  "Brazil",
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
  "Afghanistan",
  "Singapore",
  "Indonesia",
  "Vietnam",
  "Philippines",
  "Egypt",
  "Syria",
  "Lebanon",
  "Yemen",
  "Sudan",
  "NATO",
  "UN",
  "BRICS",
  "Quad",
  "OPEC",
  "WHO",
  "IMF",
  "World Bank",
  "ASEAN",
];

function entities(text: string): string[] {
  const hits = new Set<string>();
  for (const c of COUNTRIES)
    if (new RegExp(`(?<![A-Za-z])${c}(?![A-Za-z])`).test(text))
      hits.add(
        c === "US" || c === "USA"
          ? "United States"
          : c === "UK" || c === "Britain"
            ? "United Kingdom"
            : c,
      );
  return [...hits].slice(0, 6);
}

export function sentimentOf(text: string): "up" | "down" | "neutral" {
  const t = text.toLowerCase();
  const down = (
    t.match(
      /\b(plunge|plunges|slump|fall|falls|drop|drops|tumble|sink|sinks|loss|losses|layoffs?|cuts? jobs|slashes|crash|selloff|sell-off|lawsuit|fine[sd]?|probe|ban|bans|decline|warn|warns|miss|misses|downgrade)\b/g,
    ) ?? []
  ).length;
  const up = (
    t.match(
      /\b(surge|surges|soar|soars|jump|jumps|rally|rallies|gain|gains|record|beat|beats|rise|rises|climb|climbs|boost|upgrade|raises|raised|wins|launch|launches|unveils?)\b/g,
    ) ?? []
  ).length;
  return down > up ? "down" : up > down ? "up" : "neutral";
}

export function explain(input: In): Plain {
  const full = `${input.title}. ${input.summary}`;
  const sents = sentences(input.summary || input.title);
  const terms = findTerms(full, 8, input.kind);
  const numbers = numbersIn(input.summary);
  const used = new Set<number>();
  const sections: PlainSection[] = [];
  const add = (key: string, title: string, icon: string, text: string) => {
    if (text) sections.push({ key, title, icon, text: clip(text, 420) });
  };

  if (input.kind === "geo") {
    const ents = entities(full);
    const tag =
      (input.tags ?? []).find((t) => WHY_GEO[t]) ?? input.domain ?? "world";
    add("what", "What happened", "📰", simplify(sents[0] ?? input.title));
    if (sents[1]) add("detail", "The detail", "🔎", simplify(sents[1]));
    if (ents.length) add("who", "Who is involved", "🌍", ents.join(", "));
    add("why", "Why it matters to you", "🎯", WHY_GEO[tag] ?? WHY_GEO.world);
    add("watch", "What to watch next", "👀", WATCH_GEO[tag] ?? WATCH_GEO.world);
  } else if (input.kind === "industry") {
    const s = sentimentOf(full);
    add("what", "What happened", "📰", simplify(sents[0] ?? input.title));
    if (sents[1]) add("detail", "The detail", "🔎", simplify(sents[1]));
    add(
      "signal",
      "Market signal",
      s === "down" ? "📉" : s === "up" ? "📈" : "➖",
      s === "down"
        ? "This reads as negative news for the company or sector — a loss, cut, fine or setback."
        : s === "up"
          ? "This reads as positive news — growth, a launch, a win or a market rally."
          : "No clear good-or-bad signal in the headline; look at the details and how the stock reacts.",
    );
    add(
      "why",
      "Why it matters",
      "🎯",
      "Big tech moves set the direction of AI spending, jobs and which tools you’ll end up using.",
    );
  } else if (
    input.kind === "paper" ||
    input.kind === "applied" ||
    input.kind === "ai_news"
  ) {
    const problem = pick(sents, CUES.problem, used, "start");
    const method = pick(sents, CUES.method, used, "any");
    const result = pick(sents, CUES.result, used, "end");
    const impact = pick(sents, CUES.impact, used, "end");
    const first = sents[0] && !used.has(0) ? sents[0] : "";
    add(
      "problem",
      input.kind === "paper" ? "The problem" : "The context",
      "🧩",
      simplify(problem || first || sents[0] || input.title),
    );
    add(
      "did",
      input.kind === "ai_news" ? "What’s new" : "What they did",
      "🛠️",
      simplify(method || sents[1] || ""),
    );
    add(
      "found",
      input.kind === "ai_news" ? "Why people care" : "What they found",
      "💡",
      simplify(result || sents[sents.length - 1] || ""),
    );
    add(
      "matters",
      "Why it could matter",
      "🌱",
      simplify(
        impact ||
          "It adds one more piece of evidence to a fast-moving field; its real impact depends on whether others can reproduce and build on it.",
      ),
    );
  } else {
    add("what", "What it is", "📌", simplify(sents[0] ?? input.title));
    if (sents[1]) add("detail", "More", "🔎", simplify(sents[1]));
  }

  const uniq = sections.filter(
    (s, i) => sections.findIndex((x) => x.text === s.text) === i,
  );
  const lead = uniq.find((s) => s.key === "did" || s.key === "what") ?? uniq[0];
  const res = uniq.find((s) => s.key === "found");
  const tldr =
    clip(
      [lead?.text, res && res !== lead ? res.text : ""]
        .filter(Boolean)
        .join(" "),
      300,
    ) || clip(input.title, 200);
  const analogy =
    terms.find((t) => t.an)?.an ??
    (input.kind === "paper" ? ANALOGY_DEFAULT[input.domain ?? ""] : undefined);
  const words = full.split(/\s+/).length;

  return {
    tldr,
    sections: uniq,
    glossary: terms.map((t) => ({ term: t.t, meaning: t.m })),
    analogy,
    numbers,
    questions: questionsFor(terms, input),
    level: levelOf(input.summary || input.title),
    readMinutes: Math.max(1, Math.round(words / 180)),
    keywords: keywords(full, 8),
  };
}
