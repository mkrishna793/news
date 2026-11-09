import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getItem } from "@/lib/data";
import { getAi, aiEnabled, completeText } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  const item = await getItem(Number(id));
  if (!item) return Response.json({ error: "not found" }, { status: 404 });
  const cfg = await getAi();
  if (!aiEnabled(cfg))
    return Response.json(
      { error: "No AI connected. Open Connect → AI brain (optional)." },
      { status: 400 },
    );
  try {
    const text = await completeText(cfg, [
      {
        role: "system",
        content:
          "You explain research and news to a curious person with NO background in the field. Be accurate, concrete and brief. Never invent facts that are not in the text. Write like a thoughtful science editor in flowing, natural paragraphs, not a numbered tutorial or rigid template. Begin with the actual finding, explain the mechanism and uncertainty, and stay close to the supplied source. Distinguish a preprint from established evidence. Define technical terms only when needed.",
      },
      {
        role: "user",
        content: `Title: ${item.title}\nSource: ${item.source}\nAuthors: ${item.authors.slice(0, 8).join(", ")}\n\nText:\n${item.summary}`,
      },
    ]);
    const ai = {
      text,
      at: new Date().toISOString(),
      model: cfg.mode === "cli" ? "local agent" : cfg.model,
    };
    await db.update(items).set({ ai }).where(eq(items.id, item.id));
    return Response.json({ ai });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "AI failed" },
      { status: 502 },
    );
  }
}
