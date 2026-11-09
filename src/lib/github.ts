import { getJson } from "@/lib/http";
import { getSetting } from "@/lib/settings";

 
type Any = any;

export type GhConfig = { token?: string; username?: string };
export type Snapshot = {
  repo: string;
  ok: boolean;
  error?: string;
  description?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  openPRs?: number;
  language?: string;
  pushedAt?: string;
  url?: string;
  defaultBranch?: string;
  commits7: number;
  commits30: number;
  weekly: number[];
  recent: {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
  }[];
  streak: number;
  momentum: "blazing" | "steady" | "cooling" | "dormant";
  daysSincePush: number;
  release?: { tag: string; date: string; url: string };
};

const cache = new Map<string, { at: number; snap: Snapshot }>();

async function headers() {
  const c = await getSetting<GhConfig>("github", {});
  return {
    accept: "application/vnd.github+json",
    ...(c.token ? { authorization: `Bearer ${c.token}` } : {}),
  } as Record<string, string>;
}

export async function snapshot(repo: string, force = false): Promise<Snapshot> {
  const hit = cache.get(repo);
  if (hit && !force && Date.now() - hit.at < 5 * 60_000) return hit.snap;
  const h = await headers();
  const base = `https://api.github.com/repos/${repo}`;
  const empty: Snapshot = {
    repo,
    ok: false,
    commits7: 0,
    commits30: 0,
    weekly: [],
    recent: [],
    streak: 0,
    momentum: "dormant",
    daysSincePush: 999,
  };
  try {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [r, commits, pulls, part, rel] = await Promise.all([
      getJson<Any>(base, { headers: h }),
      getJson<Any[]>(`${base}/commits?per_page=100&since=${since}`, {
        headers: h,
      }).catch(() => []),
      getJson<Any[]>(`${base}/pulls?state=open&per_page=50`, {
        headers: h,
      }).catch(() => []),
      getJson<Any>(`${base}/stats/participation`, { headers: h }).catch(
        () => null,
      ),
      getJson<Any>(`${base}/releases/latest`, { headers: h }).catch(() => null),
    ]);
    const dates = commits.map((c) =>
      new Date(c.commit?.author?.date ?? c.commit?.committer?.date).getTime(),
    );
    const c7 = dates.filter((d) => Date.now() - d < 7 * 864e5).length;
    const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
    const days = new Set(dates.map(dayKey));
    let streak = 0;
    let t = Date.now();
    if (!days.has(dayKey(t))) t -= 864e5;
    while (days.has(dayKey(t))) {
      streak++;
      t -= 864e5;
    }
    const daysSincePush = Math.round(
      (Date.now() - new Date(r.pushed_at).getTime()) / 864e5,
    );
    const momentum =
      c7 >= 8
        ? "blazing"
        : c7 >= 2 || daysSincePush <= 4
          ? "steady"
          : daysSincePush <= 21
            ? "cooling"
            : "dormant";
    const snap: Snapshot = {
      repo,
      ok: true,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: Math.max(0, r.open_issues_count - pulls.length),
      openPRs: pulls.length,
      language: r.language,
      pushedAt: r.pushed_at,
      url: r.html_url,
      defaultBranch: r.default_branch,
      commits7: c7,
      commits30: commits.length,
      weekly: (part?.all as number[] | undefined)?.slice(-12) ?? [],
      recent: commits.slice(0, 5).map((c) => ({
        sha: String(c.sha).slice(0, 7),
        message: String(c.commit?.message ?? "")
          .split("\n")[0]
          .slice(0, 90),
        author: c.commit?.author?.name ?? c.author?.login ?? "",
        date: c.commit?.author?.date,
        url: c.html_url,
      })),
      streak,
      momentum,
      daysSincePush,
      release: rel?.tag_name
        ? { tag: rel.tag_name, date: rel.published_at, url: rel.html_url }
        : undefined,
    };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(repo, { at: Date.now(), snap });
    return snap;
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : "failed" };
  }
}

export type Attention = {
  kind: "issue" | "pr" | "review" | "notification";
  title: string;
  repo: string;
  url: string;
  date: string;
};

export async function attention(): Promise<{
  items: Attention[];
  user?: string;
  authed: boolean;
  error?: string;
}> {
  const c = await getSetting<GhConfig>("github", {});
  if (!c.token) return { items: [], authed: false };
  const h = await headers();
  try {
    const me =
      c.username ||
      (await getJson<Any>("https://api.github.com/user", { headers: h })).login;
    const [assigned, reviews, mine] = await Promise.all([
      getJson<Any>(
        `https://api.github.com/search/issues?q=${encodeURIComponent(`assignee:${me} is:open archived:false`)}&per_page=8&sort=updated`,
        { headers: h },
      ),
      getJson<Any>(
        `https://api.github.com/search/issues?q=${encodeURIComponent(`review-requested:${me} is:pr is:open archived:false`)}&per_page=8&sort=updated`,
        { headers: h },
      ),
      getJson<Any>(
        `https://api.github.com/search/issues?q=${encodeURIComponent(`author:${me} is:pr is:open archived:false`)}&per_page=6&sort=updated`,
        { headers: h },
      ),
    ]);
    const map = (arr: Any[], kind: Attention["kind"]): Attention[] =>
      (arr ?? []).map((i) => ({
        kind,
        title: i.title,
        repo: String(i.repository_url).split("/repos/")[1],
        url: i.html_url,
        date: i.updated_at,
      }));
    return {
      user: me,
      authed: true,
      items: [
        ...map(reviews.items, "review"),
        ...map(assigned.items, "issue"),
        ...map(mine.items, "pr"),
      ],
    };
  } catch (e) {
    return {
      items: [],
      authed: true,
      error: e instanceof Error ? e.message : "failed",
    };
  }
}

export async function myRepos(): Promise<
  {
    full_name: string;
    description: string | null;
    pushed_at: string;
    language: string | null;
  }[]
> {
  const h = await headers();
  const c = await getSetting<GhConfig>("github", {});
  const url = c.token
    ? "https://api.github.com/user/repos?sort=pushed&per_page=40&affiliation=owner,collaborator"
    : c.username
      ? `https://api.github.com/users/${c.username}/repos?sort=pushed&per_page=40`
      : "";
  if (!url) return [];
  return getJson<Any[]>(url, { headers: h });
}
