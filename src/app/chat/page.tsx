import { getItem } from "@/lib/data";
import { getAi, aiEnabled } from "@/lib/ai";
import ChatClient from "@/components/ChatClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ask Atlas · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const itemId = Number(one(sp.item));
  const item = itemId ? await getItem(itemId) : null;
  const cfg = await getAi();
  return (
    <ChatClient
      item={
        item ? { id: item.id, title: item.title, source: item.source } : null
      }
      initialQ={one(sp.q) ?? ""}
      ai={{
        enabled: aiEnabled(cfg),
        label:
          cfg.mode === "cli"
            ? "Local agent"
            : cfg.mode === "openai"
              ? cfg.model
              : "",
      }}
    />
  );
}
