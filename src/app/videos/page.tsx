import FeedPage from "@/components/FeedPage";
import { VIDEO } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Videos · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FeedPage
      kind="video"
      title="Watch & learn"
      subtitle="Lectures, clear explainers and people building amazing things — pulled from 25+ science and tech channels (add your own in Connect). Plays in a privacy-friendly player."
      emoji="🎬"
      variant="helix"
      color="#f87171"
      color2="#fbbf24"
      sp={await searchParams}
      tabs={VIDEO}
      allLabel="All videos"
    />
  );
}
