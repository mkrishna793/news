import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const id = Number((await ctx.params).id);
  const b = await req.json().catch(() => ({}));
  const set: Partial<typeof projects.$inferInsert> = {};
  for (const k of [
    "title",
    "tagline",
    "emoji",
    "accent",
    "status",
    "nextAction",
    "notes",
  ] as const)
    if (typeof b[k] === "string") set[k] = b[k];
  if (typeof b.repo === "string")
    set.repo = b.repo
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/$/, "")
      .trim();
  if (Array.isArray(b.goals))
    set.goals = b.goals
      .slice(0, 30)
      .map((g: { text: string; done?: boolean }) => ({
        text: String(g.text).slice(0, 140),
        done: !!g.done,
      }));
  if (Object.keys(set).length)
    await db.update(projects).set(set).where(eq(projects.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(
  _: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await db
    .delete(projects)
    .where(eq(projects.id, Number((await ctx.params).id)));
  return Response.json({ ok: true });
}
