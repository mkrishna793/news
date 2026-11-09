"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import type { Hit, Verdict } from "@/lib/research";
import { sfx } from "@/lib/sound";
import { hostOf } from "@/lib/text";

type Lane = {
  name: string;
  state: "run" | "done" | "err";
  count?: number;
  ms?: number;
  error?: string;
};
type Msg = {
  role: "user" | "assistant";
  content: string;
  lanes?: Lane[];
  hits?: Hit[];
  verdict?: Verdict;
  mode?: string;
  aiError?: string;
  done?: boolean;
};

const TYPE_COLOR: Record<string, string> = {
  library: "#8b5cf6",
  journal: "#22d3ee",
  news: "#fb923c",
  community: "#f472b6",
  reference: "#34d399",
};
const V_STYLE = {
  strong: {
    c: "#34d399",
    icon: <ShieldCheck size={20} />,
    text: "Multiple independent sources agree.",
  },
  moderate: {
    c: "#60a5fa",
    icon: <ShieldCheck size={20} />,
    text: "A few sources match; details may vary.",
  },
  weak: {
    c: "#fbbf24",
    icon: <ShieldQuestion size={20} />,
    text: "Only one source found — be careful.",
  },
  none: {
    c: "#f87171",
    icon: <ShieldAlert size={20} />,
    text: "Nothing independent confirms this yet.",
  },
} as const;

function Answer({ text, hits }: { text: string; hits?: Hit[] }) {
  const cite = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*|\[\d+\](?:\[\d+\])*|_\([^)]*\)_)/g).map((p, i) => {
      if (p.startsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("_("))
        return (
          <span key={i} className="text-mute">
            {p.slice(1, -1)}
          </span>
        );
      if (/^\[\d+\]/.test(p))
        return (
          <span key={i}>
            {[...p.matchAll(/\[(\d+)\]/g)].map((m) => (
              <a
                key={m[1]}
                href={`#src-${m[1]}`}
                title={hits?.find((h) => h.n === Number(m[1]))?.title}
                className="mx-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-md bg-violet/25 px-1 align-text-top text-[10px] font-bold text-violet-200 no-underline hover:bg-violet/50"
              >
                {m[1]}
              </a>
            ))}
          </span>
        );
      return p;
    });
  return (
    <div className="prose-atlas text-[14.5px]">
      {text.split(/\n{2,}/).map((b, i) =>
        /^\s*[-*] /m.test(b) ? (
          <ul key={i}>
            {b
              .split("\n")
              .filter(Boolean)
              .map((l, j) => (
                <li key={j}>{cite(l.replace(/^\s*[-*] /, ""))}</li>
              ))}
          </ul>
        ) : (
          <p key={i}>{cite(b)}</p>
        ),
      )}
    </div>
  );
}

export default function ChatClient({
  item,
  initialQ,
  ai,
}: {
  item: { id: number; title: string; source: string } | null;
  initialQ: string;
  ai: { enabled: boolean; label: string };
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ctx, setCtx] = useState(item);
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return;
      sfx.send();
      setBusy(true);
      setInput("");
      const history = msgs
        .filter((m) => m.done !== false)
        .map((m) => ({ role: m.role, content: m.content }));
      setMsgs((m) => [
        ...m,
        { role: "user", content: text },
        { role: "assistant", content: "", lanes: [], done: false },
      ]);
      const upd = (f: (m: Msg) => Msg) =>
        setMsgs((all) => all.map((m, i) => (i === all.length - 1 ? f(m) : m)));
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text, itemId: ctx?.id, history }),
        });
        if (!res.body) throw new Error("No response");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const l of lines) {
            if (!l.trim()) continue;
            const e = JSON.parse(l);
            if (e.type === "start") upd((m) => ({ ...m, mode: e.mode }));
            else if (e.type === "lane_start")
              upd((m) => ({
                ...m,
                lanes: [...(m.lanes ?? []), { name: e.name, state: "run" }],
              }));
            else if (e.type === "lane_done") {
              sfx.tick();
              upd((m) => ({
                ...m,
                lanes: m.lanes?.map((x) =>
                  x.name === e.name
                    ? {
                        ...x,
                        state: e.error ? "err" : "done",
                        count: e.count,
                        ms: e.ms,
                        error: e.error,
                      }
                    : x,
                ),
              }));
            } else if (e.type === "sources")
              upd((m) => ({ ...m, hits: e.hits }));
            else if (e.type === "verdict")
              upd((m) => ({ ...m, verdict: e.verdict }));
            else if (e.type === "token")
              upd((m) => ({ ...m, content: m.content + e.text }));
            else if (e.type === "ai_error")
              upd((m) => ({ ...m, aiError: e.message }));
            else if (e.type === "error")
              upd((m) => ({
                ...m,
                content: m.content + `\n\n⚠️ ${e.message}`,
              }));
          }
        }
        upd((m) => ({ ...m, done: true }));
        sfx.receive();
      } catch (err) {
        upd((m) => ({
          ...m,
          content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong"}`,
          done: true,
        }));
        sfx.error();
      }
      setBusy(false);
    },
    [busy, ctx, msgs],
  );

  useEffect(() => {
    if (initialQ && !started.current) {
      started.current = true;
      void send(initialQ);
    }
  }, [initialQ, send]);
  useEffect(
    () => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    [msgs],
  );

  const suggestions = ctx
    ? [
        "Explain this in simple words",
        "Is this true? Verify it against other sources",
        "What are the limitations or risks?",
        "Who else is working on this?",
      ]
    : [
        "What is the latest breakthrough in quantum error correction?",
        "Is it true that AI models are running out of training data?",
        "Explain how brain-computer interfaces work, simply",
        "What changed for international students recently?",
      ];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-4xl flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight">
          Ask Atlas
        </h1>
        <span
          className="chip"
          style={{ ["--c" as string]: ai.enabled ? "#34d399" : "#fbbf24" }}
        >
          {ai.enabled ? (
            <>
              <Bot size={11} /> {ai.label}
            </>
          ) : (
            <>⚙️ Algorithm mode · no AI</>
          )}
        </span>
        {!ai.enabled && (
          <Link href="/connect" className="text-xs text-violet underline">
            Connect a local AI for richer answers
          </Link>
        )}
      </div>

      {ctx && (
        <div className="glass mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
          <Sparkles size={15} className="text-amber" />
          <span className="text-mute">Discussing:</span>
          <Link
            href={`/item/${ctx.id}`}
            className="clamp-2 flex-1 font-semibold text-white hover:underline"
          >
            {ctx.title}
          </Link>
          <button
            className="btn !p-1.5"
            onClick={() => setCtx(null)}
            aria-label="Clear context"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex-1 space-y-6 pb-6">
        {msgs.length === 0 && (
          <div className="glass rounded-3xl p-7">
            <p className="text-[15px] leading-relaxed text-soft">
              Ask about anything you’ve read — or any claim you’re unsure about.
              Atlas searches <b className="text-white">7 sources in parallel</b>{" "}
              (your library, arXiv, OpenAlex journals, Wikipedia, news, Hacker
              News, Reddit), cross-checks how many independent sources agree,
              and then answers with citations.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-2xl border border-line bg-white/[0.03] p-3.5 text-left text-[13.5px] text-soft transition-all hover:border-violet/50 hover:bg-violet/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-to-br from-violet/80 to-indigo-600/80 px-5 py-3 text-[14.5px] text-white shadow-lg">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="space-y-3">
              {/* parallel search lanes */}
              {m.lanes && m.lanes.length > 0 && (
                <div className="glass rounded-3xl p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-mute">
                    {m.lanes.some((l) => l.state === "run") ? (
                      <Loader2 size={12} className="animate-spin text-violet" />
                    ) : (
                      <CheckCircle2 size={12} className="text-mint" />
                    )}
                    Searching {m.lanes.length} sources in parallel
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {m.lanes.map((l) => (
                      <div
                        key={l.name}
                        className="flex items-center gap-2 rounded-xl border border-line bg-black/20 px-3 py-2 text-[12px]"
                      >
                        {l.state === "run" ? (
                          <Loader2
                            size={13}
                            className="animate-spin text-violet"
                          />
                        ) : l.state === "err" ? (
                          <XCircle size={13} className="text-red-400" />
                        ) : (
                          <CheckCircle2 size={13} className="text-mint" />
                        )}
                        <span className="truncate text-soft">{l.name}</span>
                        <span className="ml-auto text-[10.5px] text-mute">
                          {l.state === "run"
                            ? "…"
                            : l.state === "err"
                              ? "failed"
                              : `${l.count} · ${l.ms}ms`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.verdict && (
                <div
                  className="glass flex flex-wrap items-center gap-4 rounded-3xl p-4"
                  style={{ borderColor: `${V_STYLE[m.verdict.level].c}55` }}
                >
                  <div className="relative grid h-16 w-16 shrink-0 place-items-center">
                    <svg
                      viewBox="0 0 36 36"
                      className="absolute inset-0 -rotate-90"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="rgba(255,255,255,.1)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke={V_STYLE[m.verdict.level].c}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(m.verdict.score / 100) * 97.4} 97.4`}
                      />
                    </svg>
                    <span className="text-sm font-extrabold text-white">
                      {m.verdict.score}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="flex items-center gap-2 font-extrabold"
                      style={{ color: V_STYLE[m.verdict.level].c }}
                    >
                      {V_STYLE[m.verdict.level].icon} {m.verdict.label}
                    </div>
                    <div className="text-[12.5px] text-soft">
                      {V_STYLE[m.verdict.level].text} {m.verdict.supporters}{" "}
                      independent source{m.verdict.supporters === 1 ? "" : "s"}{" "}
                      · {m.verdict.types.join(", ") || "none"}
                    </div>
                    {m.verdict.notes.map((n) => (
                      <div key={n} className="mt-1 text-[12px] text-amber">
                        ⚠ {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(m.content || !m.done) && (
                <div className="glass rounded-3xl rounded-bl-lg p-5">
                  {m.aiError && (
                    <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-[12.5px] text-red-200">
                      Your AI backend didn’t respond ({m.aiError}). Showing the
                      built-in answer instead.{" "}
                      <Link href="/connect" className="underline">
                        Check connection
                      </Link>
                    </div>
                  )}
                  {m.content ? (
                    <Answer text={m.content} hits={m.hits} />
                  ) : (
                    <div className="flex gap-1.5 py-2">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-2 w-2 rounded-full bg-violet"
                          style={{
                            animation: `dots 1.2s ${d * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {m.hits && m.hits.length > 0 && (
                <details open={m.done} className="glass rounded-3xl p-4">
                  <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-mute">
                    Sources ({m.hits.length})
                  </summary>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {m.hits.map((h) => (
                      <a
                        key={h.n}
                        id={`src-${h.n}`}
                        href={h.url}
                        target={h.url.startsWith("/") ? undefined : "_blank"}
                        rel="noreferrer"
                        className="group flex gap-3 rounded-2xl border border-line bg-white/[0.03] p-3 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
                      >
                        <span
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold text-white"
                          style={{ background: TYPE_COLOR[h.type] }}
                        >
                          {h.n}
                        </span>
                        <div className="min-w-0">
                          <div className="clamp-2 text-[13px] font-semibold leading-snug text-white">
                            {h.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-mute">
                            <span
                              className="chip !py-0"
                              style={{ ["--c" as string]: TYPE_COLOR[h.type] }}
                            >
                              {h.type}
                            </span>
                            <span>{h.source}</span>
                            {!h.url.startsWith("/") && (
                              <span>{hostOf(h.url)}</span>
                            )}
                            <span className="ml-auto">
                              {Math.round(h.sim * 100)}% match
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ),
        )}
        <div ref={end} />
      </div>

      <form
        className="glass-strong sticky bottom-4 flex items-end gap-2 rounded-3xl p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder={
            ctx
              ? "Ask about this story, or ‘is this true?’"
              : "Ask a question or paste a claim to verify…"
          }
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14.5px] text-white outline-none placeholder:text-[#5d6382]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn btn-primary !rounded-2xl !p-3"
          aria-label="Send"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowUp size={18} />
          )}
        </button>
      </form>
    </div>
  );
}
