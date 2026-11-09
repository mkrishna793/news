"use client";
import { useState } from "react";
import Link from "next/link";
import { GitFork as Github, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Card } from "@/lib/cards";
type Result = {
  repo: { full_name: string; description: string; language: string };
  keywords: string[];
  papers: Card[];
  similar: { full_name: string; description: string; html_url: string }[];
  searches: { term: string; url: string }[];
};
export default function Page() {
  const [repo, setRepo] = useState("");
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <section className="desk-intro">
        <div>
          <div className="eyebrow">PROJECT INTELLIGENCE</div>
          <h1>
            Your code is a starting point.
            <br />
            <em>Find the ideas behind it.</em>
          </h1>
          <p>
            Explore related papers, mathematical topics and neighbouring
            open-source projects.
          </p>
        </div>
        <Github size={42} strokeWidth={1} />
      </section>
      <form
        className="research-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setResult(undefined);
          try {
            const r = await fetch(
              `/api/project-research?repo=${encodeURIComponent(repo)}`,
            );
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            setResult(data);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Search failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          className="field"
          aria-label="Public GitHub repository"
          placeholder="owner/repository or https://github.com/owner/repository"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          required
        />
        <Button disabled={busy}>
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Github size={15} />
          )}{" "}
          {busy ? "Finding connections…" : "Explore repository"}
        </Button>
      </form>
      <p className="text-xs leading-7 text-mute">
        Public repository discovery uses the README description and GitHub
        topics, not a deep code audit. Matches are suggested connections, not
        verified mathematical dependencies.{" "}
        <Link href="/projects" className="underline">
          Manage your connected projects
        </Link>
        .
      </p>
      {error && (
        <p className="status-notice mt-6" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="discovery-results">
          <h2>{result.repo.full_name}</h2>
          <p>{result.repo.description}</p>
          <div className="topic-chips">
            {result.keywords.map((k) => (
              <span className="chip" key={k}>
                {k}
              </span>
            ))}
          </div>
          <h2>Related papers in your library</h2>
          {result.papers.length ? (
            result.papers.map((p) => (
              <Link key={p.id} href={`/item/${p.id}`}>
                <strong>{p.title}</strong>
                <p>{p.tldr}</p>
              </Link>
            ))
          ) : (
            <p>
              No local matches yet. Collect more papers with Update feed, or use
              the original-source searches below.
            </p>
          )}
          <h2>Search the original literature</h2>
          {result.searches.length ? (
            result.searches.map((s) => (
              <a key={s.term} href={s.url} target="_blank" rel="noreferrer">
                {s.term} on arXiv ↗
              </a>
            ))
          ) : (
            <p>
              No research topics detected. Add descriptive topics to the
              repository on GitHub and try again.
            </p>
          )}
          <h2>Neighbouring projects</h2>
          {result.similar.length ? (
            result.similar.map((s) => (
              <a
                key={s.full_name}
                href={s.html_url}
                target="_blank"
                rel="noreferrer"
              >
                <strong>
                  {s.full_name} <ArrowUpRight className="inline" size={15} />
                </strong>
                <p>{s.description}</p>
              </a>
            ))
          ) : (
            <p>
              No similar repositories returned. GitHub search may be rate
              limited.
            </p>
          )}
        </div>
      )}
    </>
  );
}
