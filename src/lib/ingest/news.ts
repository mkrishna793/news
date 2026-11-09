import { getJson, getText } from "@/lib/http";
import { parseFeed } from "@/lib/xml";
import { clip, stripHtml } from "@/lib/text";
import { arr } from "@/lib/xml";
import { sentimentOf } from "@/lib/plain";
import type { Draft, Any } from "./common";

const gnewsUrl = (q: string, region = "IN") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=en-${region}&gl=${region}&ceid=${region}:en`;

async function feed(url: string, max: number, maxAgeDays = 4) {
  return parseFeed(await getText(url))
    .filter((e) => Date.now() - e.published.getTime() < maxAgeDays * 864e5)
    .slice(0, max);
}

function splitSource(
  title: string,
  src?: string,
): { title: string; source: string } {
  const m = title.match(/^(.*) - ([^-]{2,40})$/);
  if (m) return { title: m[1].trim(), source: m[2].trim() };
  return { title, source: src || "News" };
}

// ---------- INDUSTRY ----------
export function industryDomain(t: string): string {
  if (/\b(layoffs?|job cuts?|lays off|firing|fired|redundanc)/i.test(t))
    return "layoffs";
  if (
    /\b(funding|raises?|raised|series [a-e]|seed round|valuation|acquires?|acquisition|startup)\b/i.test(
      t,
    )
  )
    return "startups";
  if (
    /\b(stock|shares?|nasdaq|nyse|sensex|nifty|market cap|earnings|investors?|rally|sell-?off|wall street|revenue|profit|loss|ipo|dow)\b/i.test(
      t,
    )
  )
    return "markets";
  return "bigtech";
}

const INDUSTRY_FEEDS: [string, string][] = [
  ["TechCrunch", "https://techcrunch.com/feed/"],
  ["The Verge", "https://www.theverge.com/rss/index.xml"],
  ["Ars Technica", "https://feeds.arstechnica.com/arstechnica/technology-lab"],
  ["VentureBeat AI", "https://venturebeat.com/category/ai/feed/"],
  ["CNBC Tech", "https://www.cnbc.com/id/19854910/device/rss/rss.html"],
  [
    "Economic Times Tech",
    "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms",
  ],
];
const INDUSTRY_QUERIES = [
  "Nvidia OR Microsoft OR Alphabet OR Meta OR Amazon OR Apple stock shares AI",
  "tech layoffs",
  "AI startup funding round billion",
  "semiconductor stocks chip makers earnings",
  "Infosys OR TCS OR Wipro OR HCLTech shares IT sector AI",
];

export async function industry(): Promise<Draft[]> {
  const jobs: Promise<Draft[]>[] = [
    ...INDUSTRY_FEEDS.map(async ([name, url]) =>
      (await feed(url, 8)).map<Draft>((e) => ({
        kind: "industry",
        domain: industryDomain(`${e.title} ${e.summary}`),
        source: name,
        title: e.title,
        url: e.link,
        summary: clip(e.summary, 700),
        authors: e.author ? [e.author] : [],
        publishedAt: e.published,
        score: 30,
        tags: [sentimentOf(`${e.title} ${e.summary}`)],
        meta: { thumbnail: e.thumbnail },
      })),
    ),
    ...INDUSTRY_QUERIES.map(async (q, qi) =>
      (await feed(gnewsUrl(q), 8)).map<Draft>((e) => {
        const s = splitSource(e.title, e.extra?.source);
        return {
          kind: "industry",
          domain: industryDomain(s.title),
          source: s.source,
          title: s.title,
          url: e.link,
          summary: "",
          publishedAt: e.published,
          score: 38 - qi,
          tags: [sentimentOf(s.title)],
          meta: { via: "Google News" },
        };
      }),
    ),
  ];
  const res = await Promise.allSettled(jobs);
  return res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// ---------- GEOPOLITICS (no local party politics / religion) ----------
const BLOCK =
  /\b(bjp|congress party|aap\b|tmc|dmk|shiv sena|rjd|sp chief|assembly (polls?|election)|lok sabha|rajya sabha|bypoll|rally|mla|chief minister|panchayat|temple|mandir|masjid|mosque|dharma|hindutva|communal|caste|reservation|yogi|kejriwal|rahul gandhi|vote bank|saffron|jihad|religio\w+|riot|lynch\w*|cricket|ipl|bollywood|celebrity|box office|actor|actress|murder|rape|horoscope|astrolog\w*|sensex today|gold rate)\b/i;

export function geoTags(t: string): string[] {
  const tags: string[] = [];
  if (
    /\b(student|students|education|universit\w+|visa|scholarship|admission|campus|school|exam|ugc|aicte|nep|college|study abroad|tuition|iit|iisc|research funding|h-1b|opt\b|immigration)\b/i.test(
      t,
    )
  )
    tags.push("students");
  if (
    /\b(war|attack|strike|strikes|missile|ceasefire|troops|conflict|invasion|military|drone|hostage|airstrike|bombing|frontline|offensive|sanctions)\b/i.test(
      t,
    )
  )
    tags.push("conflict");
  if (
    /\b(chips?|semiconductors?|ai\b|artificial intelligence|export controls?|cyber\w*|satellite|space|quantum|5g|data centre|data center|tech|technology|rare earth|battery|isro|nasa)\b/i.test(
      t,
    )
  )
    tags.push("tech");
  if (
    /\b(india|indian|new delhi|delhi|modi|mea\b|jaishankar|isro|iit)\b/i.test(t)
  )
    tags.push("india");
  if (!tags.length) tags.push("world");
  return tags;
}
const GEO_PRIORITY = ["students", "conflict", "tech", "india", "world"];

const GEO_FEEDS: [string, string, number][] = [
  ["BBC World", "https://feeds.bbci.co.uk/news/world/rss.xml", 10],
  ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml", 10],
  ["DW World", "https://rss.dw.com/rdf/rss-en-world", 8],
  [
    "The Hindu · International",
    "https://www.thehindu.com/news/international/feeds/rss",
    10,
  ],
  ["The Hindu · Education", "https://www.thehindu.com/education/feeds/rss", 8],
  [
    "Indian Express · Explained",
    "https://indianexpress.com/section/explained/feed/",
    8,
  ],
  ["The Diplomat", "https://thediplomat.com/feed/", 8],
];
const GEO_QUERIES = [
  "India foreign policy MEA diplomacy",
  "India China relations border talks",
  "India US trade technology partnership",
  "international students visa policy",
  "India higher education policy UGC students",
  "AI chips export controls geopolitics",
  "war ceasefire talks",
  "India semiconductor mission research funding",
];

export async function geo(): Promise<Draft[]> {
  const jobs: Promise<Draft[]>[] = [
    ...GEO_FEEDS.map(async ([name, url, max]) =>
      (await feed(url, max, 3))
        .map<Draft>((e) => ({ e, name }) as unknown as Draft)
        .map((x) => {
          const e = (
            x as unknown as {
              e: ReturnType<typeof parseFeed>[number];
              name: string;
            }
          ).e;
          const tags = geoTags(`${e.title} ${e.summary}`);
          return {
            kind: "geo",
            domain: GEO_PRIORITY.find((g) => tags.includes(g)) ?? "world",
            source: name,
            title: e.title,
            url: e.link,
            summary: clip(e.summary, 700),
            publishedAt: e.published,
            score: 32,
            tags,
            meta: { thumbnail: e.thumbnail },
          } satisfies Draft;
        }),
    ),
    ...GEO_QUERIES.map(async (q, qi) =>
      (await feed(gnewsUrl(q), 7, 3)).map<Draft>((e) => {
        const s = splitSource(e.title, e.extra?.source);
        const tags = geoTags(s.title + " " + q);
        return {
          kind: "geo",
          domain: GEO_PRIORITY.find((g) => tags.includes(g)) ?? "world",
          source: s.source,
          title: s.title,
          url: e.link,
          summary: "",
          publishedAt: e.published,
          score: 36 - qi,
          tags,
          meta: { via: "Google News" },
        };
      }),
    ),
  ];
  const res = await Promise.allSettled(jobs);
  return res
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((d) => !BLOCK.test(`${d.title} ${d.summary}`));
}

// ---------- HACKER NEWS ----------
export async function hackerNews(): Promise<Draft[]> {
  const toDraft =
    (domain: string) =>
    (h: Any): Draft => ({
      kind: "hn",
      domain,
      source: "Hacker News",
      title: String(h.title).replace(/^Show HN:\s*/i, "Show: "),
      url: `https://news.ycombinator.com/item?id=${h.objectID}`,
      summary: stripHtml(h.story_text ?? ""),
      authors: [h.author],
      publishedAt: new Date(h.created_at),
      score: Number(h.points) + Number(h.num_comments) / 2,
      tags: [domain === "show" ? "show-hn" : "front-page"],
      meta: {
        link: h.url || undefined,
        points: h.points,
        comments: h.num_comments,
      },
    });
  const [front, show] = await Promise.all([
    getJson<Any>(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=45",
    ),
    getJson<Any>(
      `https://hn.algolia.com/api/v1/search?tags=show_hn&numericFilters=points>30,created_at_i>${Math.floor(Date.now() / 1000 - 3 * 864e5)}&hitsPerPage=20`,
    ),
  ]);
  return [
    ...arr<Any>(front.hits).map(toDraft("front")),
    ...arr<Any>(show.hits).map(toDraft("show")),
  ].filter((d) => d.title);
}
