import { listItems } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const rows = await listItems({
    q: u.get("q") ?? undefined,
    kind: u.get("kind") ?? undefined,
    domain: u.get("domain") ?? undefined,
    tag: u.get("tag") ?? undefined,
    sort: u.get("sort") === "latest" ? "latest" : "top",
    limit: Number(u.get("limit") ?? 20),
    saved: u.get("saved") === "1",
    essentials: "any",
  });
  return Response.json({
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      domain: r.domain,
      title: r.title,
      source: r.source,
      publishedAt: r.publishedAt,
    })),
  });
}
