import { sql } from "drizzle-orm";
import { db } from "@/db";
import { items, type Meta } from "@/db/schema";
import { qualityOf } from "@/lib/rank";

export type Draft = {
  kind: "paper" | "ai_news" | "applied" | "industry" | "geo" | "video" | "hn";
  domain: string;
  source: string;
  title: string;
  url: string;
  summary?: string;
  authors?: string[];
  publishedAt?: Date;
  score?: number;
  tags?: string[];
  meta?: Meta;
  essential?: boolean;
};

export type SourceResult = { name: string; count: number; error?: string };

export type Any = any;

export const github = (s: string): string | undefined =>
  s
    .match(
      /https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/,
    )?.[0]
    ?.replace(/[.,)]+$/, "");

export async function upsert(drafts: Draft[]): Promise<number> {
  const seen = new Map<string, Draft>();
  for (const d of drafts) {
    if (!d.title || !d.url) continue;
    const key = d.url;
    const prev = seen.get(key);
    if (!prev || (d.score ?? 0) > (prev.score ?? 0)) seen.set(key, d);
  }
  const rows = [...seen.values()].map((d) => {
    const pub =
      d.publishedAt && !isNaN(d.publishedAt.getTime())
        ? d.publishedAt
        : new Date();
    const summary = (d.summary ?? "").slice(0, 4000);
    return {
      kind: d.kind,
      domain: d.domain,
      source: d.source,
      title: d.title.slice(0, 500),
      url: d.url,
      summary,
      authors: (d.authors ?? []).slice(0, 60),
      publishedAt: pub > new Date() ? new Date() : pub,
      score: Math.round(d.score ?? 0),
      quality: qualityOf({
        kind: d.kind,
        title: d.title,
        summary,
        score: d.score,
        essential: d.essential,
      }),
      tags: [...new Set(d.tags ?? [])].slice(0, 10),
      meta: d.meta ?? {},
    };
  });
  let n = 0;
  for (let i = 0; i < rows.length; i += 40) {
    const chunk = rows.slice(i, i + 40);
    await db
      .insert(items)
      .values(chunk)
      .onConflictDoUpdate({
        target: items.url,
        set: {
          title: sql`excluded.title`,
          summary: sql`CASE WHEN length(excluded.summary) > 0 THEN excluded.summary ELSE ${items.summary} END`,
          score: sql`excluded.score`,
          quality: sql`excluded.quality`,
          tags: sql`(SELECT COALESCE(jsonb_agg(DISTINCT x), '[]'::jsonb) FROM jsonb_array_elements_text(${items.tags} || excluded.tags) AS x)`,
          meta: sql`${items.meta} || excluded.meta`,
          ai: sql`CASE WHEN ${items.title} IS DISTINCT FROM excluded.title OR (length(excluded.summary) > 0 AND ${items.summary} IS DISTINCT FROM excluded.summary) THEN NULL ELSE ${items.ai} END`,
          updatedAt: new Date(),
        },
      });
    n += chunk.length;
  }
  return n;
}

export async function lane<T>(
  name: string,
  fn: () => Promise<Draft[]>,
): Promise<SourceResult> {
  try {
    const drafts = await fn();
    const count = drafts.length ? await upsert(drafts) : 0;
    return { name, count };
  } catch (e) {
    return {
      name,
      count: 0,
      error: e instanceof Error ? e.message.slice(0, 140) : String(e),
    };
  }
}
