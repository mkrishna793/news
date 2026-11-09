"use client";
import { useEffect, useState } from "react";
import { Play, X, ExternalLink, Eye } from "lucide-react";
import Tilt from "@/components/Tilt";
import { SaveButton } from "@/components/ItemCard";
import { domainMeta } from "@/lib/meta";
import { timeAgo } from "@/lib/text";
import type { Card } from "@/lib/cards";
import { sfx } from "@/lib/sound";

const fmt = (n?: number) =>
  !n
    ? ""
    : n > 1e6
      ? `${(n / 1e6).toFixed(1)}M views`
      : n > 1e3
        ? `${Math.round(n / 1e3)}K views`
        : `${n} views`;

export default function VideoGrid({ videos }: { videos: Card[] }) {
  const [cur, setCur] = useState<Card | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setCur(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {videos.map((v) => {
          const dm = domainMeta("video", v.domain);
          return (
            <Tilt
              key={v.id}
              color={dm.color}
              className="group overflow-hidden rounded-3xl"
              max={4}
            >
              <button
                data-sfx="open"
                className="relative block aspect-video w-full overflow-hidden"
                onClick={() => {
                  setCur(v);
                  void fetch(`/api/items/${v.id}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ read: true }),
                  });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-transform group-hover:scale-110">
                  <Play size={22} fill="white" />
                </span>
                <span
                  className="absolute bottom-2 left-3 chip"
                  style={{ ["--c" as string]: dm.color }}
                >
                  {dm.emoji} {dm.label}
                </span>
              </button>
              <div className="p-4">
                <h3 className="clamp-2 text-[15px] font-bold leading-snug text-white">
                  {v.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-[11.5px] text-mute">
                  <span className="font-semibold text-soft">
                    {v.channel ?? v.source}
                  </span>
                  ·<span>{timeAgo(v.publishedAt)}</span>
                  {v.views ? (
                    <span className="flex items-center gap-1">
                      · <Eye size={11} /> {fmt(v.views)}
                    </span>
                  ) : null}
                  <span className="ml-auto">
                    <SaveButton id={v.id} saved={v.saved} />
                  </span>
                </div>
                <p className="clamp-2 mt-2 text-[12.5px] leading-relaxed text-mute">
                  {v.tldr}
                </p>
              </div>
            </Tilt>
          );
        })}
      </div>

      {cur && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center p-4"
          onClick={() => setCur(null)}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div
            className="glass-strong toast-in relative w-full max-w-5xl overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${cur.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={cur.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white">{cur.title}</h3>
                <p className="text-xs text-mute">{cur.channel}</p>
              </div>
              <a
                href={cur.url}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                <ExternalLink size={14} /> YouTube
              </a>
              <button
                className="btn !p-2.5"
                onClick={() => {
                  sfx.click();
                  setCur(null);
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
