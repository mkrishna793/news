"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Star,
} from "lucide-react";
import { api } from "@/lib/client";
import { timeAgo } from "@/lib/text";
import type { Inbox } from "@/lib/mail";

type Acc = {
  id: number;
  label: string;
  username: string;
  provider: string;
  inbox?: Inbox;
  error?: string;
};

export default function InboxClient() {
  const [accs, setAccs] = useState<Acc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<number | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api<{ accounts: Acc[] }>("/api/email");
    setAccs(r.accounts ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const unseen = accs?.reduce((a, x) => a + (x.inbox?.unseen ?? 0), 0) ?? 0;
  const msgs = (accs ?? [])
    .filter((a) => sel === "all" || a.id === sel)
    .flatMap((a) =>
      (a.inbox?.messages ?? []).map((m) => ({ ...m, acc: a.label })),
    )
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const prio = msgs.filter((m) => m.priority);

  return (
    <>
      <section className="glass fade-up mb-7 rounded-[2rem] p-7 md:p-9">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-rose">
          📬 Read-only inbox radar
        </div>
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight md:text-5xl">
          {loading
            ? "Checking your mail…"
            : unseen
              ? `${unseen} unread across ${accs?.length} account${accs?.length === 1 ? "" : "s"}`
              : accs?.length
                ? "Inbox calm. ✨"
                : "Connect your email"}
        </h1>
        <p className="mt-3 max-w-xl text-[14.5px] text-soft">
          Atlas peeks at subjects and senders over IMAP (read-only — it never
          marks, moves or deletes anything), and flags deadlines, reviews and
          academic mail.
        </p>
        <div className="mt-5 flex gap-2">
          <button className="btn btn-primary" onClick={load}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            Check now
          </button>
          <Link href="/connect?tab=email" className="btn">
            Manage accounts
          </Link>
        </div>
      </section>

      {accs && accs.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center">
          <div className="mb-2 text-5xl">✉️</div>
          <p className="mx-auto max-w-md text-sm text-mute">
            Add up to as many accounts as you like (Gmail, Outlook, Yahoo,
            iCloud, any IMAP). Use an <b className="text-white">app password</b>
            , not your real password.
          </p>
          <Link href="/connect?tab=email" className="btn btn-primary mt-5">
            Add an email account
          </Link>
        </div>
      )}

      {accs && accs.length > 0 && (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              className="pill"
              data-active={sel === "all"}
              onClick={() => setSel("all")}
            >
              All accounts
            </button>
            {accs.map((a) => (
              <button
                key={a.id}
                className="pill"
                data-active={sel === a.id}
                onClick={() => setSel(a.id)}
                style={{ ["--c" as string]: "#f472b6" }}
              >
                <Mail size={13} /> {a.label}{" "}
                {a.inbox ? (
                  <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
                    {a.inbox.unseen}
                  </span>
                ) : a.error ? (
                  "⚠️"
                ) : (
                  ""
                )}
              </button>
            ))}
          </div>
          {accs
            .filter((a) => a.error)
            .map((a) => (
              <div
                key={a.id}
                className="mb-3 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-3.5 text-[13px] text-red-200"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <b>{a.label}:</b> {a.error}
                </div>
              </div>
            ))}
          {prio.length > 0 && (
            <div
              className="glass mb-5 rounded-3xl p-5"
              style={{ borderColor: "#fbbf2455" }}
            >
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber">
                <Star size={14} /> Looks important
              </div>
              {prio.map((m) => (
                <div
                  key={m.uid + m.acc}
                  className="py-1.5 text-[14px] font-semibold text-white"
                >
                  {m.subject}{" "}
                  <span className="text-xs font-normal text-mute">
                    — {m.from.split("<")[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="glass divide-y divide-line overflow-hidden rounded-3xl">
            {loading && !msgs.length && (
              <div className="flex items-center gap-2 p-6 text-sm text-mute">
                <Loader2 className="animate-spin" size={16} /> Fetching…
              </div>
            )}
            {msgs.map((m) => (
              <div
                key={m.acc + m.uid}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04]"
              >
                {m.seen ? (
                  <MailOpen size={16} className="shrink-0 text-mute" />
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose shadow-[0_0_10px_#f472b6]" />
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-[14px] ${m.seen ? "text-soft" : "font-bold text-white"}`}
                  >
                    {m.subject}
                  </div>
                  <div className="truncate text-[12px] text-mute">
                    {m.from.split("<")[0]} · {m.acc}
                  </div>
                </div>
                {m.tag && (
                  <span
                    className="chip hidden sm:inline-flex"
                    style={{ ["--c" as string]: "#22d3ee" }}
                  >
                    {m.tag}
                  </span>
                )}
                <span className="shrink-0 text-[11px] text-mute">
                  {timeAgo(m.date)}
                </span>
              </div>
            ))}
            {!loading && msgs.length === 0 && (
              <div className="p-8 text-center text-sm text-mute">
                No messages to show.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
