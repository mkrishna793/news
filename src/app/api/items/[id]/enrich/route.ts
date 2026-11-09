import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getItem } from "@/lib/data";
import { getJson } from "@/lib/http";
import { arr } from "@/lib/xml";
import { stripHtml, clip } from "@/lib/text";

export const dynamic = "force-dynamic";
 
type Any = any;

export type Enrich = {
  at: string;
  authors: {
    name: string;
    affiliation?: string;
    country?: string;
    orcid?: string;
    profile?: string;
    works?: number;
    citations?: number;
    hIndex?: number;
    role?: string;
  }[];
  figures: { src: string; caption: string }[];
  links: {
    github?: string;
    stars?: number;
    project?: string;
    pdf?: string;
    doi?: string;
    arxiv?: string;
    hf?: string;
    html?: string;
  };
  citations?: number;
  venue?: string;
  hfSummary?: string;
  topics: string[];
};

async function figuresFor(
  arxivId: string,
): Promise<{ figs: Enrich["figures"]; html?: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`https://arxiv.org/html/${arxivId}`, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 CuriosityAtlas" },
    });
    clearTimeout(t);
    if (!res.ok) return { figs: [] };
    const html = await res.text();
    const base = res.url.endsWith("/") ? res.url : res.url + "/";
    const figs: Enrich["figures"] = [];
    for (const m of html.matchAll(
      /<figure[^>]*class="[^"]*ltx_figure[^"]*"[^>]*>([\s\S]*?)<\/figure>/g,
    )) {
      const img = m[1].match(/<img[^>]+src="([^"]+)"/);
      if (!img || img[1].startsWith("data:")) continue;
      const cap = stripHtml(
        m[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? "",
      );
      figs.push({
        src: new URL(img[1], base).toString(),
        caption: clip(cap, 260),
      });
      if (figs.length >= 6) break;
    }
    return { figs, html: res.url };
  } catch {
    return { figs: [] };
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const item = await getItem(Number((await ctx.params).id));
  if (!item) return Response.json({ error: "not found" }, { status: 404 });
  const force = new URL(req.url).searchParams.get("force");
  const cached = item.meta.enrich as Enrich | undefined;
  if (
    cached &&
    !force &&
    Date.now() - new Date(cached.at).getTime() < 7 * 864e5
  )
    return Response.json(cached);

  const arxivId = item.meta.arxivId as string | undefined;
  const doi =
    (item.meta.doi as string | undefined) ??
    (arxivId ? `10.48550/arXiv.${arxivId}` : undefined);
  const out: Enrich = {
    at: new Date().toISOString(),
    authors: [],
    figures: [],
    links: {
      github: item.meta.github,
      stars: item.meta.githubStars,
      project: item.meta.project,
      pdf: item.meta.pdf,
      doi: item.meta.doi ? `https://doi.org/${item.meta.doi}` : undefined,
      arxiv: arxivId ? `https://arxiv.org/abs/${arxivId}` : undefined,
    },
    topics: [],
  };

  const [hf, work, figs] = await Promise.all([
    arxivId
      ? getJson<Any>(`https://huggingface.co/api/papers/${arxivId}`, {
          timeout: 8000,
        }).catch(() => null)
      : null,
    doi
      ? getJson<Any>(
          `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?select=id,authorships,cited_by_count,primary_location,topics`,
          { timeout: 10000 },
        ).catch(() => null)
      : null,
    arxivId
      ? figuresFor(arxivId)
      : Promise.resolve({ figs: [] as Enrich["figures"], html: undefined }),
  ]);

  if (hf) {
    out.links.github ||= hf.githubRepo || undefined;
    out.links.stars ||= hf.githubStars || undefined;
    out.links.project ||= hf.projectPage || undefined;
    out.links.hf = `https://huggingface.co/papers/${arxivId}`;
    out.hfSummary = hf.ai_summary || undefined;
  }
  out.figures = figs.figs;
  out.links.html = figs.html;

  if (work) {
    out.citations = work.cited_by_count;
    out.venue = work.primary_location?.source?.display_name;
    out.topics = arr<Any>(work.topics)
      .slice(0, 4)
      .map((t) => t.display_name);
    const auths = arr<Any>(work.authorships);
    const pick =
      auths.length > 12 ? [...auths.slice(0, 9), ...auths.slice(-3)] : auths;
    const ids = pick
      .map((a) =>
        String(a.author?.id ?? "").replace("https://openalex.org/", ""),
      )
      .filter(Boolean);
    const details: Record<string, Any> = {};
    if (ids.length) {
      const d = await getJson<Any>(
        `https://api.openalex.org/authors?filter=openalex:${ids.join("|")}&per_page=25&select=id,display_name,orcid,works_count,cited_by_count,summary_stats`,
        { timeout: 10000 },
      ).catch(() => null);
      for (const a of arr<Any>(d?.results))
        details[String(a.id).replace("https://openalex.org/", "")] = a;
    }
    out.authors = pick.map((a) => {
      const id = String(a.author?.id ?? "").replace(
        "https://openalex.org/",
        "",
      );
      const det = details[id];
      const idx = auths.indexOf(a);
      return {
        name: a.author?.display_name ?? a.raw_author_name,
        affiliation:
          a.institutions?.[0]?.display_name ?? a.raw_affiliation_strings?.[0],
        country: a.institutions?.[0]?.country_code,
        orcid: a.author?.orcid ?? undefined,
        profile: id ? `https://openalex.org/authors/${id}` : undefined,
        works: det?.works_count,
        citations: det?.cited_by_count,
        hIndex: det?.summary_stats?.h_index,
        role:
          idx === 0
            ? "First author"
            : idx === auths.length - 1 && auths.length > 2
              ? "Senior / last author"
              : a.is_corresponding
                ? "Corresponding"
                : undefined,
      };
    });
  }
  if (!out.authors.length) {
    const info = arr<Any>(item.meta.authorInfo);
    const list = info.length ? info : item.authors.map((n) => ({ name: n }));
    out.authors = list
      .slice(0, 14)
      .map((a: Any, i: number) => ({
        name: a.name,
        affiliation: a.affiliation,
        role: i === 0 ? "First author" : undefined,
      }));
  }

  await db
    .update(items)
    .set({
      meta: sql`${items.meta} || ${JSON.stringify({ enrich: out })}::jsonb`,
    })
    .where(eq(items.id, item.id));
  return Response.json(out);
}
