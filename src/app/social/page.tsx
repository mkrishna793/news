import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { listItems } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Page() {
  const items = await listItems({
    kind: "ai_news",
    domain: "community",
    limit: 25,
  });
  return (
    <>
      <section className="desk-intro">
        <div>
          <div className="eyebrow">COMMUNITY SIGNALS</div>
          <h1>
            Ideas in conversation.
            <br />
            <em>Always follow the source.</em>
          </h1>
          <p>
            Research discussions from the communities building and questioning
            what comes next.
          </p>
        </div>
      </section>
      <div className="glass rounded-xl p-6">
        <h2 className="font-serif text-2xl">A window onto X</h2>
        <p className="my-4 text-xs leading-7 text-mute">
          X requires API access for automated collection. These links open live
          searches on X; posts are not scraped or presented as verified research
          here.
        </p>
        <div className="topic-chips">
          {[
            "quantum biology",
            "AI research",
            "open source",
            "computational neuroscience",
          ].map((q) => (
            <a
              key={q}
              href={`https://x.com/search?q=${encodeURIComponent(q)}&f=live`}
              target="_blank"
              rel="noreferrer"
            >
              {q} ↗
            </a>
          ))}
        </div>
      </div>
      <div className="section-heading mt-8">
        <h2>Across the community</h2>
        <Link href="/connect">
          Manage sources <ArrowUpRight size={13} />
        </Link>
      </div>
      {items.length ? (
        items.map((p) => (
          <article className="reading-row" key={p.id}>
            <div>
              <div className="eyebrow">{p.source}</div>
              <Link href={`/item/${p.id}`}>
                <h3>{p.title}</h3>
              </Link>
              <p>{p.summary}</p>
            </div>
          </article>
        ))
      ) : (
        <p className="feed-empty">
          No community posts collected yet. Update your feed to check Hacker
          News, Reddit and configured sources.
        </p>
      )}
    </>
  );
}
