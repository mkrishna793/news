import FeedPage from "@/components/FeedPage";
import { WORLD } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "World · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FeedPage
      kind="geo"
      title="The world, simply broken down"
      subtitle="India’s place in the world, student & education policy, wars and tech geopolitics. Each story: what happened, who’s involved, why it matters to you, what to watch. Local party politics and religion are filtered out."
      emoji="🌍"
      variant="globe"
      color="#fb923c"
      color2="#34d399"
      sp={await searchParams}
      tabs={WORLD}
      mode="tag"
      allLabel="All stories"
    />
  );
}
