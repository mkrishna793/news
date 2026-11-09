import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { listItems } from "@/lib/data";
import { toCard } from "@/lib/cards";
import ResearchArtwork from "@/components/ResearchArtwork";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function Page() {
  const papers = (
    await listItems({ kind: "paper", domain: "quantum-bio", limit: 24 })
  ).map(toCard);
  return (
    <>
      <section className="detail-hero">
        <div>
          <div className="eyebrow">THE LIVING FRONTIER / QUANTUM BIOLOGY</div>
          <h1>
            Life, through
            <br />a quantum lens.
          </h1>
          <p>
            From the spin chemistry of a bird’s compass to tunnelling in
            enzymes, explore where quantum mechanics matters in living systems.
            A proposed mechanism isn’t proof: follow the original evidence and
            its limits.
          </p>
          <Button asChild>
            <a href="#papers">
              Explore the research <ArrowUpRight size={14} />
            </a>
          </Button>
        </div>
        <ResearchArtwork />
      </section>
      <div className="section-heading">
        <h2>
          Three paths into the field
          <span>A conceptual map, not experimental results.</span>
        </h2>
      </div>
      <div className="grid gap-5 py-7 md:grid-cols-3">
        {[
          {
            title: "A bird’s compass",
            text: "Light → radical pairs → spin dynamics → chemical response. Can a magnetic field influence that reaction?",
            q: "radical pair magnetoreception",
          },
          {
            title: "Energy in a leaf",
            text: "Photon → pigment excitation → energy transfer → reaction centre. Which quantum signatures persist under biological conditions?",
            q: "photosynthetic coherence",
          },
          {
            title: "Through the barrier",
            text: "Reactants → energy barrier → tunnelling → products. Isotope effects help test the role of hydrogen transfer in enzymes.",
            q: "enzyme quantum tunnelling",
          },
        ].map((x) => (
          <div className="glass rounded-xl p-5" key={x.title}>
            <h3 className="mb-3 font-serif text-2xl">{x.title}</h3>
            <p className="mb-5 text-xs leading-7 text-mute">{x.text}</p>
            <a
              className="text-link"
              href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(x.q)}`}
              target="_blank"
              rel="noreferrer"
            >
              Browse original research <ArrowUpRight size={13} />
            </a>
          </div>
        ))}
      </div>
      <section id="papers">
        <div className="section-heading">
          <h2>
            From the literature
            <span>Original abstracts, without the scripted explanation.</span>
          </h2>
          <Link href="/research?d=quantum-bio">Open library →</Link>
        </div>
        {papers.length ? (
          papers.map((p) => (
            <article className="reading-row" key={p.id}>
              <div>
                <div className="eyebrow">
                  {p.source} ·{" "}
                  {p.peerReviewed
                    ? "Journal article"
                    : "Preprint / check source"}
                </div>
                <Link href={`/item/${p.id}`}>
                  <h3>{p.title}</h3>
                </Link>
                <p>{p.tldr}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="feed-empty">
            No papers collected yet. Use Update feed above to check the
            dedicated quantum biology source. You can browse the original
            literature through the three paths above while it loads.
          </p>
        )}
      </section>
    </>
  );
}
