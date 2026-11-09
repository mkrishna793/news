import { db } from "@/db";
import { projects } from "@/db/schema";
import { ready } from "@/db/ensure";

export const dynamic = "force-dynamic";

export async function GET() {
  await ready();
  return Response.json({
    projects: await db
      .select()
      .from(projects)
      .orderBy(projects.position, projects.id),
  });
}

export async function POST(req: Request) {
  await ready();
  const b = await req.json().catch(() => ({}));
  if (!b.title)
    return Response.json({ error: "title required" }, { status: 400 });
  const repo = String(b.repo ?? "")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "")
    .trim();
  const [row] = await db
    .insert(projects)
    .values({
      title: String(b.title).slice(0, 80),
      repo,
      tagline: String(b.tagline ?? "").slice(0, 160),
      emoji: String(b.emoji ?? "🚀").slice(0, 8),
      accent: String(b.accent ?? "violet"),
      nextAction: String(b.nextAction ?? "").slice(0, 200),
      goals: Array.isArray(b.goals)
        ? b.goals
            .slice(0, 20)
            .map((g: { text: string; done?: boolean }) => ({
              text: String(g.text).slice(0, 140),
              done: !!g.done,
            }))
        : [],
    })
    .returning();
  return Response.json({ project: row });
}
