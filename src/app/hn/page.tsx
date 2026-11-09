import Link from "next/link";
import { MessagesSquare, ExternalLink } from "lucide-react";
import { listItems, domainCounts } from "@/lib/data";
import { toCard } from "@/lib/cards";
import { PageHero, Tabs, Empty } from "@/components/ui";
import { SaveButton } from "@/components/ItemCard";
import { HN } from "@/lib/meta";
import { hostOf, timeAgo } from "@/lib/text";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hacker News · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const d = (Array.isArray(sp.d) ? sp.d[0] : sp.d) ?? "all";
  const [rows, counts] = await Promise.all([
    listItems({ kind: "hn", domain: d, limit: 60 }),
    domainCounts("hn", 7),
  ]);
  const cards = rows.map(toCard);
  return (
    <>
      <PageHero
        title="Hacker News, distilled"
        subtitle="What curious engineers, founders and scientists are reading and building right now. Open the discussion or the article — no ads, no login."
        emoji="🔥"
        variant="neural"
        color="#fb923c"
        color2="#f472b6"
        stats={[
          { label: "stories", value: counts.reduce((a, c) => a + c.n, 0) },
        ]}
      />
      <Tabs
        base="/hn"
        param="d"
        active={d}
        items={HN.map((h) => ({
          ...h,
          count: counts.find((c) => c.domain === h.key)?.n,
        }))}
        allLabel="Both"
      />
      {!cards.length ? (
        <Empty />
      ) : (
        <div className="glass divide-y divide-line overflow-hidden rounded-3xl">
          {cards.map((c, i) => (
            <div
              key={c.id}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]"
            >
              <div className="w-8 text-center text-lg font-extrabold text-white/25 group-hover:text-orange-300">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={c.link ?? c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="clamp-2 text-[15px] font-semibold leading-snug text-white hover:text-orange-200"
                >
                  {c.title}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11.5px] text-mute">
                  {c.link && <span>{hostOf(c.link)}</span>}
                  <span className="font-semibold text-orange-300">
                    ▲ {c.points}
                  </span>
                  <span>{timeAgo(c.publishedAt)}</span>
                  <span>by {c.authors[0]}</span>
                </div>
              </div>
              <Link
                href={c.url}
                target="_blank"
                className="btn !px-2.5 !py-1.5 !text-[11.5px]"
              >
                <MessagesSquare size={13} /> {c.comments ?? 0}
              </Link>
              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn !p-2 max-sm:hidden"
                  title="Open article"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <SaveButton id={c.id} saved={c.saved} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
