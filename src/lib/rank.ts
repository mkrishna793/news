// "Algorithm without AI": decides what's important today.
// quality  = engagement + keyword signals + corroboration (time-independent, stored)
// ranking  = quality + recency decay (computed live in SQL so old items sink naturally)
const BOOST =
  /\b(breakthrough|state-of-the-art|sota|first (ever|time|demonstration)|record|novel|open[- ]source|open[- ]weights?|release[sd]?|launch(es|ed)?|outperforms?|surpass(es|ed)?|discover(s|ed|y)?|nature|science|cell|neuron|scalable|error[- ]correct|beyond|unveil(s|ed)?)\b/gi;
const RISK =
  /\b(vulnerab|outage|breach|leak|lawsuit|ban|recall|shutdown|regression|critical|zero-day|jailbreak|deprecat)\w*/gi;

export function qualityOf(i: {
  kind: string;
  title: string;
  summary: string;
  score?: number;
  sources?: number;
  essential?: boolean;
}): number {
  const text = `${i.title} ${i.summary}`;
  const boosts = Math.min(3, (text.match(BOOST) ?? []).length) * 5;
  const risk =
    i.kind === "ai_news" ? Math.min(2, (text.match(RISK) ?? []).length) * 4 : 0;
  const eng = Math.log10(1 + Math.max(0, i.score ?? 0)) * 16;
  const corr = ((i.sources ?? 1) - 1) * 10;
  const ess = i.essential ? 60 : 0;
  const len = Math.min(8, text.length / 120);
  return Math.round((eng + boosts + risk + corr + ess + len) * 10) / 10;
}

// half-life (hours) by kind used by the SQL ranking expression
export const HALF_LIFE: Record<string, number> = {
  paper: 96,
  applied: 72,
  ai_news: 36,
  industry: 24,
  geo: 36,
  video: 120,
  hn: 18,
};
