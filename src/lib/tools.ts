import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items, projects, sources, emailAccounts } from "@/db/schema";
import { ready } from "@/db/ensure";
import { listItems, getItem } from "@/lib/data";
import { explain } from "@/lib/plain";
import { upsert, type Draft } from "@/lib/ingest/common";
import { kickoff, ingestStatus } from "@/lib/ingest";
import { searchAll, verify } from "@/lib/research";
import { snapshot } from "@/lib/github";
import { fetchInbox } from "@/lib/mail";
import { clip } from "@/lib/text";

type Args = Record<string, unknown>;
const S = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const N = (v: unknown, d: number) =>
  typeof v === "number" ? v : Number(v) || d;

export const TOOLS = [
  {
    name: "get_digest",
    description:
      "Latest ranked items from the user's Curiosity Atlas. section: paper | ai_news | applied | industry | geo | video | hn. For papers domain can be neuro | quantum | ai | inter.",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string" },
        domain: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "search_items",
    description: "Full-text search across everything collected so far.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number" } },
      required: ["query"],
    },
  },
  {
    name: "get_item",
    description:
      "Get one item by id with its plain-English breakdown, authors and links.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "verify_claim",
    description:
      "Search 7 sources in parallel (library, arXiv, OpenAlex, Wikipedia, news, Hacker News, Reddit) and return a corroboration verdict for a claim.",
    inputSchema: {
      type: "object",
      properties: { claim: { type: "string" } },
      required: ["claim"],
    },
  },
  {
    name: "list_projects",
    description:
      "The user's tracked GitHub projects with live progress (commits, issues, momentum, goals).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "inbox_summary",
    description:
      "Unread counts and latest subjects from the user's connected email accounts (read-only).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "publish_item",
    description:
      "Push something YOU found (a paper, news story, project) onto the user's site. section: paper | ai_news | applied | industry | geo | video | hn.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        url: { type: "string" },
        summary: { type: "string" },
        section: { type: "string" },
        domain: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        source: { type: "string" },
      },
      required: ["title", "url", "summary", "section"],
    },
  },
  {
    name: "save_explanation",
    description:
      "Attach your own plain-English explanation (markdown) to an item so it shows on the item page.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" }, text: { type: "string" } },
      required: ["id", "text"],
    },
  },
  {
    name: "add_source",
    description:
      "Connect a new source. type: rss | reddit | youtube | mastodon | bluesky | hn | github_topic | gnews.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string" },
        target: { type: "string" },
        name: { type: "string" },
        section: { type: "string" },
        domain: { type: "string" },
      },
      required: ["type", "target", "name", "section"],
    },
  },
  {
    name: "refresh_sources",
    description: "Start a fresh pull of every source now.",
    inputSchema: { type: "object", properties: {} },
  },
];

const line = (i: {
  id: number;
  kind: string;
  domain: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: Date;
  tags: string[];
}) => {
  const p = explain(i);
  return `#${i.id} [${i.kind}/${i.domain}] ${i.title}\n  source: ${i.source} · ${i.publishedAt.toISOString().slice(0, 10)}\n  url: ${i.url}\n  plain: ${clip(p.tldr, 220)}`;
};

export async function callTool(name: string, a: Args): Promise<string> {
  await ready();
  switch (name) {
    case "get_digest": {
      const rows = await listItems({
        kind: S(a.section) || undefined,
        domain: S(a.domain) || undefined,
        limit: Math.min(N(a.limit, 10), 30),
      });
      return (
        rows.map(line).join("\n\n") ||
        "Nothing collected yet — call refresh_sources."
      );
    }
    case "search_items": {
      const rows = await listItems({
        q: S(a.query),
        limit: Math.min(N(a.limit, 10), 30),
        essentials: "any",
      });
      return rows.map(line).join("\n\n") || "No matches.";
    }
    case "get_item": {
      const it = await getItem(N(a.id, 0));
      if (!it) return "Not found.";
      const p = explain(it);
      return JSON.stringify(
        {
          id: it.id,
          title: it.title,
          url: it.url,
          source: it.source,
          authors: it.authors,
          published: it.publishedAt,
          links: {
            github: it.meta.github,
            project: it.meta.project,
            pdf: it.meta.pdf,
          },
          summary: it.summary,
          plain: p.sections.map((s) => `${s.title}: ${s.text}`),
          glossary: p.glossary,
          aiExplanation: it.ai?.text,
        },
        null,
        1,
      );
    }
    case "verify_claim": {
      const claim = S(a.claim);
      const hits = await searchAll(claim, claim);
      const v = verify(hits);
      return JSON.stringify(
        {
          verdict: v,
          sources: hits.map((h) => ({
            n: h.n,
            source: h.source,
            type: h.type,
            title: h.title,
            url: h.url,
            match: Math.round(h.sim * 100),
          })),
        },
        null,
        1,
      );
    }
    case "list_projects": {
      const ps = await db.select().from(projects).orderBy(projects.position);
      const snaps = await Promise.all(
        ps.map((p) => (p.repo ? snapshot(p.repo) : null)),
      );
      return JSON.stringify(
        ps.map((p, i) => ({
          title: p.title,
          repo: p.repo,
          status: p.status,
          nextAction: p.nextAction,
          goals: p.goals,
          github: snaps[i] && {
            momentum: snaps[i]!.momentum,
            commits7: snaps[i]!.commits7,
            openIssues: snaps[i]!.openIssues,
            openPRs: snaps[i]!.openPRs,
            lastPush: snaps[i]!.pushedAt,
          },
        })),
        null,
        1,
      );
    }
    case "inbox_summary": {
      const accs = await db.select().from(emailAccounts);
      const res = await Promise.all(
        accs.map(async (acc) => {
          try {
            const ib = await fetchInbox(acc, 8);
            return {
              account: acc.label,
              unseen: ib.unseen,
              latest: ib.messages
                .slice(0, 8)
                .map((m) => `${m.seen ? "" : "● "}${m.subject} — ${m.from}`),
            };
          } catch (e) {
            return { account: acc.label, error: String(e).slice(0, 100) };
          }
        }),
      );
      return JSON.stringify(res, null, 1);
    }
    case "publish_item": {
      const kind = S(a.section, "ai_news") as Draft["kind"];
      const n = await upsert([
        {
          kind,
          domain: S(a.domain, "general"),
          source: S(a.source, "Your agent"),
          title: S(a.title),
          url: S(a.url),
          summary: S(a.summary),
          tags: ["agent", ...((a.tags as string[]) ?? [])],
          score: 90,
          publishedAt: new Date(),
          meta: { byAgent: true },
        },
      ]);
      return n
        ? "Published — it now appears on the site."
        : "Nothing published.";
    }
    case "save_explanation": {
      await db
        .update(items)
        .set({
          ai: {
            text: S(a.text),
            at: new Date().toISOString(),
            model: "connected agent",
          },
        })
        .where(eq(items.id, N(a.id, 0)));
      return "Saved.";
    }
    case "add_source": {
      await db
        .insert(sources)
        .values({
          type: S(a.type),
          target: S(a.target),
          name: S(a.name),
          section: S(a.section, "ai_news"),
          domain: S(a.domain, "general"),
        })
        .onConflictDoNothing();
      kickoff();
      return "Source connected; refresh started.";
    }
    case "refresh_sources": {
      kickoff();
      const s = await ingestStatus();
      return `Refresh ${s.running ? "running" : "started"}.`;
    }
    default:
      return `Unknown tool ${name}`;
  }
}

// ---- minimal MCP (JSON-RPC 2.0) server handler: works over HTTP and via the stdio bridge
 
export async function handleRpc(msg: any): Promise<any | null> {
  const { id, method, params } = msg ?? {};
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  if (method === "initialize")
    return ok({
      protocolVersion: params?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "curiosity-atlas", version: "1.0.0" },
      instructions:
        "Curiosity Atlas: the user's local research, AI, geopolitics and GitHub dashboard. Use verify_claim before asserting news, and publish_item to add your findings.",
    });
  if (method === "ping") return ok({});
  if (method === "tools/list") return ok({ tools: TOOLS });
  if (method === "tools/call") {
    try {
      const text = await callTool(params?.name, params?.arguments ?? {});
      return ok({ content: [{ type: "text", text }] });
    } catch (e) {
      return ok({
        isError: true,
        content: [
          { type: "text", text: e instanceof Error ? e.message : "error" },
        ],
      });
    }
  }
  if (typeof method === "string" && method.startsWith("notifications/"))
    return null;
  if (id === undefined) return null;
  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}
