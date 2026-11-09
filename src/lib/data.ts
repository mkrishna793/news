import { sql, eq, and, desc, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { items, type Item } from "@/db/schema";
import { ready } from "@/db/ensure";
import { HALF_LIFE } from "@/lib/rank";
import { tokens } from "@/lib/text";

export type ListOpts = {
  kind?: string;
  domain?: string;
  tag?: string;
  q?: string;
  source?: string;
  sort?: "top" | "latest";
  limit?: number;
  offset?: number;
  saved?: boolean;
  essentials?: "only" | "exclude" | "any";
  withinDays?: number;
  ids?: number[];
};

const halfLife = sql`CASE ${items.kind} ${sql.join(
  Object.entries(HALF_LIFE).map(([k, v]) => sql`WHEN ${k} THEN ${v}`),
  sql` `,
)} ELSE 48 END`;

export const rankExpr = sql`(${items.quality} + 45 * exp(-least(60.0, 0.693 * extract(epoch from (now() - ${items.publishedAt})) / 3600 / ${halfLife})))`;

export async function listItems(o: ListOpts = {}): Promise<Item[]> {
  await ready();
  const w: SQL[] = [];
  if (o.kind) w.push(eq(items.kind, o.kind));
  if (o.domain && o.domain !== "all") w.push(eq(items.domain, o.domain));
  if (o.tag && o.tag !== "all") w.push(sql`${items.tags} ? ${o.tag}`);
  if (o.source) w.push(eq(items.source, o.source));
  if (o.saved) w.push(eq(items.saved, true));
  if (o.ids?.length)
    w.push(
      sql`${items.id} IN (${sql.join(
        o.ids.map((i) => sql`${i}`),
        sql`, `,
      )})`,
    );
  if (o.withinDays)
    w.push(
      sql`${items.publishedAt} > now() - ${`${o.withinDays} days`}::interval`,
    );
  const ess = o.essentials ?? "exclude";
  if (ess === "only") w.push(sql`${items.tags} ? 'essential'`);
  else if (ess === "exclude" && !o.saved)
    w.push(sql`NOT (${items.tags} ? 'essential')`);
  if (o.q) {
    for (const t of tokens(o.q).slice(0, 6)) {
      const like = `%${t}%`;
      w.push(
        sql`(${items.title} ILIKE ${like} OR ${items.summary} ILIKE ${like} OR ${items.source} ILIKE ${like})`,
      );
    }
  }
  const q = db
    .select()
    .from(items)
    .where(w.length ? and(...w) : undefined)
    .orderBy(o.sort === "latest" ? desc(items.publishedAt) : desc(rankExpr))
    .limit(Math.min(o.limit ?? 30, 200))
    .offset(o.offset ?? 0);
  return q;
}

export async function getItem(id: number): Promise<Item | null> {
  await ready();
  const r = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return r[0] ?? null;
}

export async function related(item: Item, n = 5): Promise<Item[]> {
  await ready();
  const tg = item.tags
    .filter(
      (t) =>
        ![
          "trending",
          "peer-reviewed",
          "journal",
          "youtube",
          "reddit",
          "community",
        ].includes(t),
    )
    .slice(0, 4);
  const kw = tokens(item.title)
    .filter((t) => t.length > 4)
    .slice(0, 3);
  const w: SQL[] = [sql`${items.id} <> ${item.id}`];
  const likes = [
    ...tg.map((t) => sql`${items.tags} ? ${t}`),
    ...kw.map((k) => sql`${items.title} ILIKE ${"%" + k + "%"}`),
  ];
  if (!likes.length) return [];
  w.push(sql`(${sql.join(likes, sql` OR `)})`);
  return db
    .select()
    .from(items)
    .where(and(...w))
    .orderBy(desc(rankExpr))
    .limit(n);
}

export async function domainCounts(
  kind: string,
  days = 14,
): Promise<{ domain: string; n: number }[]> {
  await ready();
  const r = await db.execute(
    sql`SELECT domain, count(*)::int AS n FROM items WHERE kind = ${kind} AND published_at > now() - ${`${days} days`}::interval AND NOT (tags ? 'essential') GROUP BY domain ORDER BY n DESC`,
  );
  return r.rows as { domain: string; n: number }[];
}

export async function tagCounts(
  kind: string,
  limit = 14,
  days = 14,
): Promise<{ tag: string; n: number }[]> {
  await ready();
  const r = await db.execute(
    sql`SELECT t AS tag, count(*)::int AS n FROM items, jsonb_array_elements_text(tags) t WHERE kind = ${kind} AND published_at > now() - ${`${days} days`}::interval AND t NOT IN ('trending','peer-reviewed','journal','youtube','reddit','community','cross-field','github') AND t NOT LIKE 'source:%' GROUP BY t ORDER BY n DESC LIMIT ${limit}`,
  );
  return r.rows as { tag: string; n: number }[];
}

export async function dailyCounts(
  kind?: string,
  days = 14,
): Promise<{ day: string; n: number }[]> {
  await ready();
  const r = await db.execute(
    sql`SELECT to_char(date_trunc('day', published_at), 'YYYY-MM-DD') AS day, count(*)::int AS n FROM items WHERE published_at > now() - ${`${days} days`}::interval ${kind ? sql`AND kind = ${kind}` : sql``} AND NOT (tags ? 'essential') GROUP BY 1 ORDER BY 1`,
  );
  return r.rows as { day: string; n: number }[];
}

export async function sourceCounts(
  kind: string,
): Promise<{ source: string; n: number }[]> {
  await ready();
  const r = await db.execute(
    sql`SELECT source, count(*)::int AS n FROM items WHERE kind = ${kind} GROUP BY source ORDER BY n DESC LIMIT 12`,
  );
  return r.rows as { source: string; n: number }[];
}

export async function totals(): Promise<Record<string, number>> {
  await ready();
  const r = await db.execute(
    sql`SELECT kind, count(*)::int AS n FROM items GROUP BY kind`,
  );
  const out: Record<string, number> = {};
  for (const row of r.rows as { kind: string; n: number }[])
    out[row.kind] = row.n;
  return out;
}

export async function markRead(id: number) {
  await ready();
  await db
    .update(items)
    .set({ readAt: new Date() })
    .where(and(eq(items.id, id), sql`${items.readAt} IS NULL`));
}

export async function readStats(): Promise<{
  today: number;
  week: number;
  streak: number;
  saved: number;
}> {
  await ready();
  const r = await db.execute(
    sql`SELECT to_char(date_trunc('day', read_at), 'YYYY-MM-DD') AS d FROM items WHERE read_at IS NOT NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 60`,
  );
  const days = new Set((r.rows as { d: string }[]).map((x) => x.d));
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  let streak = 0;
  let t = Date.now();
  if (!days.has(iso(t))) t -= 864e5;
  while (days.has(iso(t))) {
    streak++;
    t -= 864e5;
  }
  const c = await db.execute(
    sql`SELECT count(*) FILTER (WHERE read_at > date_trunc('day', now()))::int AS today, count(*) FILTER (WHERE read_at > now() - interval '7 days')::int AS week, count(*) FILTER (WHERE saved)::int AS saved FROM items`,
  );
  const row = c.rows[0] as { today: number; week: number; saved: number };
  return { ...row, streak };
}
