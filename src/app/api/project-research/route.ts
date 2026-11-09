import { getJson } from "@/lib/http";
import { listItems } from "@/lib/data";
import { toCard } from "@/lib/cards";
export const dynamic = "force-dynamic";
type Repo = {
  full_name: string;
  description: string | null;
  topics: string[];
  language: string;
  html_url: string;
  stargazers_count: number;
};
export async function GET(req: Request) {
  const repo = new URL(req.url).searchParams
    .get("repo")
    ?.replace(/^https:\/\/github.com\//, "")
    .replace(/\/$/, "");
  if (!repo || !/^[-\w.]+\/[-\w.]+$/.test(repo))
    return Response.json(
      { error: "Enter a public repository as owner/name." },
      { status: 400 },
    );
  try {
    const r = await getJson<Repo>(`https://api.github.com/repos/${repo}`, {
      headers: { accept: "application/vnd.github+json" },
    });
    const keywords = [
      ...(r.topics || []),
      ...((r.description || "")
        .toLowerCase()
        .match(
          /\b(?:quantum|biology|neural|optimization|tensor|matrix|diffusion|transformer|geometry|simulation|graph|algebra|calculus|physics|protein)\b/g,
        ) || []),
    ]
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6);
    const [sets, similar] = await Promise.all([
      Promise.all(
        keywords
          .slice(0, 4)
          .map((q) => listItems({ kind: "paper", q, limit: 5 })),
      ),
      keywords.length
        ? getJson<{ items: Repo[] }>(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(keywords.slice(0, 2).join(" "))}&sort=stars&per_page=6`,
          ).catch(() => ({ items: [] }))
        : Promise.resolve({ items: [] }),
    ]);
    return Response.json({
      repo: r,
      keywords,
      papers: [
        ...new Map(sets.flat().map((p) => [p.id, toCard(p)])).values(),
      ].slice(0, 12),
      similar: similar.items
        .filter((s) => s.full_name.toLowerCase() !== repo.toLowerCase())
        .slice(0, 5),
      searches: keywords.map((q) => ({
        term: q,
        url: `https://arxiv.org/search/?query=${encodeURIComponent(q)}&searchtype=all`,
      })),
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Repository unavailable. It may be private or rate limited.",
      },
      { status: 502 },
    );
  }
}
