import Link from "next/link";
import type { ReactNode } from "react";
import { listItems, domainCounts, tagCounts, dailyCounts } from "@/lib/data";
import { toCard } from "@/lib/cards";
import { KIND_META, type DomainMeta } from "@/lib/meta";
import ItemCard from "@/components/ItemCard";
import VideoGrid from "@/components/VideoGrid";
import {
  PageHero,
  Tabs,
  Empty,
  ActivityChart,
  TagCloud,
  SectionTitle,
} from "@/components/ui";
import type { Variant } from "@/components/Scene3D";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function FeedPage({
  kind,
  title,
  subtitle,
  emoji,
  variant,
  color,
  color2,
  sp,
  tabs,
  mode = "domain",
  before,
  allLabel,
  heroVariantFor,
  essentialsTab,
}: {
  kind: string;
  title: string;
  subtitle: string;
  emoji: string;
  variant: Variant;
  color: string;
  color2?: string;
  sp: SP;
  tabs?: DomainMeta[];
  mode?: "domain" | "tag";
  before?: ReactNode;
  allLabel?: string;
  heroVariantFor?: Record<string, Variant>;
  essentialsTab?: boolean;
}) {
  const tabKey = one(sp.d) ?? one(sp.t) ?? "all";
  const tag = one(sp.tag);
  const sort = one(sp.s) === "latest" ? "latest" : "top";
  const limit = Math.min(Number(one(sp.n) ?? 24) || 24, 120);
  const isEss = tabKey === "essentials";
  const base = KIND_META[kind].href;
  const param = mode === "tag" ? "t" : "d";

  const [rows, counts, tags, daily] = await Promise.all([
    listItems({
      kind,
      domain: mode === "domain" && !isEss ? tabKey : undefined,
      tag: tag ?? (mode === "tag" && tabKey !== "all" ? tabKey : undefined),
      sort: isEss ? "top" : sort,
      limit,
      essentials: isEss ? "only" : "exclude",
    }),
    domainCounts(kind),
    tagCounts(kind, 14),
    dailyCounts(kind),
  ]);
  const cards = rows.map(toCard);
  const total = counts.reduce((a, c) => a + c.n, 0);
  const tabItems: (DomainMeta & { count?: number })[] = (tabs ?? []).map(
    (t) => ({
      ...t,
      count:
        mode === "domain"
          ? counts.find((c) => c.domain === t.key)?.n
          : undefined,
    }),
  );
  if (essentialsTab)
    tabItems.push({
      key: "essentials",
      label: "Essential classics",
      emoji: "🏛️",
      color: "#fbbf24",
      blurb: "",
    });
  const hv = heroVariantFor?.[tabKey] ?? variant;
  const activeMeta = tabs?.find((t) => t.key === tabKey);
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (tabKey !== "all") p.set(param, tabKey);
    if (tag) p.set("tag", tag);
    if (sort === "latest") p.set("s", "latest");
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `${base}?${p.toString()}`;
  };

  return (
    <>
      <PageHero
        title={title}
        subtitle={
          activeMeta?.blurb ? `${activeMeta.blurb}. ${subtitle}` : subtitle
        }
        emoji={emoji}
        variant={hv}
        color={activeMeta?.color ?? color}
        color2={color2}
        stats={[
          { label: "items · 2 weeks", value: total },
          { label: "showing", value: cards.length },
        ]}
      />
      {before}
      <Tabs
        base={base}
        param={param}
        active={tabKey}
        items={tabItems}
        allLabel={allLabel}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ActivityChart data={daily} color={activeMeta?.color ?? color} />
        <TagCloud tags={tags} base={base} color={activeMeta?.color ?? color} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        {tag && (
          <Link
            href={tabKey === "all" ? base : `${base}?${param}=${tabKey}`}
            className="chip"
            style={{ ["--c" as string]: color }}
          >
            topic: {tag} ✕
          </Link>
        )}
        {!isEss && (
          <div className="ml-auto flex gap-1.5">
            <Link
              href={qs({ s: "top" })}
              className="pill !py-1.5 !text-xs"
              data-active={sort === "top"}
            >
              🔥 Most important
            </Link>
            <Link
              href={qs({ s: "latest" })}
              className="pill !py-1.5 !text-xs"
              data-active={sort === "latest"}
            >
              🕒 Newest
            </Link>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <Empty />
      ) : kind === "video" ? (
        <VideoGrid videos={cards} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c, i) => (
            <div
              key={c.id}
              className="fade-up"
              style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}
            >
              <ItemCard c={c} />
            </div>
          ))}
        </div>
      )}
      {rows.length >= limit && limit < 120 && (
        <div className="mt-8 text-center">
          <Link
            href={qs({ n: String(limit + 24) })}
            className="btn btn-primary"
          >
            Show more
          </Link>
        </div>
      )}
      <SectionTitle color={color}>How this page is ranked</SectionTitle>
      <p className="max-w-3xl text-[13px] leading-relaxed text-mute">
        No AI needed: every item gets an importance score from community
        engagement (upvotes, comments), breakthrough keywords, how many
        independent sources mention it, and freshness — older items fade out
        smoothly. The plain-English text is produced by a built-in explainer
        (sentence structuring + a glossary of 200+ technical terms). Connect a
        local AI in{" "}
        <Link className="text-violet underline" href="/connect">
          Connect
        </Link>{" "}
        to deepen it.
      </p>
    </>
  );
}
