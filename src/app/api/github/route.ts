import { db } from "@/db";
import { projects } from "@/db/schema";
import { ready } from "@/db/ensure";
import { getSetting, setSetting } from "@/lib/settings";
import { snapshot, attention, myRepos, type GhConfig } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const cfg = await getSetting<GhConfig>("github", {});
  if (u.get("repos")) {
    try {
      return Response.json({ repos: await myRepos() });
    } catch (e) {
      return Response.json({
        repos: [],
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }
  await ready();
  const ps = await db.select().from(projects);
  const force = !!u.get("force");
  const snaps = await Promise.all(
    ps.filter((p) => p.repo).map((p) => snapshot(p.repo, force)),
  );
  const att = await attention();
  return Response.json({
    configured: { token: !!cfg.token, username: cfg.username ?? "" },
    snaps: Object.fromEntries(snaps.map((s) => [s.repo, s])),
    attention: att,
  });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const cur = await getSetting<GhConfig>("github", {});
  await setSetting("github", {
    token:
      typeof b.token === "string" && b.token !== "••••••"
        ? b.token.trim()
        : cur.token,
    username: typeof b.username === "string" ? b.username.trim() : cur.username,
  });
  return Response.json({ ok: true });
}
