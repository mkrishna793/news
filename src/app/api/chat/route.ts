import { getItem } from "@/lib/data";
import { getAi, aiEnabled, complete, type Msg } from "@/lib/ai";
import { searchAll, verify, extractiveAnswer } from "@/lib/research";
import { tokens } from "@/lib/text";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const message: string = String(body.message ?? "").slice(0, 2000);
  const history: Msg[] = Array.isArray(body.history)
    ? body.history.slice(-6)
    : [];
  const item = body.itemId ? await getItem(Number(body.itemId)) : null;
  const cfg = await getAi();
  const useAi = aiEnabled(cfg);
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) =>
        controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        send({
          type: "start",
          mode: useAi
            ? cfg.mode === "cli"
              ? "agent"
              : cfg.model
            : "algorithm",
        });
        // Short/generic follow-ups ("is this true?") are anchored to the article being discussed.
        const specific = tokens(message).length >= 4;
        const query = item
          ? `${item.title} ${specific ? message : ""}`
          : message;
        const claim = item && !specific ? item.title : message;
        const hits = await searchAll(query, claim, (e) => send(e));
        const verdict = verify(hits);
        send({ type: "sources", hits });
        send({ type: "verdict", verdict });

        if (useAi) {
          const src = hits
            .map(
              (h) =>
                `[${h.n}] (${h.type} · ${h.source}) ${h.title}\n${h.snippet}\n${h.url}`,
            )
            .join("\n\n");
          const system = `You are Atlas, a careful research companion for a curious student with no domain background. Explain in plain language, no jargon without a quick definition. Ground every factual statement in the numbered SOURCES and cite them like [1][3]. If sources are thin, conflicting, or only social chatter, say so explicitly — never present rumors as fact. Automatic cross-check verdict: ${verdict.label} (${verdict.supporters} independent sources). ${verdict.notes.join(" ")}\n${item ? `\nTHE USER IS READING: "${item.title}" (${item.source})\n${item.summary.slice(0, 1800)}\n` : ""}\nSOURCES:\n${src}`;
          try {
            for await (const tok of complete(cfg, [
              { role: "system", content: system },
              ...history,
              { role: "user", content: message },
            ]))
              send({ type: "token", text: tok });
          } catch (e) {
            send({
              type: "ai_error",
              message: e instanceof Error ? e.message : "AI backend failed",
            });
            send({
              type: "token",
              text: "\n\n" + extractiveAnswer(query, hits),
            });
          }
        } else {
          const ans = extractiveAnswer(query, hits);
          for (let i = 0; i < ans.length; i += 24) {
            send({ type: "token", text: ans.slice(i, i + 24) });
            await new Promise((r) => setTimeout(r, 8));
          }
        }
        send({ type: "done" });
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "failed",
        });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
