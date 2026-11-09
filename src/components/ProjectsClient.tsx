"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Flame,
  GitBranch,
  GitPullRequest,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Star,
  Target,
  Trash2,
  X,
  CircleDot,
  Eye,
} from "lucide-react";
import Tilt from "@/components/Tilt";
import { Sparkline } from "@/components/ui";
import { COLORS, accentHex } from "@/lib/meta";
import { api, confetti, toast } from "@/lib/client";
import { sfx } from "@/lib/sound";
import { timeAgo } from "@/lib/text";
import type { Snapshot, Attention } from "@/lib/github";

type Goal = { text: string; done: boolean };
type P = {
  id: number;
  title: string;
  repo: string;
  tagline: string;
  emoji: string;
  accent: string;
  status: string;
  nextAction: string;
  goals: Goal[];
  notes: string;
  position: number;
  createdAt: string;
};
type GhData = {
  configured: { token: boolean; username: string };
  snaps: Record<string, Snapshot>;
  attention: {
    items: Attention[];
    user?: string;
    authed: boolean;
    error?: string;
  };
};

const QUOTES = [
  "Small commits, every day, beat heroic sprints.",
  "Done is better than perfect — ship the next tiny thing.",
  "You don’t need motivation. You need the next 25 minutes.",
  "Every great project was once a messy first commit.",
  "Curiosity compounds. So do commits.",
  "Today’s experiment is tomorrow’s breakthrough.",
];
const EMOJIS = [
  "🚀",
  "🧠",
  "⚛️",
  "🤖",
  "🔭",
  "🧬",
  "🛰️",
  "🎓",
  "🧪",
  "🌍",
  "💡",
  "🛠️",
  "📈",
  "🎮",
  "🎨",
  "📚",
];
const MOM = {
  blazing: { l: "Blazing", c: "#fb923c", e: "🔥" },
  steady: { l: "Steady", c: "#34d399", e: "🌿" },
  cooling: { l: "Cooling", c: "#60a5fa", e: "❄️" },
  dormant: { l: "Dormant", c: "#8a90ad", e: "💤" },
} as const;
const STATUS = ["active", "planning", "paused", "done"];

function Ring({
  value,
  color,
  size = 54,
  children,
}: {
  value: number;
  color: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.1)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${Math.min(1, value) * c} ${c}`}
          style={{
            transition: "stroke-dasharray 1s",
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="absolute text-[11px] font-extrabold text-white">
        {children}
      </div>
    </div>
  );
}

function Form({
  initial,
  onClose,
  onSaved,
}: {
  initial?: P;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    title: initial?.title ?? "",
    repo: initial?.repo ?? "",
    tagline: initial?.tagline ?? "",
    emoji: initial?.emoji ?? "🚀",
    accent: initial?.accent ?? "violet",
    nextAction: initial?.nextAction ?? "",
    status: initial?.status ?? "active",
    goals: (initial?.goals ?? []).map((g) => g.text).join("\n"),
  });
  const [repos, setRepos] = useState<
    { full_name: string; description: string | null }[]
  >([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void api<{ repos: { full_name: string; description: string | null }[] }>(
      "/api/github?repos=1",
    ).then((r) => setRepos(r.repos ?? []));
  }, []);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    if (!f.title.trim()) return toast("Give your project a name", "err");
    setBusy(true);
    const prev = new Map((initial?.goals ?? []).map((g) => [g.text, g.done]));
    const goals = f.goals
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, done: prev.get(text) ?? false }));
    const body = { ...f, goals };
    const r = initial
      ? await api(`/api/projects/${initial.id}`, "PATCH", body)
      : await api("/api/projects", "POST", body);
    setBusy(false);
    if (r.error) return toast(r.error, "err");
    toast(
      initial ? "Project updated" : "Project created — let’s build 🚀",
      "ok",
    );
    onSaved();
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="glass-strong toast-in relative my-8 w-full max-w-2xl rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white">
            {initial ? "Edit project" : "New project"}
          </h2>
          <button className="btn !p-2" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input
              className="field"
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Neural Garden"
            />
          </div>
          <div>
            <label className="label">GitHub repo (optional)</label>
            <input
              className="field"
              list="repos"
              value={f.repo}
              onChange={(e) => set("repo", e.target.value)}
              placeholder="owner/name or paste URL"
            />
            <datalist id="repos">
              {repos.map((r) => (
                <option key={r.full_name} value={r.full_name}>
                  {r.description ?? ""}
                </option>
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <label className="label">Tagline — why does it excite you?</label>
            <input
              className="field"
              value={f.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="A brain-inspired memory for tiny robots"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Next action (one small step)</label>
            <input
              className="field"
              value={f.nextAction}
              onChange={(e) => set("nextAction", e.target.value)}
              placeholder="Write the data loader and run the first training"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Goals — one per line</label>
            <textarea
              className="field min-h-[96px]"
              value={f.goals}
              onChange={(e) => set("goals", e.target.value)}
              placeholder={"Prototype works\nWrite README\nShare demo"}
            />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("emoji", e)}
                  className={`grid h-9 w-9 place-items-center rounded-xl border text-lg ${f.emoji === e ? "border-violet bg-violet/20" : "border-line bg-white/5"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COLORS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("accent", k)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    background: v,
                    borderColor: f.accent === k ? "#fff" : "transparent",
                    boxShadow: f.accent === k ? `0 0 14px ${v}` : undefined,
                  }}
                  aria-label={k}
                />
              ))}
            </div>
            <label className="label mt-3">Status</label>
            <select
              className="field"
              value={f.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Rocket size={15} />
            )}{" "}
            {initial ? "Save" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  p,
  snap,
  loading,
  onEdit,
  onChange,
}: {
  p: P;
  snap?: Snapshot;
  loading: boolean;
  onEdit: () => void;
  onChange: () => void;
}) {
  const color = accentHex(p.accent);
  const [goals, setGoals] = useState(p.goals);
  const [next, setNext] = useState(p.nextAction);
  const [open, setOpen] = useState(false);
  const done = goals.filter((g) => g.done).length;
  const pct = goals.length ? done / goals.length : 0;
  const mom = snap?.ok ? MOM[snap.momentum] : null;
  const patch = (b: object) => api(`/api/projects/${p.id}`, "PATCH", b);

  return (
    <Tilt color={color} className="overflow-hidden rounded-[1.7rem]" max={3}>
      <div
        className="relative px-5 pb-4 pt-5"
        style={{
          background: `linear-gradient(135deg, ${color}2e, transparent 70%)`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}55, ${color}18)`,
              border: `1px solid ${color}66`,
            }}
          >
            {p.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold text-white">
                {p.title}
              </h3>
              <span className="chip" style={{ ["--c" as string]: color }}>
                {p.status}
              </span>
            </div>
            <p className="clamp-2 text-[12.5px] text-soft">
              {p.tagline ||
                snap?.description ||
                "Add a tagline that makes you want to build this."}
            </p>
          </div>
          <div className="relative z-10 flex gap-1">
            <button className="btn !p-1.5" onClick={onEdit} title="Edit">
              <Pencil size={13} />
            </button>
            <button
              className="btn !p-1.5 hover:!text-red-400"
              title="Delete"
              onClick={async () => {
                if (
                  confirm(
                    `Remove “${p.title}” from Atlas? (Your GitHub repo is untouched.)`,
                  )
                ) {
                  await api(`/api/projects/${p.id}`, "DELETE");
                  onChange();
                }
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5">
        {/* github live */}
        {p.repo ? (
          loading && !snap ? (
            <div className="skeleton h-20" />
          ) : snap?.ok ? (
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-black/20 p-3">
              <Ring value={snap.commits7 / 10} color={mom!.c}>
                {snap.commits7}
              </Ring>
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center gap-2 text-[12px] font-bold"
                  style={{ color: mom!.c }}
                >
                  {mom!.e} {mom!.l} · {snap.commits7} commits this week
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11.5px] text-mute">
                  <span className="flex items-center gap-1">
                    <Star size={11} />
                    {snap.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <CircleDot size={11} />
                    {snap.openIssues} issues
                  </span>
                  <span className="flex items-center gap-1">
                    <GitPullRequest size={11} />
                    {snap.openPRs} PRs
                  </span>
                  {snap.streak > 1 && (
                    <span className="flex items-center gap-1 text-orange-300">
                      <Flame size={11} />
                      {snap.streak}-day streak
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-mute">
                  Last push{" "}
                  {snap.daysSincePush === 0
                    ? "today"
                    : `${snap.daysSincePush}d ago`}
                  {snap.release ? ` · ${snap.release.tag}` : ""}
                </div>
              </div>
              {snap.weekly.length > 1 && (
                <Sparkline data={snap.weekly} color={color} w={70} h={34} />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber/30 bg-amber/10 p-3 text-[12px] text-amber">
              <AlertCircle size={14} />
              {snap?.error?.includes("404")
                ? "Repo not found (private? add a token in Connect)."
                : snap?.error?.includes("403")
                  ? "GitHub rate limit — add a token in Connect."
                  : "Couldn’t reach GitHub."}
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-3 text-[12px] text-mute">
            No repo linked — progress is tracked through goals only.
          </div>
        )}

        {/* next action */}
        <div>
          <div
            className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            <Target size={12} /> Next action
          </div>
          <input
            className="field !bg-white/[0.04] !py-2"
            value={next}
            placeholder="What’s the very next small step?"
            onChange={(e) => setNext(e.target.value)}
            onBlur={() => next !== p.nextAction && patch({ nextAction: next })}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.target as HTMLInputElement).blur()
            }
          />
        </div>

        {/* goals */}
        {goals.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-mute">
              <span>Goals</span>
              <span style={{ color }}>
                {done}/{goals.length}
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct * 100}%`,
                  background: `linear-gradient(90deg, ${color}, #fff8)`,
                  boxShadow: `0 0 12px ${color}`,
                }}
              />
            </div>
            <div className="space-y-1.5">
              {goals.map((g, i) => (
                <label
                  key={i}
                  data-sfx="none"
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] transition-colors ${g.done ? "border-transparent bg-white/[0.02] text-mute line-through" : "border-line bg-white/[0.04] text-soft hover:bg-white/[0.08]"}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-violet"
                    checked={g.done}
                    onChange={async (e) => {
                      const next = goals.map((x, j) =>
                        j === i ? { ...x, done: e.target.checked } : x,
                      );
                      setGoals(next);
                      await patch({ goals: next });
                      if (e.target.checked) {
                        const all = next.every((x) => x.done);
                        sfx.success();
                        const r = e.target.getBoundingClientRect();
                        confetti(r.left, r.top, color);
                        if (all) {
                          toast(`🎉 ${p.title}: every goal complete!`, "ok");
                          for (let k = 0; k < 4; k++)
                            setTimeout(
                              () =>
                                confetti(
                                  innerWidth * Math.random(),
                                  innerHeight * 0.4,
                                  color,
                                ),
                              k * 220,
                            );
                        }
                      } else sfx.click();
                    }}
                  />
                  {g.text}
                </label>
              ))}
            </div>
          </div>
        )}

        {snap?.ok && snap.recent.length > 0 && (
          <div>
            <button
              className="text-[11px] font-semibold text-mute hover:text-white"
              onClick={() => setOpen(!open)}
            >
              {open ? "Hide" : "Show"} recent commits
            </button>
            {open && (
              <div className="mt-2 space-y-1.5">
                {snap.recent.map((c) => (
                  <a
                    key={c.sha}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-1.5 text-[12px] text-soft hover:bg-white/[0.07]"
                  >
                    <code className="text-[10.5px] text-violet">{c.sha}</code>
                    <span className="truncate">{c.message}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-mute">
                      {timeAgo(c.date)}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        {snap?.url && (
          <a
            href={snap.url}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 inline-flex items-center gap-1.5 text-[12px] font-semibold text-mute hover:text-white"
          >
            <GitBranch size={13} />
            {p.repo} <ExternalLink size={11} />
          </a>
        )}
      </div>
    </Tilt>
  );
}

export default function ProjectsClient({ initial }: { initial: P[] }) {
  const [list, setList] = useState(initial);
  const [gh, setGh] = useState<GhData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<P | "new" | null>(null);
  const [quote] = useState(
    () => QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length],
  );

  const loadGh = useCallback(async (force = false) => {
    setLoading(true);
    setGh(await api<GhData>(`/api/github${force ? "?force=1" : ""}`));
    setLoading(false);
  }, []);
  const reload = useCallback(async () => {
    const r = await api<{ projects: P[] }>("/api/projects");
    setList(r.projects ?? []);
    void loadGh();
  }, [loadGh]);
  useEffect(() => {
    const timer = setTimeout(() => void loadGh(), 0);
    return () => clearTimeout(timer);
  }, [loadGh]);

  const totalGoals = list.reduce((a, p) => a + p.goals.length, 0);
  const doneGoals = list.reduce(
    (a, p) => a + p.goals.filter((g) => g.done).length,
    0,
  );
  const streak = Math.max(
    0,
    ...Object.values(gh?.snaps ?? {}).map((s) => s.streak ?? 0),
  );
  const week = Object.values(gh?.snaps ?? {}).reduce(
    (a, s) => a + (s.commits7 ?? 0),
    0,
  );
  const focus = list.filter((p) => p.status === "active" && p.nextAction)[0];

  return (
    <>
      <section
        className="glass fade-up relative mb-7 overflow-hidden rounded-[2rem] p-7 md:p-9"
        style={{ ["--c" as string]: "#8b5cf6" }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet">
              🚀 Mission control
            </div>
            <h1 className="text-gradient text-3xl font-extrabold tracking-tight md:text-5xl">
              Build the things you’re curious about.
            </h1>
            <p className="mt-3 text-[15px] italic text-soft">“{quote}”</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setForm("new")}
              >
                <Plus size={15} /> New project
              </button>
              <button className="btn" onClick={() => void loadGh(true)}>
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Sync GitHub
              </button>
              <Link href="/connect" className="btn">
                {gh?.configured.token ? "GitHub connected ✓" : "Connect GitHub"}
              </Link>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { l: "commits / week", v: week, i: "⚡" },
              { l: "best streak", v: `${streak}d`, i: "🔥" },
              { l: "goals done", v: `${doneGoals}/${totalGoals}`, i: "🎯" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-line bg-black/30 px-4 py-3 text-center backdrop-blur"
              >
                <div className="text-2xl font-extrabold text-white">
                  {s.i} {s.v}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
        {focus && (
          <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-line bg-black/30 p-4 backdrop-blur">
            <span className="text-2xl">{focus.emoji}</span>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber">
                Today’s focus
              </div>
              <div className="text-[14.5px] font-semibold text-white">
                {focus.title}: {focus.nextAction}
              </div>
            </div>
          </div>
        )}
      </section>

      {gh?.attention.authed && (
        <section className="glass mb-7 rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-mute">
            <Eye size={14} /> Needs your attention on GitHub{" "}
            {gh.attention.user ? `· @${gh.attention.user}` : ""}
          </div>
          {gh.attention.error ? (
            <p className="text-sm text-red-300">{gh.attention.error}</p>
          ) : gh.attention.items.length === 0 ? (
            <p className="text-sm text-mint">
              ✨ Inbox zero — nothing is waiting on you.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {gh.attention.items.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-3 text-[13px] hover:bg-white/[0.07]"
                >
                  <span
                    className="chip"
                    style={{
                      ["--c" as string]:
                        a.kind === "review"
                          ? "#f472b6"
                          : a.kind === "issue"
                            ? "#fbbf24"
                            : "#22d3ee",
                    }}
                  >
                    {a.kind === "review"
                      ? "review requested"
                      : a.kind === "issue"
                        ? "assigned"
                        : "my PR"}
                  </span>
                  <span className="clamp-2 flex-1 text-soft">{a.title}</span>
                  <span className="shrink-0 text-[11px] text-mute">
                    {a.repo.split("/")[1]}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {list.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl px-6 py-16 text-center">
          <div className="mb-3 text-5xl">🌱</div>
          <div className="text-xl font-extrabold text-white">
            Plant your first project
          </div>
          <p className="mt-1 max-w-md text-sm text-mute">
            Give it a name, link a GitHub repo, add a few goals — Atlas turns it
            into a living card with commit momentum, streaks and confetti.
          </p>
          <button
            className="btn btn-primary mt-5"
            onClick={() => setForm("new")}
          >
            <Plus size={15} /> Create project
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card
              key={`${p.id}-${p.title}-${p.goals.length}-${p.repo}`}
              p={p}
              snap={gh?.snaps[p.repo]}
              loading={loading}
              onEdit={() => setForm(p)}
              onChange={reload}
            />
          ))}
        </div>
      )}
      {form && (
        <Form
          initial={form === "new" ? undefined : form}
          onClose={() => setForm(null)}
          onSaved={reload}
        />
      )}
    </>
  );
}
