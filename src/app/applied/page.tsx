import FeedPage from "@/components/FeedPage";
import { APPLIED } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Applied · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FeedPage
      kind="applied"
      title="AI in the real world"
      subtitle="What researchers and builders are actually doing with AI models — experiments, demos, new projects and AI-for-science studies, in plain language."
      emoji="🧪"
      variant="helix"
      color="#34d399"
      color2="#22d3ee"
      sp={await searchParams}
      tabs={APPLIED}
      allLabel="All projects"
    />
  );
}
