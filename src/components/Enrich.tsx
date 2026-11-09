"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  GraduationCap,
  ImageIcon,
  Link2,
  Loader2,
  Star,
  User,
} from "lucide-react";
import type { Enrich } from "@/app/api/items/[id]/enrich/route";

type State = { data: Enrich | null; loading: boolean; error?: string };
const Ctx = createContext<State>({ data: null, loading: true });

export function EnrichProvider({
  id,
  children,
  enabled = true,
}: {
  id: number;
  children: ReactNode;
  enabled?: boolean;
}) {
  const [s, setS] = useState<State>({ data: null, loading: enabled });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch(`/api/items/${id}/enrich`)
      .then((r) => r.json())
      .then((d) => alive && setS({ data: d, loading: false }))
      .catch(
        () =>
          alive &&
          setS({ data: null, loading: false, error: "Couldn’t load extras" }),
      );
    return () => {
      alive = false;
    };
  }, [id, enabled]);
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}

const flag = (cc?: string) =>
  cc && cc.length === 2
    ? String.fromCodePoint(
        ...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)),
      )
    : "";
const hue = (s: string) =>
  [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const fmt = (n?: number) =>
  n == null
    ? "–"
    : n >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `${(n / 1e3).toFixed(1)}K`
        : String(n);

function Loading({ label }: { label: string }) {
  return (
    <div className="glass flex items-center gap-3 rounded-3xl p-5 text-sm text-mute">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}

export function Figures() {
  const { data, loading } = useContext(Ctx);
  const [big, setBig] = useState<number | null>(null);
  if (loading) return <Loading label="Extracting figures from the paper…" />;
  if (!data?.figures.length)
    return (
      <div className="glass rounded-3xl p-5 text-sm text-mute">
        <div className="mb-1 flex items-center gap-2 font-semibold text-soft">
          <ImageIcon size={15} /> Figures
        </div>
        No figures could be extracted automatically
        {data?.links.pdf ? " — open the PDF to see the original charts." : "."}
      </div>
    );
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-mute">
        <ImageIcon size={14} /> Visuals from the paper
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.figures.map((f, i) => (
          <button
            key={f.src}
            className="group overflow-hidden rounded-2xl border border-line bg-white text-left"
            data-sfx="open"
            onClick={() => setBig(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.src}
              alt={f.caption}
              loading="lazy"
              className="h-44 w-full object-contain p-2 transition-transform group-hover:scale-[1.03]"
            />
            <div className="clamp-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] leading-snug text-slate-700">
              {f.caption || `Figure ${i + 1}`}
            </div>
          </button>
        ))}
      </div>
      {big !== null && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center p-4"
          onClick={() => setBig(null)}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div
            className="toast-in relative max-h-full max-w-5xl overflow-auto rounded-3xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.figures[big].src}
              alt=""
              className="mx-auto max-h-[75vh] object-contain"
            />
            <p className="mt-3 text-sm text-slate-700">
              {data.figures[big].caption}
            </p>
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-mute">
        Figures are loaded directly from arXiv’s HTML version of the paper; all
        rights remain with the authors.
      </p>
    </div>
  );
}

export function Authors({ fallback }: { fallback: string[] }) {
  const { data, loading } = useContext(Ctx);
  if (loading) return <Loading label="Looking up the authors (OpenAlex)…" />;
  const list = data?.authors?.length
    ? data.authors
    : fallback.map((name) => ({ name }) as Enrich["authors"][number]);
  if (!list.length) return null;
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-mute">
        <GraduationCap size={14} /> The people behind it
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((a) => (
          <div
            key={a.name + (a.profile ?? "")}
            className="flex gap-3 rounded-2xl border border-line bg-white/[0.03] p-3.5"
          >
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold text-white"
              style={{
                background: `linear-gradient(135deg, hsl(${hue(a.name)} 70% 55%), hsl(${(hue(a.name) + 60) % 360} 70% 40%))`,
              }}
            >
              {a.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[14px] font-bold text-white">
                  {a.name}
                </span>
                {a.role && (
                  <span
                    className="chip"
                    style={{ ["--c" as string]: "#fbbf24" }}
                  >
                    {a.role}
                  </span>
                )}
              </div>
              {a.affiliation && (
                <div className="clamp-2 mt-0.5 text-[12px] text-soft">
                  {flag(a.country)} {a.affiliation}
                </div>
              )}
              {(a.hIndex != null || a.works != null) && (
                <div className="mt-1.5 flex gap-3 text-[11px] text-mute">
                  <span>
                    <b className="text-white">{fmt(a.hIndex)}</b> h-index
                  </span>
                  <span>
                    <b className="text-white">{fmt(a.works)}</b> papers
                  </span>
                  <span>
                    <b className="text-white">{fmt(a.citations)}</b> citations
                  </span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <a
                  className="text-violet hover:underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(`author:"${a.name}"`)}`}
                >
                  Scholar
                </a>
                {a.profile && (
                  <a
                    className="text-violet hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={a.profile}
                  >
                    OpenAlex
                  </a>
                )}
                {a.orcid && (
                  <a
                    className="text-violet hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={a.orcid}
                  >
                    ORCID
                  </a>
                )}
                <a
                  className="text-violet hover:underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://github.com/search?q=${encodeURIComponent(a.name)}&type=users`}
                >
                  GitHub?
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      {data?.venue || data?.citations != null ? (
        <p className="mt-3 text-[12px] text-mute">
          {data.venue ? `Venue: ${data.venue}. ` : ""}
          {data.citations != null
            ? `Cited ${data.citations} times so far.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

export function LinksBox({
  original,
  extra = [],
}: {
  original: string;
  extra?: { label: string; href: string }[];
}) {
  const { data, loading } = useContext(Ctx);
  const L = data?.links ?? {};
  const rows: {
    icon: ReactNode;
    label: string;
    href?: string;
    sub?: string;
  }[] = [
    {
      icon: <ExternalLink size={14} />,
      label: "Original source",
      href: original,
    },
    { icon: <FileText size={14} />, label: "Full paper (PDF)", href: L.pdf },
    {
      icon: <BookOpen size={14} />,
      label: "Readable web version",
      href: L.html,
    },
    { icon: <Globe size={14} />, label: "arXiv page", href: L.arxiv },
    { icon: <Link2 size={14} />, label: "DOI", href: L.doi },
    {
      icon: <GitBranch size={14} />,
      label: "Code on GitHub",
      href: L.github,
      sub: L.stars ? `★ ${L.stars}` : undefined,
    },
    { icon: <Star size={14} />, label: "Project page", href: L.project },
    { icon: <User size={14} />, label: "Hugging Face paper page", href: L.hf },
    ...extra.map((e) => ({
      icon: <Link2 size={14} />,
      label: e.label,
      href: e.href,
    })),
  ];
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-mute">
        <span>Links & resources</span>
        {loading && <Loader2 size={13} className="animate-spin" />}
      </div>
      <div className="flex flex-col gap-1.5">
        {rows
          .filter((r) => r.href)
          .map((r) => (
            <a
              key={r.label}
              href={r.href}
              target={r.href!.startsWith("/") ? undefined : "_blank"}
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-[13px] font-medium text-soft transition-colors hover:border-violet/50 hover:bg-white/[0.07] hover:text-white"
            >
              <span className="text-violet">{r.icon}</span>
              {r.label}
              {r.sub && (
                <span className="ml-auto text-xs text-amber">{r.sub}</span>
              )}
            </a>
          ))}
        {!loading && !L.github && (
          <div className="px-1 pt-1 text-[11.5px] text-mute">
            No public code link found for this one yet.
          </div>
        )}
      </div>
      {data?.hfSummary && (
        <div className="mt-4 rounded-2xl border border-line bg-white/[0.03] p-3 text-[12px] leading-relaxed text-soft">
          <b className="text-white">Hugging Face’s auto-summary: </b>
          {data.hfSummary}
        </div>
      )}
    </div>
  );
}
