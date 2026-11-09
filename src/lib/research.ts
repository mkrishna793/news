import { getJson, getText } from "@/lib/http";
import { parseFeed, arr } from "@/lib/xml";
import { listItems } from "@/lib/data";
import { arxivSearch } from "@/lib/ingest/papers";
import { stripHtml, tokens, jaccard, sentences, clip } from "@/lib/text";

 
type Any = any;

export type Hit = {
  lane: string;
  type: "library" | "journal" | "news" | "community" | "reference";
  source: string;
  title: string;
  url: string;
  snippet: string;
  date?: string;
  sim: number;
  n?: number;
};

type Lane = {
  name: string;
  type: Hit["type"];
  run: (q: string) => Promise<Omit<Hit, "lane" | "type" | "sim">[]>;
};

const LANES: Lane[] = [
  {
    name: "Your library",
    type: "library",
    run: async (q) =>
      (await listItems({ q, limit: 6, essentials: "any" })).map((i) => ({
        source: i.source,
        title: i.title,
        url: `/item/${i.id}`,
        snippet: clip(i.summary, 400),
        date: i.publishedAt.toISOString(),
      })),
  },
  {
    name: "arXiv",
    type: "journal",
    run: async (q) =>
      (
        await arxivSearch(`all:${tokens(q).slice(0, 5).join(" AND all:")}`, 5, {
          domain: "ai",
        })
      ).map((d) => ({
        source: "arXiv (preprint)",
        title: d.title,
        url: d.url,
        snippet: clip(d.summary ?? "", 400),
        date: d.publishedAt?.toISOString(),
      })),
  },
  {
    name: "OpenAlex (journals)",
    type: "journal",
    run: async (q) => {
      const d = await getJson<Any>(
        `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per_page=5&sort=relevance_score:desc&select=title,doi,publication_year,cited_by_count,primary_location,id`,
      );
      return arr<Any>(d.results).map((w) => ({
        source: w.primary_location?.source?.display_name ?? "OpenAlex",
        title: stripHtml(w.title ?? ""),
        url: w.doi ?? w.id,
        snippet: `Published ${w.publication_year} in ${w.primary_location?.source?.display_name ?? "a journal"}; cited ${w.cited_by_count} times.`,
        date: `${w.publication_year}-01-01`,
      }));
    },
  },
  {
    name: "Wikipedia",
    type: "reference",
    run: async (q) => {
      const d = await getJson<Any>(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=3`,
      );
      return arr<Any>(d.pages).map((p) => ({
        source: "Wikipedia",
        title: p.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.key)}`,
        snippet:
          stripHtml(p.excerpt ?? "") +
          (p.description ? ` — ${p.description}` : ""),
      }));
    },
  },
  {
    name: "News (Google News)",
    type: "news",
    run: async (q) =>
      parseFeed(
        await getText(
          `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`,
        ),
      )
        .slice(0, 7)
        .map((e) => {
          const m = e.title.match(/^(.*) - ([^-]{2,40})$/);
          return {
            source: m?.[2] ?? "News",
            title: m?.[1] ?? e.title,
            url: e.link,
            snippet: m?.[1] ?? e.title,
            date: e.published.toISOString(),
          };
        }),
  },
  {
    name: "Hacker News",
    type: "community",
    run: async (q) => {
      const d = await getJson<Any>(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=5`,
      );
      return arr<Any>(d.hits).map((h) => ({
        source: "Hacker News",
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        snippet: `${h.title} — ${h.points} points, ${h.num_comments} comments`,
        date: h.created_at,
      }));
    },
  },
  {
    name: "Reddit",
    type: "community",
    run: async (q) =>
      parseFeed(
        await getText(
          `https://www.reddit.com/search.rss?q=${encodeURIComponent(q)}&sort=relevance&t=month&limit=6`,
        ),
      )
        .slice(0, 5)
        .map((e) => ({
          source: "Reddit",
          title: e.title,
          url: e.link,
          snippet:
            clip(e.summary.replace(/submitted by.*$/i, ""), 300) || e.title,
          date: e.published.toISOString(),
        })),
  },
];

export type LaneEvent =
  | { type: "lane_start"; name: string }
  | {
      type: "lane_done";
      name: string;
      count: number;
      ms: number;
      error?: string;
    };

export function searchQuery(text: string): string {
  return tokens(text).slice(0, 9).join(" ");
}

// Runs every lane in parallel (Promise.all) and streams progress.
export async function searchAll(
  question: string,
  claim: string,
  on?: (e: LaneEvent) => void,
): Promise<Hit[]> {
  const q = searchQuery(question) || question;
  const ct = tokens(claim || question);
  const all = await Promise.all(
    LANES.map(async (l) => {
      const t0 = Date.now();
      on?.({ type: "lane_start", name: l.name });
      try {
        const res = await Promise.race([
          l.run(q),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("timed out")), 9000),
          ),
        ]);
        on?.({
          type: "lane_done",
          name: l.name,
          count: res.length,
          ms: Date.now() - t0,
        });
        return res.map<Hit>((r) => ({
          ...r,
          lane: l.name,
          type: l.type,
          sim: jaccard(ct, tokens(`${r.title} ${r.snippet}`)),
        }));
      } catch (e) {
        on?.({
          type: "lane_done",
          name: l.name,
          count: 0,
          ms: Date.now() - t0,
          error: e instanceof Error ? e.message : "failed",
        });
        return [];
      }
    }),
  );
  const seen = new Set<string>();
  return all
    .flat()
    .filter(
      (h) => h.title && (seen.has(h.url) ? false : (seen.add(h.url), true)),
    )
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 12)
    .map((h, i) => ({ ...h, n: i + 1 }));
}

export type Verdict = {
  level: "strong" | "moderate" | "weak" | "none";
  label: string;
  score: number;
  supporters: number;
  types: string[];
  notes: string[];
};

// Cross-source corroboration: how many *independent* sources of different kinds talk about the same thing?
export function verify(hits: Hit[]): Verdict {
  const sup = hits.filter((h) => h.sim >= 0.1 && h.type !== "library");
  const names = new Set(sup.map((h) => h.source.replace(/\s*\(.*\)/, "")));
  const types = [...new Set(sup.map((h) => h.type))];
  const notes: string[] = [];
  const score = Math.min(
    100,
    names.size * 17 +
      types.length * 14 +
      Math.round(sup.reduce((a, h) => a + h.sim, 0) * 40),
  );
  let level: Verdict["level"] = "none";
  if (names.size >= 4 && types.length >= 2) level = "strong";
  else if (names.size >= 2) level = "moderate";
  else if (names.size === 1) level = "weak";
  if (!sup.length)
    notes.push(
      "No independent source matched closely — treat this as unverified.",
    );
  if (sup.length && types.every((t) => t === "community"))
    notes.push("Only community chatter (forums/social) — could be rumor.");
  if (
    sup.some((h) => /arxiv/i.test(h.source)) &&
    !sup.some(
      (h) => h.type === "news" || /nature|science|cell|journal/i.test(h.source),
    )
  )
    notes.push("Backed mainly by preprints, which are not peer-reviewed yet.");
  if (
    types.includes("news") &&
    !types.includes("journal") &&
    !types.includes("reference")
  )
    notes.push(
      "News coverage found but no research paper or reference source confirms the details.",
    );
  const label = {
    strong: "Well corroborated",
    moderate: "Partly corroborated",
    weak: "Single-source",
    none: "Unverified",
  }[level];
  return { level, label, score, supporters: names.size, types, notes };
}

// No-AI answer: pick the most relevant sentences from the best sources and cite them.
export function extractiveAnswer(question: string, hits: Hit[]): string {
  const qt = tokens(question);
  const lines: string[] = [];
  for (const h of hits.filter((x) => x.sim > 0.04).slice(0, 6)) {
    const cand = sentences(h.snippet || h.title);
    let best = cand[0] ?? h.snippet ?? h.title;
    let bs = -1;
    for (const s of cand) {
      const sc = jaccard(qt, tokens(s));
      if (sc > bs) {
        bs = sc;
        best = s;
      }
    }
    lines.push(`- ${clip(best, 260)} [${h.n}] _(${h.source})_`);
  }
  if (!lines.length)
    return "I couldn't find sources that clearly match this. Try rephrasing with specific names or terms — or connect a local AI model in **Connect** for deeper synthesis.";
  return `Here is what the sources say (assembled by keyword matching and cross-checking — no AI model is connected, so this is extractive, not generated):\n\n${lines.join("\n")}`;
}
