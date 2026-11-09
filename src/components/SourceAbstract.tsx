"use client";
import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function SourceAbstract({
  id,
  text,
}: {
  id: number;
  text: string;
}) {
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [original, setOriginal] = useState(true);
  return (
    <section className="glass rounded-xl p-7">
      <div className="section-heading">
        <h2>
          {original ? "In the authors’ words" : "English translation"}
          <span>
            {original
              ? "Original source abstract / excerpt"
              : "Machine translated — check the original for precision"}
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={async () => {
            if (translation) {
              setOriginal((v) => !v);
              return;
            }
            setBusy(true);
            setError("");
            try {
              const r = await fetch(`/api/items/${id}/translate`, {
                method: "POST",
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setTranslation(d.text);
              setOriginal(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Translation failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Languages size={13} />
          )}{" "}
          {translation ? (original ? "English" : "Original") : "Translate"}
        </Button>
      </div>
      <div className="source-abstract">
        {(original ? text : translation).split(/\n+/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {error && (
        <p className="feed-empty" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
