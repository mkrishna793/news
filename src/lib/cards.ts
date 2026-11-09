import type { Item } from "@/db/schema";
import { explain, sentimentOf } from "@/lib/plain";
import { clip } from "@/lib/text";

export type Card = {
  id: number;
  kind: string;
  domain: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags: string[];
  authors: string[];
  authorCount: number;
  tldr: string;
  why?: string;
  level: string;
  readMinutes: number;
  saved: boolean;
  read: boolean;
  thumbnail?: string;
  github?: string;
  project?: string;
  peerReviewed?: boolean;
  points?: number;
  comments?: number;
  hnUrl?: string;
  link?: string;
  videoId?: string;
  channel?: string;
  views?: number;
  sentiment?: "up" | "down" | "neutral";
  essentialWhy?: string;
  upvotes?: number;
  stars?: number;
  byAgent?: boolean;
};

const HIDE = new Set([
  "trending",
  "peer-reviewed",
  "journal",
  "youtube",
  "community",
  "cross-field",
  "agent",
]);

export function toCard(i: Item): Card {
  const p = explain({
    kind: i.kind,
    domain: i.domain,
    title: i.title,
    summary: i.summary,
    tags: i.tags,
  });
  const m = i.meta ?? {};
  const why =
    i.kind === "geo"
      ? p.sections.find((s) => s.key === "why")?.text
      : undefined;
  const what = p.sections.find((s) => s.key === "what")?.text;
  return {
    id: i.id,
    kind: i.kind,
    domain: i.domain,
    title: i.title,
    source: i.source,
    url: i.url,
    publishedAt: i.publishedAt.toISOString(),
    tags: i.tags
      .filter((t) => !HIDE.has(t) && !t.startsWith("source:"))
      .slice(0, 4),
    authors: i.authors.slice(0, 3),
    authorCount: i.authors.length,
    tldr: clip(i.summary || what || p.tldr, 420),
    why,
    level: p.level,
    readMinutes: p.readMinutes,
    saved: i.saved,
    read: !!i.readAt,
    thumbnail: m.thumbnail,
    github: m.github,
    project: m.project,
    peerReviewed:
      typeof m.peerReviewed === "boolean" ? m.peerReviewed : undefined,
    points: m.points,
    comments: m.comments,
    hnUrl: m.hnUrl,
    link: m.link,
    videoId: m.videoId,
    channel: m.channel,
    views: m.views,
    sentiment:
      i.kind === "industry"
        ? sentimentOf(i.title + " " + i.summary)
        : undefined,
    essentialWhy: m.why,
    upvotes: m.hfUpvotes,
    stars: m.githubStars ?? m.stars,
    byAgent: !!m.byAgent,
  };
}
