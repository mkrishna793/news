import {
  getAi,
  AI_DEFAULT,
  aiEnabled,
  completeText,
  LOCAL_PROBES,
  listModels,
} from "@/lib/ai";
import { setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  // /api/ai?detect=1 probes the usual local servers (Ollama, LM Studio, llama.cpp, Jan...)
  if (u.get("detect")) {
    const found = await Promise.all(
      LOCAL_PROBES.map(async (p) => {
        try {
          return { ...p, models: await listModels(p.baseUrl) };
        } catch {
          return null;
        }
      }),
    );
    return Response.json({ found: found.filter(Boolean) });
  }
  const c = await getAi();
  return Response.json({
    ...c,
    apiKey: c.apiKey ? "••••••" : "",
    enabled: aiEnabled(c),
    probes: LOCAL_PROBES,
  });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const cur = await getAi();
  const next = {
    ...AI_DEFAULT,
    ...cur,
    mode: ["off", "openai", "cli"].includes(b.mode) ? b.mode : cur.mode,
    baseUrl: typeof b.baseUrl === "string" ? b.baseUrl.trim() : cur.baseUrl,
    model: typeof b.model === "string" ? b.model.trim() : cur.model,
    command: typeof b.command === "string" ? b.command.trim() : cur.command,
    apiKey:
      typeof b.apiKey === "string" && b.apiKey !== "••••••"
        ? b.apiKey.trim()
        : cur.apiKey,
  };
  await setSetting("ai", next);
  if (b.test) {
    try {
      const t0 = Date.now();
      const out = await completeText(next, [
        { role: "user", content: "Reply with the single word: ready" },
      ]);
      return Response.json({
        ok: true,
        reply: out.slice(0, 80),
        ms: Date.now() - t0,
      });
    } catch (e) {
      return Response.json({
        ok: false,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }
  return Response.json({ ok: true });
}
