"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Dna,
  GitBranch,
  GitFork as Github,
  MoveUpRight,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ResearchArtwork from "@/components/ResearchArtwork";
import type { Card } from "@/lib/cards";
const fieldNames: Record<string, string> = {
  "quantum-bio": "Quantum biology",
  ai: "Artificial intelligence",
  quantum: "Quantum physics",
  neuro: "Neuroscience",
  inter: "Interdisciplinary",
};
const starters = [
  {
    title: "Quantum biology",
    description:
      "Where quantum mechanics meets the living world. Explore the evidence for tunnelling, coherence and spin in biology.",
    url: "https://doi.org/10.1038/nphys2474",
    domain: "quantum-bio",
  },
  {
    title: "Attention Is All You Need",
    description:
      "The original Transformer paper introduces an attention-based architecture that dispenses with recurrence and convolution.",
    url: "https://arxiv.org/abs/1706.03762",
    domain: "ai",
  },
  {
    title: "The radical-pair mechanism of magnetoreception",
    description:
      "A review of the spin chemistry that could help explain how animals sense Earth’s magnetic field.",
    url: "https://doi.org/10.1098/rsif.2011.0048",
    domain: "quantum-bio",
  },
];
export default function ReadingDesk({
  items,
  total,
  date,
}: {
  items: Card[];
  total: number;
  date: string;
}) {
  const [tab, setTab] = useState("all");
  const [slide, setSlide] = useState(0);
  const [saved, setSaved] = useState<number[]>(
    items.filter((x) => x.saved).map((x) => x.id),
  );
  const [message, setMessage] = useState("");
  const filtered = useMemo(
    () =>
      items.filter(
        (x) =>
          tab === "all" ||
          x.domain === tab ||
          (tab === "community" && x.kind === "ai_news"),
      ),
    [items, tab],
  );
  const lead = filtered[slide % Math.max(filtered.length, 1)];
  async function save(id: number) {
    const next = !saved.includes(id);
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved: next }),
    });
    if (res.ok)
      setSaved((s) => (next ? [...s, id] : s.filter((x) => x !== id)));
    else setMessage("Could not save. Please try again.");
  }
  return (
    <>
      <section className="desk-intro">
        <div>
          <div className="eyebrow intro-eyebrow">
            THE DAILY EDITION <span> / </span> {date}
          </div>
          <h1>
            A world of ideas.
            <br />
            <em>A space to make them yours.</em>
          </h1>
          <p>
            The discoveries, conversations and connections worth your curiosity.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">
            <Github size={15} /> Connect a project <ArrowUpRight size={14} />
          </Link>
        </Button>
      </section>
      <div className="edition-divider">
        <span>
          <i /> YOUR FRONTIER, IN FOCUS
        </span>
        <span>
          {total
            ? `${total.toLocaleString()} collected reads`
            : "A fresh start for your research"}{" "}
          <span className="divider-dot">·</span> Independently sourced
        </span>
      </div>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setSlide(0);
        }}
      >
        <TabsList className="desk-tabs" aria-label="Filter research">
          <TabsTrigger value="all">
            For you <span>✧</span>
          </TabsTrigger>
          <TabsTrigger value="ai">AI & technology</TabsTrigger>
          <TabsTrigger value="quantum">Quantum physics</TabsTrigger>
          <TabsTrigger value="quantum-bio">
            Quantum biology <span className="new-dot" />
          </TabsTrigger>
          <TabsTrigger value="neuro">Neuroscience</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="editorial-grid">
        <div className="main-column">
          <section className="feature-story">
            <div className="feature-art">
              <ResearchArtwork
                variant={lead?.domain === "ai" ? "neural" : "botanical"}
              />
              <span className="art-caption">CONCEPTUAL ILLUSTRATION</span>
              <span className="featured-label">
                <Sparkles size={12} /> THE BIG PICTURE
              </span>
            </div>
            <div className="feature-copy">
              <div className="eyebrow">
                {lead
                  ? fieldNames[lead.domain] || lead.domain
                  : "QUANTUM BIOLOGY"}
                <span className="separator"> / </span>
                {lead ? lead.source : "FIELD SPOTLIGHT"}
              </div>
              <Link href={lead ? `/item/${lead.id}` : "/quantum-biology"}>
                <h2>
                  {lead?.title ||
                    "Life has a quantum side. We’re only beginning to understand it."}
                </h2>
              </Link>
              <p>
                {lead?.tldr ||
                  "How do birds find their way? How does energy move through a leaf? At the meeting point of physics and biology, surprisingly small effects open up very big questions."}
              </p>
              <div className="feature-meta">
                <span>
                  {lead
                    ? `${lead.readMinutes} min read · ${lead.peerReviewed ? "Journal article" : "Source-linked research"}`
                    : "Explore the field · Original papers & context"}
                </span>
                {lead && (
                  <button
                    aria-label={
                      saved.includes(lead.id)
                        ? "Unsave article"
                        : "Save article"
                    }
                    onClick={() => void save(lead.id)}
                  >
                    {saved.includes(lead.id) ? (
                      <Check size={17} />
                    ) : (
                      <Bookmark size={17} />
                    )}
                  </button>
                )}
                <Link
                  className="read-story"
                  href={lead ? `/item/${lead.id}` : "/quantum-biology"}
                >
                  Read the story <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </section>
          <div className="feature-pagination">
            <span>
              {lead
                ? "Selected from your research feed"
                : "An invitation to explore"}
            </span>
            <div>
              <span>
                {String(slide + 1).padStart(2, "0")}{" "}
                <i>/ {String(Math.max(filtered.length, 1)).padStart(2, "0")}</i>
              </span>
              <button
                aria-label="Previous story"
                disabled={!filtered.length || slide === 0}
                onClick={() => setSlide((s) => s - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                aria-label="Next story"
                disabled={!filtered.length || slide >= filtered.length - 1}
                onClick={() => setSlide((s) => s + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <section className="reading-list">
            <div className="section-heading">
              <h2>
                Worth your attention<span>Handpicked by curiosity.</span>
              </h2>
              <Link href="/research">
                All research <ArrowRight size={14} />
              </Link>
            </div>
            {filtered.length ? (
              filtered.slice(1, 5).map((item, i) => (
                <article className="reading-row" key={item.id}>
                  <span className="row-number">0{i + 1}</span>
                  <div>
                    <div className="eyebrow">
                      {fieldNames[item.domain] || item.domain}{" "}
                      <span>· {item.source}</span>
                    </div>
                    <Link href={`/item/${item.id}`}>
                      <h3>{item.title}</h3>
                    </Link>
                    <p>{item.tldr}</p>
                    <small>{item.readMinutes} min read</small>
                  </div>
                  <button
                    aria-label={
                      saved.includes(item.id)
                        ? "Unsave article"
                        : "Save article"
                    }
                    onClick={() => void save(item.id)}
                  >
                    <Bookmark
                      size={17}
                      fill={saved.includes(item.id) ? "currentColor" : "none"}
                    />
                  </button>
                </article>
              ))
            ) : (
              <>
                <div className="feed-empty">
                  {tab === "all"
                    ? "Your live library is ready to fill. Update the feed to collect new papers. Until then, start with these foundational reads."
                    : "No collected papers in this view yet. Update your sources or explore the research library."}
                </div>
                {starters
                  .filter((s) => tab === "all" || s.domain === tab)
                  .map((s, i) => (
                    <article className="reading-row" key={s.title}>
                      <span className="row-number">0{i + 1}</span>
                      <div>
                        <div className="eyebrow">
                          FOUNDATIONAL READING · NOT A LIVE UPDATE
                        </div>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          <h3>
                            {s.title} <ArrowUpRight size={14} />
                          </h3>
                        </a>
                        <p>{s.description}</p>
                      </div>
                    </article>
                  ))}
              </>
            )}
            {message && <p role="status">{message}</p>}
          </section>
        </div>
        <aside className="right-column">
          <section className="project-discovery">
            <div className="eyebrow">
              <Github size={15} /> FROM CODE TO DISCOVERY
            </div>
            <h2>
              Your code.
              <br />
              Your next breakthrough.
            </h2>
            <p>
              Find the research behind what you’re building. Connect a
              repository to explore its ideas, mathematics and neighbouring
              projects.
            </p>
            <div className="project-flow">
              <span>
                <GitBranch size={17} /> Your repository
              </span>
              <i />
              <span>
                <Sparkles size={17} /> Research connections
              </span>
              <i />
              <div>
                <small>Relevant papers</small>
                <small>Similar projects</small>
              </div>
            </div>
            <Button asChild>
              <Link href="/project-research">
                <Github size={15} /> Explore a repository{" "}
                <ArrowUpRight size={14} />
              </Link>
            </Button>
            <small>Public repositories. No connection required.</small>
          </section>
          <section className="field-notes">
            <div className="eyebrow">
              A FIELD WORTH FOLLOWING <Dna size={16} />
            </div>
            <h2>
              Small scale.
              <br />
              Extraordinary possibilities.
            </h2>
            <p>Quantum biology brings a different lens to life itself.</p>
            <div className="topic-chips">
              <Link href="/quantum-biology">Magnetoreception</Link>
              <Link href="/quantum-biology">Energy transfer</Link>
              <Link href="/quantum-biology">Tunnelling</Link>
            </div>
            <Link className="text-link" href="/quantum-biology">
              Step into quantum biology <ArrowRight size={15} />
            </Link>
          </section>
          <section className="source-note">
            <div className="eyebrow">
              <span className="small-sun">✳</span> A LITTLE LESS NOISE
            </div>
            <p>
              Original sources. Real context.
              <br />
              Room for your own perspective.
            </p>
            <Link href="/social">
              Explore community signals <MoveUpRight size={13} />
            </Link>
            <div className="source-wordmarks">
              arXiv <span>GitHub</span> PubMed <span>𝕏</span>
            </div>
          </section>
        </aside>
      </div>
      <section className="bottom-invitation">
        <span>Stay curious. Go a little deeper.</span>
        <Link href="/research">
          There’s always another connection to make. <ArrowDown size={15} />
        </Link>
      </section>
    </>
  );
}
