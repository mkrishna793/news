import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sources, type Source } from "@/db/schema";
import { getText, getJson } from "@/lib/http";
import { parseFeed, arr } from "@/lib/xml";
import { clip, stripHtml } from "@/lib/text";
import { ready } from "@/db/ensure";
import { channelVideos } from "./videos";
import { hnSearch, ghHeaders } from "./ai";
import { geoTags } from "./news";
import { industryDomain } from "./news";
import type { Draft, Any } from "./common";

type Kind = Draft["kind"];

// Turn one user-connected source (RSS, subreddit, YouTube channel, Mastodon tag,
// Bluesky search, HN keyword, GitHub topic...) into feed items for its section.
export async function pullSource(s: Source): Promise<Draft[]> {
  const kind = s.section as Kind;
  const domain = s.domain || "general";
  const tag = `source:${s.name}`;
  const mk = (x: Partial<Draft> & { title: string; url: string }): Draft => ({
    kind,
    domain,
    source: s.name,
    summary: "",
    publishedAt: new Date(),
    score: 35,
    tags: [tag, s.type],
    ...x,
  });
  switch (s.type) {
    case "rss":
      return parseFeed(await getText(s.target))
        .slice(0, 15)
        .map((e) =>
          mk({
            title: e.title,
            url: e.link,
            summary: clip(e.summary, 800),
            publishedAt: e.published,
            authors: e.author ? [e.author] : [],
            meta: { thumbnail: e.thumbnail },
          }),
        );
    case "reddit": {
      const sub = s.target.replace(/^\/?r\//, "");
      return parseFeed(
        await getText(
          `https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=15`,
        ),
      )
        .slice(0, 12)
        .map((e, i) =>
          mk({
            title: e.title,
            url: e.link,
            summary: clip(e.summary.replace(/submitted by.*$/i, ""), 600),
            publishedAt: e.published,
            score: 60 - i * 3,
            authors: e.author ? [e.author] : [],
          }),
        );
    }
    case "youtube":
      return channelVideos(
        s.name,
        s.target,
        domain === "general" ? "explainers" : domain,
        6,
        120,
      );
    case "mastodon": {
      const [host, tagName] = s.target.split("#");
      const d = await getJson<Any[]>(
        `https://${host || "mastodon.social"}/api/v1/timelines/tag/${encodeURIComponent(tagName)}?limit=20`,
      );
      return d.map((p) =>
        mk({
          title:
            clip(stripHtml(p.content), 140) || `Post by ${p.account?.acct}`,
          url: p.url,
          summary: stripHtml(p.content),
          authors: [p.account?.display_name || p.account?.acct],
          publishedAt: new Date(p.created_at),
          score: 20 + p.favourites_count * 3 + p.reblogs_count * 4,
        }),
      );
    }
    case "bluesky": {
      const d = await getJson<Any>(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(s.target)}&sort=top&limit=20`,
      );
      return arr<Any>(d.posts).map((p) =>
        mk({
          title: clip(p.record?.text ?? "", 140),
          url: `https://bsky.app/profile/${p.author?.handle}/post/${String(p.uri).split("/").pop()}`,
          summary: p.record?.text ?? "",
          authors: [p.author?.displayName || p.author?.handle],
          publishedAt: new Date(p.record?.createdAt ?? Date.now()),
          score: 20 + p.likeCount * 2 + p.repostCount * 4,
        }),
      );
    }
    case "hn":
      return hnSearch(
        s.target,
        kind === "applied" ? "applied" : "ai_news",
        domain,
        "story",
        10,
        120,
      ).then((x) =>
        x.map((d) => ({ ...d, kind, tags: [...(d.tags ?? []), tag] })),
      );
    case "github_topic": {
      const d = await getJson<Any>(
        `https://api.github.com/search/repositories?q=topic:${encodeURIComponent(s.target)}&sort=updated&order=desc&per_page=12`,
        { headers: await ghHeaders() },
      );
      return arr<Any>(d.items).map((r) =>
        mk({
          title: `${r.full_name} — ${clip(r.description ?? "", 90)}`,
          url: r.html_url,
          summary: `${r.description ?? ""} ★ ${r.stargazers_count}`,
          score: r.stargazers_count / 5,
          publishedAt: new Date(r.pushed_at),
          meta: { github: r.html_url },
        }),
      );
    }
    case "gnews": {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(s.target + " when:3d")}&hl=en-IN&gl=IN&ceid=IN:en`;
      return parseFeed(await getText(url))
        .slice(0, 12)
        .map((e) => {
          const m = e.title.match(/^(.*) - ([^-]{2,40})$/);
          const title = m ? m[1] : e.title;
          return mk({
            title,
            url: e.link,
            publishedAt: e.published,
            source: m?.[2] ?? s.name,
            tags: [tag, ...(kind === "geo" ? geoTags(title) : [])],
            domain: kind === "industry" ? industryDomain(title) : domain,
          });
        });
    }
    default:
      return [];
  }
}

export async function listSources(): Promise<Source[]> {
  await ready();
  return db.select().from(sources).orderBy(sources.id);
}
export async function enabledSources(): Promise<Source[]> {
  await ready();
  return db.select().from(sources).where(eq(sources.enabled, true));
}
