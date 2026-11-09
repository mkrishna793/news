import { getJson, getText } from "@/lib/http";
import { parseFeed } from "@/lib/xml";
import { stripHtml, clip } from "@/lib/text";
import { getSetting } from "@/lib/settings";
import { arr } from "@/lib/xml";
import { type Draft, type Any, github } from "./common";

const day = (n: number) => new Date(Date.now() - n * 864e5);
const iso = (d: Date) => d.toISOString().slice(0, 10);
export const ISSUE_RE =
  /\b(bug|crash|regression|outage|vulnerab\w*|cve-\d+|jailbreak|leak|breach|broken|fails?|failing|deprecat\w*|security|lawsuit|exploit|slow|memory leak|oom|poisoned|backdoor|incident)\b/i;

export async function ghHeaders(): Promise<Record<string, string>> {
  const gh = await getSetting<{ token?: string }>("github", {});
  const h: Record<string, string> = { accept: "application/vnd.github+json" };
  if (gh.token) h.authorization = `Bearer ${gh.token}`;
  return h;
}

export async function hfModels(): Promise<Draft[]> {
  const data = await getJson<Any[]>(
    "https://huggingface.co/api/models?sort=trendingScore&limit=30",
  );
  return data.map((m) => {
    const id: string = m.id ?? m.modelId;
    const task =
      (m.pipeline_tag as string | undefined)?.replace(/-/g, " ") ?? "model";
    const created = new Date(m.createdAt ?? Date.now());
    const fresh = Date.now() - created.getTime() < 14 * 864e5;
    return {
      kind: "ai_news" as const,
      domain: "models",
      source: "Hugging Face · trending models",
      title: `${id} — ${fresh ? "new " : ""}${task} model trending on Hugging Face`,
      url: `https://huggingface.co/${id}`,
      summary: `${id} is a ${task} model${m.library_name ? ` built with ${m.library_name}` : ""}. It has ${Number(m.downloads ?? 0).toLocaleString()} downloads and ${m.likes ?? 0} likes and is currently trending in the open-source community. Topics: ${arr<string>(
        m.tags,
      )
        .filter((t) => !t.includes(":"))
        .slice(0, 8)
        .join(", ")}.`,
      publishedAt: new Date(m.lastModified ?? created),
      score: Number(m.trendingScore ?? 0) * 2 + Number(m.likes ?? 0) / 4,
      tags: ["model", "open-source", fresh ? "new" : "trending"],
      meta: { hf: id, downloads: m.downloads, likes: m.likes, task },
    };
  });
}

export async function reddit(
  sub: string,
  kind: "ai_news" | "applied",
  domain: string,
  label: string,
): Promise<Draft[]> {
  const raw = await getText(
    `https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=20`,
  );
  return parseFeed(raw)
    .slice(0, 14)
    .map((e, i) => {
      const body = e.summary
        .replace(/submitted by.*$/i, "")
        .replace(/\[link\]\s*\[comments\]/i, "")
        .trim();
      const isProject = /^\[(p|project|r)\]/i.test(e.title);
      return {
        kind: isProject ? ("applied" as const) : kind,
        domain: isProject
          ? "builders"
          : ISSUE_RE.test(e.title)
            ? "issues"
            : domain,
        source: label,
        title: e.title.replace(/^\[[A-Za-z]\]\s*/, ""),
        url: e.link,
        summary: clip(body, 700),
        authors: e.author ? [e.author.replace(/^\/u\//, "")] : [],
        publishedAt: e.published,
        score: Math.max(8, 70 - i * 4),
        tags: ["reddit", sub.toLowerCase(), "community"],
        meta: { sub, redditUrl: e.link },
      };
    });
}

export async function hnSearch(
  query: string,
  kind: "ai_news" | "applied",
  domain: string,
  tag = "story",
  minPoints = 25,
  hours = 72,
): Promise<Draft[]> {
  const ts = Math.floor((Date.now() - hours * 36e5) / 1000);
  const d = await getJson<Any>(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=${tag}&numericFilters=created_at_i>${ts},points>${minPoints}&hitsPerPage=12`,
  );
  return arr<Any>(d.hits)
    .filter((h) => h.title)
    .map((h) => {
      const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        kind,
        domain:
          ISSUE_RE.test(h.title) && kind === "ai_news" ? "issues" : domain,
        source: tag === "show_hn" ? "Show HN" : "Hacker News",
        title: String(h.title).replace(/^Show HN:\s*/i, ""),
        url: h.url || hnUrl,
        summary:
          stripHtml(h.story_text ?? "") ||
          `Discussed on Hacker News: ${h.points} points and ${h.num_comments} comments.`,
        authors: [h.author],
        publishedAt: new Date(h.created_at),
        score: Number(h.points) + Number(h.num_comments) / 2,
        tags: ["hacker-news", tag === "show_hn" ? "show-hn" : "discussion"],
        meta: { hnUrl, points: h.points, comments: h.num_comments },
      } satisfies Draft;
    });
}

const BLOGS: {
  name: string;
  url: string;
  domain: string;
  max?: number;
  tags?: string[];
}[] = [
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    domain: "labs",
  },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", domain: "labs" },
  {
    name: "Google DeepMind",
    url: "https://deepmind.google/blog/rss.xml",
    domain: "labs",
  },
  {
    name: "Google Research",
    url: "https://research.google/blog/rss/",
    domain: "labs",
  },
  {
    name: "Microsoft Research",
    url: "https://www.microsoft.com/en-us/research/feed/",
    domain: "labs",
  },
  {
    name: "NVIDIA Blog",
    url: "https://blogs.nvidia.com/feed/",
    domain: "labs",
    max: 4,
  },
  {
    name: "Berkeley AI Research",
    url: "https://bair.berkeley.edu/blog/feed.xml",
    domain: "labs",
    max: 3,
  },
  {
    name: "Simon Willison",
    url: "https://simonwillison.net/atom/everything/",
    domain: "community",
    max: 5,
  },
  {
    name: "Import AI",
    url: "https://importai.substack.com/feed",
    domain: "community",
    max: 3,
  },
  {
    name: "Interconnects",
    url: "https://www.interconnects.ai/feed",
    domain: "community",
    max: 3,
  },
  {
    name: "Latent Space",
    url: "https://www.latent.space/feed",
    domain: "community",
    max: 3,
  },
  {
    name: "Ollama releases",
    url: "https://github.com/ollama/ollama/releases.atom",
    domain: "releases",
    max: 3,
    tags: ["open-source", "release"],
  },
  {
    name: "llama.cpp releases",
    url: "https://github.com/ggml-org/llama.cpp/releases.atom",
    domain: "releases",
    max: 2,
    tags: ["open-source", "release"],
  },
  {
    name: "Transformers releases",
    url: "https://github.com/huggingface/transformers/releases.atom",
    domain: "releases",
    max: 3,
    tags: ["open-source", "release"],
  },
  {
    name: "vLLM releases",
    url: "https://github.com/vllm-project/vllm/releases.atom",
    domain: "releases",
    max: 2,
    tags: ["open-source", "release"],
  },
];

export async function blogs(): Promise<Draft[]> {
  const res = await Promise.allSettled(
    BLOGS.map(async (b) => {
      const entries = parseFeed(await getText(b.url));
      return entries
        .filter((e) => Date.now() - e.published.getTime() < 21 * 864e5)
        .slice(0, b.max ?? 5)
        .map<Draft>((e) => ({
          kind: "ai_news",
          domain:
            ISSUE_RE.test(e.title) && b.domain !== "releases"
              ? "issues"
              : b.domain,
          source: b.name,
          title: e.title,
          url: e.link,
          summary: clip(e.summary, 900),
          authors: e.author ? [e.author] : [],
          publishedAt: e.published,
          score: b.domain === "labs" ? 55 : b.domain === "releases" ? 30 : 40,
          tags: b.tags ?? [b.domain === "labs" ? "lab" : "community"],
          meta: { feed: b.name },
        }));
    }),
  );
  return res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function ghIssues(): Promise<Draft[]> {
  const headers = await ghHeaders();
  const repos = [
    "ollama/ollama",
    "ggml-org/llama.cpp",
    "huggingface/transformers",
    "vllm-project/vllm",
    "comfyanonymous/ComfyUI",
  ];
  const res = await Promise.allSettled(
    repos.map(async (r) => {
      const d = await getJson<Any>(
        `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${r} is:issue is:open created:>${iso(day(10))}`)}&sort=comments&order=desc&per_page=4`,
        { headers },
      );
      return arr<Any>(d.items).map<Draft>((i) => ({
        kind: "ai_news",
        domain: "issues",
        source: `GitHub · ${r}`,
        title: `${r.split("/")[1]}: ${i.title}`,
        url: i.html_url,
        summary:
          clip(stripHtml(i.body ?? ""), 700) ||
          `Open issue with ${i.comments} comments in ${r}.`,
        authors: [i.user?.login],
        publishedAt: new Date(i.created_at),
        score:
          10 +
          Number(i.comments) * 5 +
          Number(i.reactions?.total_count ?? 0) * 3,
        tags: ["issue", "open-source", r.split("/")[1]],
        meta: { repo: r, comments: i.comments },
      }));
    }),
  );
  return res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function ghBuilders(): Promise<Draft[]> {
  const headers = await ghHeaders();
  const topics = ["llm", "ai-agents", "machine-learning", "rag"];
  const res = await Promise.allSettled(
    topics.map(async (t) => {
      const d = await getJson<Any>(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(`topic:${t} created:>${iso(day(21))} stars:>40`)}&sort=stars&order=desc&per_page=6`,
        { headers },
      );
      return arr<Any>(d.items).map<Draft>((r) => ({
        kind: "applied",
        domain: "builders",
        source: "GitHub · new projects",
        title: `${r.full_name} — ${clip(r.description ?? "new open-source project", 90)}`,
        url: r.html_url,
        summary: `${r.description ?? ""} Written in ${r.language ?? "various languages"}. ${r.stargazers_count} stars after only a few weeks. Topics: ${arr<string>(r.topics).slice(0, 6).join(", ")}.`,
        authors: [r.owner?.login],
        publishedAt: new Date(r.created_at),
        score: Number(r.stargazers_count) / 2,
        tags: ["github", "new-project", t],
        meta: {
          github: r.html_url,
          stars: r.stargazers_count,
          language: r.language,
        },
      }));
    }),
  );
  return res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function hfSpaces(): Promise<Draft[]> {
  const data = await getJson<Any[]>(
    "https://huggingface.co/api/spaces?sort=trendingScore&limit=18",
  );
  return data.map((s) => ({
    kind: "applied" as const,
    domain: "builders",
    source: "Hugging Face Spaces",
    title: `${s.id} — live demo built by the community`,
    url: `https://huggingface.co/spaces/${s.id}`,
    summary: `An interactive ${s.sdk ?? "app"} demo by ${s.author ?? "a community builder"} that is trending right now (${s.likes ?? 0} likes). ${arr<string>(
      s.tags,
    )
      .filter((t) => !t.includes(":"))
      .slice(0, 6)
      .join(", ")}.`,
    authors: [s.author].filter(Boolean),
    publishedAt: new Date(s.lastModified ?? s.createdAt ?? Date.now()),
    score: Number(s.trendingScore ?? 0) * 2 + Number(s.likes ?? 0) / 3,
    tags: ["demo", "huggingface-space"],
    meta: { space: s.id, likes: s.likes },
  }));
}

export async function devto(): Promise<Draft[]> {
  const res = await Promise.allSettled(
    ["machinelearning", "ai", "llm"].map(async (tag) => {
      const d = await getJson<Any[]>(
        `https://dev.to/api/articles?tag=${tag}&top=3&per_page=8`,
      );
      return d.map<Draft>((a) => ({
        kind: "applied",
        domain: "builders",
        source: "DEV Community",
        title: a.title,
        url: a.url,
        summary: a.description ?? "",
        authors: [a.user?.name].filter(Boolean),
        publishedAt: new Date(a.published_at),
        score: Number(a.positive_reactions_count ?? 0) / 2,
        tags: ["tutorial", "builders", ...arr<string>(a.tag_list).slice(0, 2)],
        meta: { thumbnail: a.cover_image || a.social_image },
      }));
    }),
  );
  return res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export { github };
