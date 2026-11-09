import FeedPage from "@/components/FeedPage";
import { INDUSTRY } from "@/lib/meta";
import { getSetting } from "@/lib/settings";
import type { Quote } from "@/lib/ingest/videos";
import { MarketBoard } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Industry & markets · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const m = await getSetting<{ at?: string; quotes?: Quote[] }>("market", {});
  return (
    <FeedPage
      kind="industry"
      title="AI industry & markets"
      subtitle="Big-tech moves, stock gains and losses, funding and layoffs — with a one-line read on whether it’s good or bad news."
      emoji="📈"
      variant="globe"
      color="#60a5fa"
      color2="#8b5cf6"
      sp={await searchParams}
      tabs={INDUSTRY}
      allLabel="All industry"
      before={
        m.quotes?.length ? (
          <div className="mb-7">
            <MarketBoard quotes={m.quotes} at={m.at} />
          </div>
        ) : null
      }
    />
  );
}
