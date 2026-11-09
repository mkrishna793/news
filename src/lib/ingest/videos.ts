import { getText, getJson } from "@/lib/http";
import { parseFeed } from "@/lib/xml";
import { clip } from "@/lib/text";
import { setSetting } from "@/lib/settings";
import type { Draft, Any } from "./common";

// category: explainers = complex ideas made simple · builds = people making things
// lectures = long-form teaching & paper walkthroughs · news = what's new
export const CHANNELS: {
  name: string;
  id: string;
  cat: "explainers" | "builds" | "lectures" | "news";
}[] = [
  { name: "3Blue1Brown", id: "UCYO_jab_esuFRV4b17AJtAw", cat: "explainers" },
  { name: "Veritasium", id: "UCHnyfMqiRRG1u-2MsSQLbXA", cat: "explainers" },
  { name: "Kurzgesagt", id: "UCsXVk37bltHxD1rDPwtNM8Q", cat: "explainers" },
  {
    name: "Quanta Magazine",
    id: "UCTpmmkp1eZnHhL0aGcDdsgg",
    cat: "explainers",
  },
  { name: "PBS Space Time", id: "UC7_gcs09iThXybpVgjHZ_7g", cat: "explainers" },
  { name: "Welch Labs", id: "UConVfxXodg78Tzh5nNu85Ew", cat: "explainers" },
  { name: "IBM Technology", id: "UCKWaEZ-_VweaEx1j62do_vQ", cat: "explainers" },
  { name: "Computerphile", id: "UC9-y-6csu5WGm29I7JiwpnA", cat: "explainers" },
  { name: "minutephysics", id: "UCUHW94eEFW7hkUMVaZz4eDg", cat: "explainers" },
  {
    name: "Domain of Science",
    id: "UCxqAWLTk1CmBvZFPzeZMd9A",
    cat: "explainers",
  },
  { name: "StatQuest", id: "UCtYLUTtgS3k1Fg4y5tAhLbw", cat: "lectures" },
  { name: "Andrej Karpathy", id: "UCXUPKJO5MZQN11PqgIvyuvQ", cat: "lectures" },
  { name: "Yannic Kilcher", id: "UCZHmQk67mSJgfCCTn7xBfew", cat: "lectures" },
  {
    name: "MIT OpenCourseWare",
    id: "UCEBb1b_L6zDS3xTUrIALZOw",
    cat: "lectures",
  },
  { name: "Stanford Online", id: "UCBa5G_ESCn8Yd4vw5U-gIcg", cat: "lectures" },
  { name: "Lex Fridman", id: "UCSHZKyawb77ixDdsGog4iWA", cat: "lectures" },
  { name: "Dwarkesh Patel", id: "UCXl4i9dYBrFOabk0xGmbkRA", cat: "lectures" },
  { name: "Two Minute Papers", id: "UCbfYPyITQ-7l4upoX8nvctg", cat: "news" },
  { name: "AI Explained", id: "UCNJ1Ymd5yFuUPtn21xtRbbw", cat: "news" },
  { name: "Fireship", id: "UCsBjURrPoezykLs9EqgamOA", cat: "news" },
  { name: "Sabine Hossenfelder", id: "UC1yNl2E66ZzKApQdRuTQ4tw", cat: "news" },
  { name: "Ben Eater", id: "UCS0N5baNlQWJCUrhCEo8WlA", cat: "builds" },
  {
    name: "Practical Engineering",
    id: "UCMOqf8ab-42UUQIdVoKwjlQ",
    cat: "builds",
  },
  { name: "Sentdex", id: "UCfzlCWGWYyIQ0aLC5w48gBQ", cat: "builds" },
  { name: "Hugging Face", id: "UCHlNU7kIZhRgSbhHvFoy72w", cat: "builds" },
  { name: "Mark Rober", id: "UCY1kMZp36IQSyNx_9h4mpCg", cat: "builds" },
];

export async function channelVideos(
  name: string,
  id: string,
  cat: string,
  max = 5,
  maxAgeDays = 75,
): Promise<Draft[]> {
  const entries = parseFeed(
    await getText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`),
  );
  return entries
    .filter(
      (e) =>
        e.videoId && Date.now() - e.published.getTime() < maxAgeDays * 864e5,
    )
    .slice(0, max)
    .map<Draft>((e) => ({
      kind: "video",
      domain: cat,
      source: name,
      title: e.title,
      url: `https://www.youtube.com/watch?v=${e.videoId}`,
      summary: clip(e.summary, 500),
      authors: [e.author || name],
      publishedAt: e.published,
      score: Math.min(120, (e.views ?? 0) / 4000),
      tags: [cat, "youtube"],
      meta: {
        videoId: e.videoId,
        thumbnail:
          e.thumbnail ?? `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg`,
        channel: name,
        views: e.views,
      },
    }));
}

export async function videos(): Promise<Draft[]> {
  const res = await Promise.allSettled(
    CHANNELS.map((c) => channelVideos(c.name, c.id, c.cat)),
  );
  return res.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function resolveChannelId(
  input: string,
): Promise<{ id: string; name: string } | null> {
  const direct = input.match(/UC[\w-]{22}/)?.[0];
  let url = input.trim();
  if (!direct) {
    if (/^@/.test(url)) url = `https://www.youtube.com/${url}`;
    else if (!/^https?:/.test(url)) url = `https://www.youtube.com/@${url}`;
  } else url = `https://www.youtube.com/channel/${direct}`;
  const html = await getText(url, { headers: { cookie: "CONSENT=YES+1" } });
  const id =
    direct ??
    html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ??
    html.match(/channel_id=(UC[\w-]{22})/)?.[1];
  if (!id) return null;
  const name =
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? input;
  return { id, name };
}

// ---------- MARKET ----------
const TICKERS: [string, string][] = [
  ["NVDA", "NVIDIA"],
  ["MSFT", "Microsoft"],
  ["GOOGL", "Alphabet"],
  ["META", "Meta"],
  ["AMZN", "Amazon"],
  ["AAPL", "Apple"],
  ["TSLA", "Tesla"],
  ["AMD", "AMD"],
  ["TSM", "TSMC"],
  ["INTC", "Intel"],
  ["^IXIC", "Nasdaq"],
  ["^GSPC", "S&P 500"],
  ["^NSEI", "Nifty 50"],
  ["^BSESN", "Sensex"],
  ["INFY", "Infosys"],
];
export type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  pct: number;
  spark: number[];
  currency?: string;
};

export async function market(): Promise<number> {
  const res = await Promise.allSettled(
    TICKERS.map(async ([symbol, name]) => {
      const d = await getJson<Any>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`,
      );
      const r = d.chart?.result?.[0];
      const closes: number[] = (r?.indicators?.quote?.[0]?.close ?? []).filter(
        (x: unknown) => typeof x === "number",
      );
      if (closes.length < 2) throw new Error("no data");
      const price = r.meta?.regularMarketPrice ?? closes[closes.length - 1];
      const prev = closes[closes.length - 2] ?? r.meta?.chartPreviousClose;
      return {
        symbol,
        name,
        price,
        change: price - prev,
        pct: ((price - prev) / prev) * 100,
        spark: closes.slice(-22),
        currency: r.meta?.currency,
      } as Quote;
    }),
  );
  const quotes = res.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : [],
  );
  if (quotes.length)
    await setSetting("market", { at: new Date().toISOString(), quotes });
  return quotes.length;
}
