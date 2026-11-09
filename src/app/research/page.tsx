import FeedPage from "@/components/FeedPage";
import { RESEARCH } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FeedPage
      kind="paper"
      title="Research, decoded"
      subtitle="New papers from neuroscience journals, quantum physics, AI and the spaces between — with original abstracts, authors, code and source links."
      emoji="🔬"
      variant="neural"
      color="#8b5cf6"
      color2="#22d3ee"
      sp={await searchParams}
      tabs={RESEARCH}
      essentialsTab
      allLabel="All fields"
      heroVariantFor={{
        neuro: "helix",
        quantum: "atom",
        ai: "neural",
        inter: "globe",
        essentials: "neural",
      }}
    />
  );
}
