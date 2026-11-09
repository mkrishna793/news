import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sources } from "@/db/schema";
import { listSources } from "@/lib/ingest/custom";
import { resolveChannelId } from "@/lib/ingest/videos";
import { kickoff } from "@/lib/ingest";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ sources: await listSources() });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  let { type, target, name } = b as {
    type: string;
    target: string;
    name?: string;
  };
  if (!type || !target)
    return Response.json(
      { error: "type and target are required" },
      { status: 400 },
    );
  target = target.trim();
  try {
    if (type === "youtube") {
      const r = await resolveChannelId(target);
      if (!r)
        return Response.json(
          {
            error:
              "Couldn't find that YouTube channel. Paste the channel URL or @handle.",
          },
          { status: 400 },
        );
      target = r.id;
      name = name || r.name;
    }
    await db
      .insert(sources)
      .values({
        type,
        target,
        name: name || target,
        section: b.section ?? "ai_news",
        domain: b.domain ?? "general",
      })
      .onConflictDoNothing();
    kickoff();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const b = await req.json().catch(() => ({}));
  await db
    .update(sources)
    .set({ enabled: !!b.enabled })
    .where(eq(sources.id, Number(b.id)));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(sources).where(eq(sources.id, id));
  return Response.json({ ok: true });
}
