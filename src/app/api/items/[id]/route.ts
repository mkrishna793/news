import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ready } from "@/db/ensure";
import { markRead } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const id = Number((await ctx.params).id);
  const b = await req.json().catch(() => ({}));
  await ready();
  if (typeof b.saved === "boolean")
    await db.update(items).set({ saved: b.saved }).where(eq(items.id, id));
  if (b.read) await markRead(id);
  return Response.json({ ok: true });
}
