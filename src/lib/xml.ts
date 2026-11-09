import { XMLParser } from "fast-xml-parser";
import { stripHtml } from "@/lib/text";

export const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
  trimValues: true,
});

 
type Any = any;
const arr = <T>(x: T | T[] | undefined | null): T[] =>
  x == null ? [] : Array.isArray(x) ? x : [x];
const txt = (x: Any): string => {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object" && "#text" in x) return String(x["#text"]);
  return "";
};

export type FeedEntry = {
  title: string;
  link: string;
  summary: string;
  published: Date;
  author: string;
  thumbnail?: string;
  videoId?: string;
  views?: number;
  extra?: Any;
};

export function parseFeed(raw: string): FeedEntry[] {
  const doc = xml.parse(raw) as Any;
  const out: FeedEntry[] = [];
  // Atom
  if (doc.feed) {
    for (const e of arr<Any>(doc.feed.entry)) {
      const links = arr<Any>(e.link);
      const alt =
        links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ??
        links[0];
      const mg = e["media:group"];
      const thumb =
        mg?.["media:thumbnail"]?.["@_url"] ?? e["media:thumbnail"]?.["@_url"];
      const views = Number(
        mg?.["media:community"]?.["media:statistics"]?.["@_views"] ?? 0,
      );
      out.push({
        title: stripHtml(txt(e.title)),
        link: alt?.["@_href"] ?? txt(e.id),
        summary: stripHtml(
          txt(e.summary) || txt(e.content) || txt(mg?.["media:description"]),
        ),
        published: new Date(txt(e.published) || txt(e.updated) || Date.now()),
        author: txt(e.author?.name),
        thumbnail: thumb,
        videoId: txt(e["yt:videoId"]) || undefined,
        views: views || undefined,
      });
    }
    return out.filter((e) => e.title && e.link);
  }
  // RSS
  const ch = doc.rss?.channel ?? doc["rdf:RDF"] ?? {};
  for (const e of arr<Any>(ch.item ?? doc["rdf:RDF"]?.item)) {
    const thumb =
      e["media:thumbnail"]?.["@_url"] ??
      arr<Any>(e["media:content"])[0]?.["@_url"] ??
      e.enclosure?.["@_url"];
    out.push({
      title: stripHtml(txt(e.title)),
      link: txt(e.link) || txt(e.guid),
      summary: stripHtml(txt(e.description) || txt(e["content:encoded"])),
      published: new Date(txt(e.pubDate) || txt(e["dc:date"]) || Date.now()),
      author: txt(e["dc:creator"]) || txt(e.author),
      thumbnail: thumb,
      extra: { source: txt(e.source) },
    });
  }
  return out.filter((e) => e.title && e.link);
}

export { arr, txt };
