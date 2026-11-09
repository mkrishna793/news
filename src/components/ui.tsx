import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Variant } from "@/components/Scene3D";
import ResearchArtwork from "@/components/ResearchArtwork";
import type { DomainMeta } from "@/lib/meta";
import type { Quote } from "@/lib/ingest/videos";

export function PageHero({
  title,
  subtitle,
  emoji,
  variant = "neural",
  color = "#8b5cf6",
  color2 = "#22d3ee",
  children,
  stats,
}: {
  title: string;
  subtitle: string;
  emoji?: string;
  variant?: Variant;
  color?: string;
  color2?: string;
  children?: ReactNode;
  stats?: { label: string; value: string | number }[];
}) {
  return (
    <section
      className="glass fade-up relative mb-7 overflow-hidden rounded-[2rem] px-6 py-8 md:px-10 md:py-10"
      style={{ ["--c" as string]: color }}
    >
      <div className="pointer-events-none absolute -right-10 -top-24 h-[130%] w-[60%] opacity-90 max-md:opacity-40 md:w-[48%]">
        <ResearchArtwork
          variant={variant === "neural" ? "neural" : "botanical"}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />
      <div className="relative max-w-2xl">
        <div
          className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          <span className="live-dot" style={{ background: color }} /> {emoji}{" "}
          Source-linked research
        </div>
        <h1 className="text-gradient text-3xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-soft">
          {subtitle}
        </p>
        {stats && (
          <div className="mt-6 flex flex-wrap gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-line bg-black/30 px-4 py-2.5 backdrop-blur"
              >
                <div className="text-xl font-extrabold text-white">
                  {s.value}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
        {children && (
          <div className="mt-6 flex flex-wrap gap-3">{children}</div>
        )}
      </div>
    </section>
  );
}

export function Tabs({
  base,
  param,
  active,
  items,
  allLabel = "All",
}: {
  base: string;
  param: string;
  active: string;
  items: (DomainMeta & { count?: number })[];
  allLabel?: string;
}) {
  const href = (k: string) => (k === "all" ? base : `${base}?${param}=${k}`);
  return (
    <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
      <Link
        href={href("all")}
        className="pill"
        data-active={active === "all"}
        style={{ ["--c" as string]: "#8b5cf6" }}
      >
        ✨ {allLabel}
      </Link>
      {items.map((t) => (
        <Link
          key={t.key}
          href={href(t.key)}
          className="pill"
          data-active={active === t.key}
          style={{ ["--c" as string]: t.color }}
        >
          {t.emoji} {t.label}
          {typeof t.count === "number" && (
            <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function SectionTitle({
  children,
  sub,
  action,
  color = "#8b5cf6",
}: {
  children: ReactNode;
  sub?: string;
  action?: ReactNode;
  color?: string;
}) {
  return (
    <div className="mb-4 mt-9 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white">
          <span
            className="h-5 w-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 14px ${color}` }}
          />
          {children}
        </h2>
        {sub && <p className="mt-1 pl-4 text-[13px] text-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({
  title = "Your next discovery starts here",
  hint = "Use Update feed to check your sources. Source health shows which services are available.",
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="glass grid place-items-center rounded-3xl px-6 py-16 text-center">
      <div className="mb-4 grid grid-cols-3 gap-2 opacity-70">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="skeleton h-3 w-14"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <div className="text-lg font-bold text-white">{title}</div>
      <p className="mt-1 max-w-md text-sm text-mute">{hint}</p>
    </div>
  );
}

export function Sparkline({
  data,
  color = "#34d399",
  w = 90,
  h = 28,
  fill = true,
}: {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const sx = w / (data.length - 1);
  const pts = data.map((v, i) => [
    i * sx,
    h - 3 - ((v - min) / (max - min || 1)) * (h - 6),
  ]);
  const d = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const id = `sg${Math.abs(Math.round(data[0] * 100 + data.length * 7 + color.length))}${color.replace("#", "")}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ActivityChart({
  data,
  color = "#8b5cf6",
  title = "New items per day",
}: {
  data: { day: string; n: number }[];
  color?: string;
  title?: string;
}) {
  const days: { day: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    // Server-rendered calendar window, calculated once for this request.
    // eslint-disable-next-line react-hooks/purity
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    days.push({ day: d, n: data.find((x) => x.day === d)?.n ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-mute">
        <span>{title}</span>
        <span>last 14 days</span>
      </div>
      <div className="flex h-24 items-end gap-1.5">
        {days.map((d, i) => (
          <div
            key={d.day}
            className="group relative flex h-full flex-1 items-end"
            title={`${d.day}: ${d.n}`}
          >
            <div
              className="bar-grow w-full rounded-t-md"
              style={{
                height: `${Math.max(4, (d.n / max) * 100)}%`,
                background: `linear-gradient(180deg, ${color}, ${color}33)`,
                animationDelay: `${i * 40}ms`,
                opacity: d.n ? 1 : 0.25,
                transformOrigin: "bottom",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-mute">
        <span>{days[0].day.slice(5)}</span>
        <span>today</span>
      </div>
    </div>
  );
}

export function TagCloud({
  tags,
  base,
  param = "tag",
  color = "#8b5cf6",
}: {
  tags: { tag: string; n: number }[];
  base: string;
  param?: string;
  color?: string;
}) {
  if (!tags.length) return null;
  const max = Math.max(...tags.map((t) => t.n));
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-mute">
        Hot topics right now
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t.tag}
            href={`${base}?${param}=${encodeURIComponent(t.tag)}`}
            className="chip transition-transform hover:scale-105"
            style={{
              ["--c" as string]: color,
              fontSize: `${0.66 + (t.n / max) * 0.22}rem`,
            }}
          >
            {t.tag} <span className="opacity-60">{t.n}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MarketBoard({
  quotes,
  at,
  compact = false,
}: {
  quotes: Quote[];
  at?: string;
  compact?: boolean;
}) {
  if (!quotes.length) return null;
  const list = compact ? [...quotes, ...quotes] : quotes;
  const card = (q: Quote, i: number) => {
    const up = q.pct >= 0;
    const c = up ? "#34d399" : "#f87171";
    return (
      <div
        key={`${q.symbol}${i}`}
        className={`glass flex shrink-0 items-center gap-3 rounded-2xl px-4 py-2.5 ${compact ? "mr-3" : ""}`}
      >
        <div>
          <div className="text-[11px] font-bold text-soft">{q.name}</div>
          <div className="text-[15px] font-extrabold text-white">
            {q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <Sparkline data={q.spark} color={c} w={64} h={26} />
        <div
          className="flex items-center gap-0.5 text-[12px] font-bold"
          style={{ color: c }}
        >
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(q.pct).toFixed(2)}%
        </div>
      </div>
    );
  };
  if (compact)
    return (
      <div
        className="relative -mx-4 overflow-hidden md:-mx-8"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        }}
      >
        <div className="marquee">{list.map(card)}</div>
      </div>
    );
  return (
    <div>
      <div className="mb-3 text-[11px] text-mute">
        Daily moves ·{" "}
        {at
          ? `updated ${new Date(at).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}`
          : ""}{" "}
        · data via Yahoo Finance (delayed)
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quotes.map(card)}
      </div>
    </div>
  );
}
