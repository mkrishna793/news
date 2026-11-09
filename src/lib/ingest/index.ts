import { sql, and, lt, eq, isNull, sql as rawSql } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ready } from "@/db/ensure";
import { getSetting, setSetting } from "@/lib/settings";
import { sleep } from "@/lib/http";
import { lane, type SourceResult } from "./common";
import { arxivLanes, hfDaily, pubmedNeuro, essentials } from "./papers";
import {
  hfModels,
  reddit,
  hnSearch,
  blogs,
  ghIssues,
  ghBuilders,
  hfSpaces,
  devto,
} from "./ai";
import { enabledSources, pullSource } from "./custom";

export type IngestState = {
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  total: number;
  done: number;
  results: SourceResult[];
  error?: string;
};

const g = globalThis as typeof globalThis & { __atlasIngest?: IngestState };
const state = (): IngestState =>
  (g.__atlasIngest ??= { running: false, total: 0, done: 0, results: [] });

export async function ingestStatus(): Promise<
  IngestState & { lastRun?: string }
> {
  const s = state();
  const saved = await getSetting<{
    finishedAt?: string;
    results?: SourceResult[];
  }>("ingest", {});
  if (!s.running && !s.finishedAt && saved.finishedAt)
    return {
      ...s,
      finishedAt: saved.finishedAt,
      results: saved.results ?? [],
      lastRun: saved.finishedAt,
    };
  return { ...s, lastRun: s.finishedAt ?? saved.finishedAt };
}

export async function isStale(hours = 3): Promise<boolean> {
  await ready();
  const saved = await getSetting<{ finishedAt?: string }>("ingest", {});
  if (!saved.finishedAt) return true;
  return Date.now() - new Date(saved.finishedAt).getTime() > hours * 36e5;
}

export async function runIngestion(): Promise<IngestState> {
  const s = state();
  if (s.running) return s;
  // Acquire before the first await; simultaneous refresh requests share this run.
  Object.assign(s, {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
    done: 0,
    total: 0,
    results: [],
    error: undefined,
  });

  try {
    await ready();
    const haveEssentials =
      (
        await db
          .select({ n: sql<number>`count(*)::int` })
          .from(items)
          .where(sql`${items.tags} ? 'essential'`)
      )[0]?.n ?? 0;
    const custom = await enabledSources();

    type Job = () => Promise<SourceResult>;
    const parallel: Job[] = [
      () => lane("Hugging Face daily papers", hfDaily),
      () => lane("PubMed · neuroscience journals", pubmedNeuro),
      () => lane("Hugging Face trending models", hfModels),
      ...[
        "LLM",
        "open source AI model",
        "Claude",
        "Gemini",
        "OpenAI",
        "Qwen DeepSeek",
      ].map(
        (q) => () =>
          lane(`Hacker News · ${q}`, () => hnSearch(q, "ai_news", "community")),
      ),
      () =>
        lane("Show HN · AI projects", () =>
          hnSearch("AI", "applied", "builders", "show_hn", 8, 168),
        ),
      () => lane("Lab blogs, newsletters & releases", blogs),
      () => lane("GitHub issues · open-source AI", ghIssues),
      () => lane("GitHub · new AI projects", ghBuilders),
      () => lane("Hugging Face Spaces", hfSpaces),
      () => lane("DEV Community", devto),
      ...custom.map(
        (c) => () => lane(`Custom · ${c.name}`, () => pullSource(c)),
      ),
    ];

    // arXiv asks for ≤1 request / 3s, so those lanes run one after another.
    const arxiv = await arxivLanes();
    const serial: Job[] = [
      ...(
        [
          ["LocalLLaMA", "r/LocalLLaMA"],
          ["MachineLearning", "r/MachineLearning"],
          ["StableDiffusion", "r/StableDiffusion"],
        ] as const
      ).map(([sub, label]) => async () => {
        const r = await lane(`Reddit · ${label}`, () =>
          reddit(sub, "ai_news", "community", label),
        );
        await sleep(2500); // Reddit rate-limits bursts
        return r;
      }),
      ...arxiv.map((a) => async () => {
        const r = await lane(a.name, a.run);
        await sleep(3200);
        return r;
      }),
      ...(haveEssentials < 12
        ? [() => lane("Essential papers shelf", essentials)]
        : []),
    ];

    s.total = parallel.length + serial.length;
    const track = (j: Job) => async () => {
      const r = await j();
      s.results.push(r);
      s.done++;
    };
    await Promise.all([
      (async () => {
        let cursor = 0;
        await Promise.all(
          Array.from({ length: 4 }, async () => {
            while (cursor < parallel.length) {
              const job = parallel[cursor++];
              await track(job)();
            }
          }),
        );
      })(),
      (async () => {
        for (const j of serial) await track(j)();
      })(),
    ]);

    // housekeeping: drop stale, unsaved, non-essential items
    await db
      .delete(items)
      .where(
        and(
          lt(items.publishedAt, new Date(Date.now() - 45 * 864e5)),
          eq(items.saved, false),
          isNull(items.readAt),
          rawSql`NOT (${items.tags} ? 'essential')`,
        ),
      );
  } catch (error) {
    s.error = error instanceof Error ? error.message : "Collection failed";
    s.results.push({ name: "Research store", count: 0, error: s.error });
  } finally {
    s.running = false;
    s.finishedAt = new Date().toISOString();
    await setSetting("ingest", {
      finishedAt: s.finishedAt,
      results: s.results,
    });
  }
  return s;
}

export function kickoff(): void {
  if (!state().running)
    void runIngestion().catch((e) => console.error("[atlas] ingest failed", e));
}
