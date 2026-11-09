import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getItem, related } from "@/lib/data";
import { domainMeta, KIND_META } from "@/lib/meta";
import {
  EnrichProvider,
  Figures,
  Authors,
  LinksBox,
} from "@/components/Enrich";
import { ActionBar, AiExplain, MarkRead } from "@/components/ItemActions";
import SourceAbstract from "@/components/SourceAbstract";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const item = Number.isFinite(id) ? await getItem(id) : null;
  if (!item) notFound();
  const rel = await related(item, 4);
  const dm = domainMeta(item.kind, item.domain);
  const km = KIND_META[item.kind];
  const paper = item.kind === "paper";
  return (
    <EnrichProvider id={id} enabled={paper}>
      <MarkRead id={id} />
      <Link className="text-link my-6" href={km?.href || "/"}>
        <ArrowLeft size={14} /> Back to {km?.label || "overview"}
      </Link>
      <header className="article-header">
        <div className="eyebrow">
          {dm.label} / {item.source} /{" "}
          {item.publishedAt.toLocaleDateString("en-GB")}
        </div>
        <h1>{item.title}</h1>
        <p>{item.authors.join(", ")}</p>
        <div className="article-actions">
          <ActionBar id={id} saved={item.saved} />
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Read the original <ArrowUpRight size={14} />
          </a>
        </div>
        {paper && (
          <small>
            {item.meta.peerReviewed
              ? "Journal article — see source for peer-review details"
              : "Preprint or unverified review status. Findings may change."}
          </small>
        )}
      </header>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <SourceAbstract
            id={id}
            text={
              item.summary ||
              "No source abstract was provided. Open the original publication to read the full text."
            }
          />
          {paper && <Figures />}
          {item.ai?.text && (
            <section className="glass rounded-xl p-7">
              <div className="eyebrow">
                MODEL-ASSISTED CONTEXT / CHECK AGAINST THE SOURCE
              </div>
              <div className="source-abstract">
                {item.ai.text.split(/\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}
          <AiExplain id={id} hasAi={!!item.ai} />
          <section>
            <div className="section-heading">
              <h2>Follow the connections</h2>
            </div>
            {rel.length ? (
              rel.map((p) => (
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
                More connections appear as your library grows.
              </p>
            )}
          </section>
        </div>
        <aside>
          <Authors fallback={item.authors} />
          <div className="mt-6">
            <LinksBox original={item.url} />
          </div>
        </aside>
      </div>
    </EnrichProvider>
  );
}
