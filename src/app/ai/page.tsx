import FeedPage from "@/components/FeedPage";
import { AI_RADAR } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Radar · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FeedPage
      kind="ai_news"
      title="AI Radar"
      subtitle="New models, open-source releases, bugs and problems, straight from Hugging Face, Reddit, Hacker News, GitHub and the small labs — no hype, just what changed."
      emoji="📡"
      variant="neural"
      color="#22d3ee"
      color2="#8b5cf6"
      sp={await searchParams}
      tabs={AI_RADAR}
      allLabel="Everything"
    />
  );
}
