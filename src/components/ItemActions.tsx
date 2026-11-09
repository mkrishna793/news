"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, ShieldQuestion, Sparkles } from "lucide-react";
import { SaveButton } from "@/components/ItemCard";
import { api, toast } from "@/lib/client";
import { sfx } from "@/lib/sound";

export function MarkRead({ id }: { id: number }) {
  useEffect(() => {
    const t = setTimeout(
      () => void api(`/api/items/${id}`, "PATCH", { read: true }),
      2500,
    );
    return () => clearTimeout(t);
  }, [id]);
  return null;
}

export function ActionBar({ id, saved }: { id: number; saved: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/chat?item=${id}`} className="btn btn-primary">
        <MessageCircle size={15} /> Ask Atlas about this
      </Link>
      <Link
        href={`/chat?item=${id}&q=${encodeURIComponent("Is this true? Verify it against other sources.")}`}
        className="btn"
      >
        <ShieldQuestion size={15} /> Verify across sources
      </Link>
      <SaveButton id={id} saved={saved} />
    </div>
  );
}

export function AiExplain({ id, hasAi }: { id: number; hasAi: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await api(`/api/explain`, "POST", { id });
        setBusy(false);
        if (r.error) return toast(r.error, "err");
        sfx.success();
        toast("Deeper explanation ready", "ok");
        router.refresh();
      }}
    >
      {busy ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Sparkles size={15} />
      )}{" "}
      {hasAi ? "Re-explain with AI" : "Explain deeper with my AI"}
    </button>
  );
}
