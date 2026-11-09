"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  GitBranch,
  MessageCircle,
  FileText,
  Clock,
  Users,
  ShieldCheck,
  FlaskRound,
  MessagesSquare,
  TrendingDown,
  TrendingUp,
  Star,
  Bot,
} from "lucide-react";
import Tilt from "@/components/Tilt";
import { domainMeta } from "@/lib/meta";
import { timeAgo } from "@/lib/text";
import { api, toast } from "@/lib/client";
import { sfx } from "@/lib/sound";
import type { Card } from "@/lib/cards";

export function SaveButton({ id, saved }: { id: number; saved: boolean }) {
  const [on, setOn] = useState(saved);
  return (
    <button
      className={`btn !p-2 ${on ? "!border-amber/50 !text-amber" : ""}`}
      title={on ? "Remove from library" : "Save to library"}
      data-sfx="none"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !on;
        setOn(next);
        next ? sfx.save() : sfx.click();
        await api(`/api/items/${id}`, "PATCH", { saved: next });
        if (next) toast("Saved to your library", "info");
      }}
    >
      {on ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
    </button>
  );
}

export default function ItemCard({
  c,
  compact = false,
}: {
  c: Card;
  compact?: boolean;
}) {
  const dm = domainMeta(c.kind, c.domain);
  const geoWhy = c.kind === "geo" && c.why;
  return (
    <Tilt
      color={dm.color}
      className={`group flex flex-col rounded-3xl p-5 ${c.read ? "opacity-70" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chip" style={{ ["--c" as string]: dm.color }}>
          {dm.emoji} {dm.label}
        </span>
        {c.essentialWhy && (
          <span className="chip" style={{ ["--c" as string]: "#fbbf24" }}>
            <Star size={10} /> Essential classic
          </span>
        )}
        {c.byAgent && (
          <span className="chip" style={{ ["--c" as string]: "#22d3ee" }}>
            <Bot size={10} /> From your agent
          </span>
        )}
        {c.sentiment && c.sentiment !== "neutral" && (
          <span
            className="chip"
            style={{
              ["--c" as string]: c.sentiment === "up" ? "#34d399" : "#f87171",
            }}
          >
            {c.sentiment === "up" ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}{" "}
            {c.sentiment === "up" ? "Positive" : "Negative"}
          </span>
        )}
        <span className="ml-auto truncate text-[11px] text-mute">
          {c.source} · {timeAgo(c.publishedAt)}
        </span>
      </div>

      <h3 className="clamp-3 text-[16.5px] font-bold leading-snug tracking-tight text-white">
        <Link
          href={`/item/${c.id}`}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {c.title}
        </Link>
      </h3>

      {!compact && (
        <div className="mt-3 flex-1">
          <div
            className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: dm.color }}
          >
            {c.essentialWhy ? "Why it’s a classic" : "In plain words"}
          </div>
          <p className="clamp-4 text-[13.5px] leading-relaxed text-soft">
            {c.essentialWhy ?? c.tldr}
          </p>
          {geoWhy && (
            <p className="mt-2 rounded-xl border border-line bg-white/[0.03] p-2.5 text-[12.5px] leading-relaxed text-soft">
              <b className="text-white">🎯 Why it matters: </b>
              {c.why}
            </p>
          )}
        </div>
      )}

      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11.5px] text-mute">
        {c.authors.length > 0 && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            <span className="max-w-[170px] truncate">
              {c.authors.slice(0, 2).join(", ")}
              {c.authorCount > 2 ? ` +${c.authorCount - 2}` : ""}
            </span>
          </span>
        )}
        {c.kind === "paper" && c.peerReviewed !== undefined && (
          <span
            className={`flex items-center gap-1 ${c.peerReviewed ? "text-mint" : "text-amber"}`}
          >
            <ShieldCheck size={12} />{" "}
            {c.peerReviewed ? "Peer-reviewed" : "Preprint"}
          </span>
        )}
        {c.upvotes ? (
          <span className="flex items-center gap-1 text-violet">
            ▲ {c.upvotes}
          </span>
        ) : null}
        {c.points ? (
          <span className="flex items-center gap-1 text-orange-300">
            ▲ {c.points}
          </span>
        ) : null}
        {c.comments ? (
          <span className="flex items-center gap-1">
            <MessagesSquare size={12} /> {c.comments}
          </span>
        ) : null}
        {c.kind !== "geo" && c.kind !== "industry" && (
          <span className="flex items-center gap-1">
            <Clock size={12} /> {c.readMinutes} min · {c.level}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-line pt-3">
        {c.github && (
          <a
            href={c.github}
            target="_blank"
            rel="noreferrer"
            className="btn !px-2.5 !py-1.5 !text-[11.5px]"
            title="Code on GitHub"
          >
            <GitBranch size={13} /> Code{c.stars ? ` ★${c.stars}` : ""}
          </a>
        )}
        {c.project && (
          <a
            href={c.project}
            target="_blank"
            rel="noreferrer"
            className="btn !px-2.5 !py-1.5 !text-[11.5px]"
          >
            <FlaskRound size={13} /> Project
          </a>
        )}
        {!c.github && !c.project && (
          <a
            href={c.link ?? c.url}
            target="_blank"
            rel="noreferrer"
            className="btn !px-2.5 !py-1.5 !text-[11.5px]"
          >
            <ExternalLink size={13} /> Original
          </a>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href={`/chat?item=${c.id}`}
            className="btn !p-2"
            title="Ask Atlas to explain & verify"
          >
            <MessageCircle size={15} />
          </Link>
          <Link
            href={`/item/${c.id}`}
            className="btn !p-2"
            title="Open deep explanation"
          >
            <FileText size={15} />
          </Link>
          <SaveButton id={c.id} saved={c.saved} />
        </div>
      </div>
    </Tilt>
  );
}
