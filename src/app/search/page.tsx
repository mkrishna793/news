import { listItems } from "@/lib/data";
import { toCard } from "@/lib/cards";
import ItemCard from "@/components/ItemCard";
import VideoGrid from "@/components/VideoGrid";
import { PageHero, Empty } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = String(Array.isArray(sp.q) ? sp.q[0] : (sp.q ?? "")).trim();
  const rows = q
    ? (await listItems({ q, limit: 60, essentials: "any" })).map(toCard)
    : [];
  const videos = rows.filter((r) => r.kind === "video");
  const rest = rows.filter((r) => r.kind !== "video");
  return (
    <>
      <PageHero
        title={q ? `“${q}”` : "Search"}
        subtitle={
          q
            ? `${rows.length} matches across research, AI, industry, world and videos.`
            : "Type something in the search bar."
        }
        emoji="🔎"
        variant="globe"
        color="#a78bfa"
        color2="#22d3ee"
      >
        {q && (
          <Link
            href={`/chat?q=${encodeURIComponent(q)}`}
            className="btn btn-primary"
          >
            Ask Atlas to research this across 7 sources →
          </Link>
        )}
      </PageHero>
      {rows.length === 0 ? (
        <Empty
          title={q ? "No local matches" : "Search your knowledge base"}
          hint="Try Ask Atlas — it searches arXiv, OpenAlex, Wikipedia, news, Hacker News and Reddit in parallel."
        />
      ) : null}
      {rest.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((c) => (
            <ItemCard key={c.id} c={c} />
          ))}
        </div>
      )}
      {videos.length > 0 && (
        <div className="mt-8">
          <VideoGrid videos={videos} />
        </div>
      )}
    </>
  );
}
