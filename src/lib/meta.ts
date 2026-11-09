// Shared look-and-feel metadata (safe for server and client).
export const COLORS = {
  violet: "#8b5cf6",
  cyan: "#22d3ee",
  rose: "#f472b6",
  amber: "#fbbf24",
  mint: "#34d399",
  sky: "#60a5fa",
  red: "#f87171",
  orange: "#fb923c",
} as const;
export type Accent = keyof typeof COLORS;
export const accentHex = (a: string) => COLORS[a as Accent] ?? COLORS.violet;

export type DomainMeta = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  blurb: string;
};

export const RESEARCH: DomainMeta[] = [
  {
    key: "quantum-bio",
    label: "Quantum biology",
    emoji: "🧬",
    color: "#67824f",
    blurb: "Coherence, tunnelling and spin in living systems",
  },
  {
    key: "neuro",
    label: "Neuroscience",
    emoji: "🧠",
    color: COLORS.rose,
    blurb: "Brains, minds & neurons — journals + preprints",
  },
  {
    key: "quantum",
    label: "Quantum physics",
    emoji: "⚛️",
    color: COLORS.cyan,
    blurb: "Qubits, error correction, new states of matter",
  },
  {
    key: "ai",
    label: "AI & neural networks",
    emoji: "🤖",
    color: COLORS.violet,
    blurb: "Trending architectures, training & reasoning",
  },
  {
    key: "inter",
    label: "Interdisciplinary",
    emoji: "🔗",
    color: COLORS.amber,
    blurb: "Where fields collide: neuromorphic, AI×science",
  },
];
export const AI_RADAR: DomainMeta[] = [
  {
    key: "models",
    label: "New models",
    emoji: "🆕",
    color: COLORS.violet,
    blurb: "Trending & freshly released open models",
  },
  {
    key: "community",
    label: "Community buzz",
    emoji: "💬",
    color: COLORS.cyan,
    blurb: "Reddit, Hacker News, newsletters",
  },
  {
    key: "issues",
    label: "Issues & problems",
    emoji: "🛠️",
    color: COLORS.orange,
    blurb: "Bugs, outages, safety & security",
  },
  {
    key: "labs",
    label: "Labs & small labs",
    emoji: "🔬",
    color: COLORS.mint,
    blurb: "Official lab and research blogs",
  },
  {
    key: "releases",
    label: "Open-source releases",
    emoji: "📦",
    color: COLORS.sky,
    blurb: "Ollama, llama.cpp, Transformers, vLLM",
  },
];
export const APPLIED: DomainMeta[] = [
  {
    key: "builders",
    label: "What people are building",
    emoji: "🧪",
    color: COLORS.mint,
    blurb: "Projects, demos, experiments, tutorials",
  },
  {
    key: "science",
    label: "AI for science",
    emoji: "🔭",
    color: COLORS.amber,
    blurb: "Researchers applying AI to biology, physics, medicine",
  },
];
export const INDUSTRY: DomainMeta[] = [
  {
    key: "markets",
    label: "Markets & stocks",
    emoji: "📊",
    color: COLORS.sky,
    blurb: "Shares, earnings, gains & losses",
  },
  {
    key: "bigtech",
    label: "Big tech",
    emoji: "🏢",
    color: COLORS.violet,
    blurb: "Product & strategy moves",
  },
  {
    key: "startups",
    label: "Funding & deals",
    emoji: "💸",
    color: COLORS.mint,
    blurb: "Rounds, acquisitions, valuations",
  },
  {
    key: "layoffs",
    label: "Layoffs & cuts",
    emoji: "📉",
    color: COLORS.red,
    blurb: "Job cuts and restructuring",
  },
];
export const WORLD: DomainMeta[] = [
  {
    key: "india",
    label: "India & the world",
    emoji: "🇮🇳",
    color: COLORS.orange,
    blurb: "Foreign policy, trade, diplomacy",
  },
  {
    key: "students",
    label: "Students & education",
    emoji: "🎓",
    color: COLORS.mint,
    blurb: "Policies, visas, funding, universities",
  },
  {
    key: "conflict",
    label: "Wars & conflict",
    emoji: "🕊️",
    color: COLORS.red,
    blurb: "Conflicts & ceasefire talks, simply explained",
  },
  {
    key: "tech",
    label: "Tech geopolitics",
    emoji: "🛰️",
    color: COLORS.cyan,
    blurb: "Chips, AI rules, space, cyber",
  },
  {
    key: "world",
    label: "World affairs",
    emoji: "🌍",
    color: COLORS.sky,
    blurb: "Everything else that shifts the globe",
  },
];
export const VIDEO: DomainMeta[] = [
  {
    key: "explainers",
    label: "Explainers",
    emoji: "💡",
    color: COLORS.amber,
    blurb: "Hard ideas made simple",
  },
  {
    key: "lectures",
    label: "Lectures & walkthroughs",
    emoji: "🎓",
    color: COLORS.violet,
    blurb: "Courses, paper reads, deep dives",
  },
  {
    key: "builds",
    label: "People building things",
    emoji: "🛠️",
    color: COLORS.mint,
    blurb: "Hands-on projects & experiments",
  },
  {
    key: "news",
    label: "What's new",
    emoji: "⚡",
    color: COLORS.cyan,
    blurb: "Fast science & tech updates",
  },
];
export const HN: DomainMeta[] = [
  {
    key: "front",
    label: "Front page",
    emoji: "🔥",
    color: COLORS.orange,
    blurb: "What the tech world is reading",
  },
  {
    key: "show",
    label: "Show HN",
    emoji: "🧰",
    color: COLORS.mint,
    blurb: "Things people just built",
  },
];

export const KIND_META: Record<
  string,
  { label: string; href: string; color: string; domains: DomainMeta[] }
> = {
  paper: {
    label: "Research",
    href: "/research",
    color: COLORS.violet,
    domains: RESEARCH,
  },
  ai_news: {
    label: "AI Radar",
    href: "/ai",
    color: COLORS.cyan,
    domains: AI_RADAR,
  },
  applied: {
    label: "AI Applied",
    href: "/applied",
    color: COLORS.mint,
    domains: APPLIED,
  },
  industry: {
    label: "Industry",
    href: "/industry",
    color: COLORS.sky,
    domains: INDUSTRY,
  },
  geo: { label: "World", href: "/world", color: COLORS.orange, domains: WORLD },
  video: {
    label: "Videos",
    href: "/videos",
    color: COLORS.red,
    domains: VIDEO,
  },
  hn: { label: "Hacker News", href: "/hn", color: COLORS.orange, domains: HN },
};

export function domainMeta(kind: string, domain: string): DomainMeta {
  const d = KIND_META[kind]?.domains.find((x) => x.key === domain);
  return (
    d ?? {
      key: domain,
      label: domain,
      emoji: "✨",
      color: KIND_META[kind]?.color ?? COLORS.violet,
      blurb: "",
    }
  );
}
