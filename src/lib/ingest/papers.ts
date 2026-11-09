import { getText, getJson, sleep } from "@/lib/http";
import { xml, arr, txt } from "@/lib/xml";
import { stripHtml } from "@/lib/text";
import { github, type Draft, type Any } from "./common";

const ARXIV = "https://export.arxiv.org/api/query";
export const arxivUrl = (id: string) =>
  `https://arxiv.org/abs/${id.replace(/v\d+$/, "")}`;

export async function arxivSearch(
  query: string,
  max: number,
  o: {
    kind?: Draft["kind"];
    domain: string;
    tags?: string[];
    ids?: string[];
    sort?: boolean;
    essential?: Record<string, string>;
  },
): Promise<Draft[]> {
  const params = o.ids
    ? `id_list=${o.ids.join(",")}&max_results=${o.ids.length}`
    : `search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=${max}`;
  const raw = await getText(`${ARXIV}?${params}`, { timeout: 25000 });
  const doc = xml.parse(raw) as Any;
  const out: Draft[] = [];
  for (const e of arr<Any>(doc.feed?.entry)) {
    const idRaw = txt(e.id);
    const id = idRaw.replace(/^.*\/abs\//, "").replace(/v\d+$/, "");
    if (!id || !txt(e.title)) continue;
    const authors = arr<Any>(e.author).map((a) => txt(a.name));
    const affs = arr<Any>(e.author).map((a) => ({
      name: txt(a.name),
      affiliation: txt(a["arxiv:affiliation"]) || undefined,
    }));
    const cats = arr<Any>(e.category).map((c) => c["@_term"] as string);
    const summary = stripHtml(txt(e.summary));
    const comment = txt(e["arxiv:comment"]);
    const pdf = arr<Any>(e.link).find((l) => l["@_title"] === "pdf")?.[
      "@_href"
    ];
    out.push({
      kind: o.kind ?? "paper",
      domain: o.domain,
      source: "arXiv",
      title: stripHtml(txt(e.title)),
      url: arxivUrl(id),
      summary,
      authors,
      publishedAt: new Date(txt(e.published)),
      tags: [...(o.tags ?? []), ...cats.slice(0, 3)],
      essential: !!o.essential,
      meta: {
        arxivId: id,
        pdf: pdf ?? `https://arxiv.org/pdf/${id}`,
        categories: cats,
        comment: comment || undefined,
        journalRef: txt(e["arxiv:journal_ref"]) || undefined,
        doi: txt(e["arxiv:doi"]) || undefined,
        github: github(`${summary} ${comment}`),
        authorInfo: affs,
        peerReviewed: false,
        ...(o.essential?.[id] ? { why: o.essential[id] } : {}),
      },
    });
  }
  return out;
}

export async function arxivLanes(): Promise<
  { name: string; run: () => Promise<Draft[]> }[]
> {
  return [
    {
      name: "arXiv · quantum biology",
      run: () =>
        arxivSearch(
          'all:"quantum biology" OR all:"radical pair" OR all:"photosynthetic coherence" OR all:"enzyme tunneling"',
          24,
          { domain: "quantum-bio" },
        ),
    },
    {
      name: "arXiv · quantum",
      run: () => arxivSearch("cat:quant-ph", 30, { domain: "quantum" }),
    },
    {
      name: "arXiv · neuroscience",
      run: () => arxivSearch("cat:q-bio.NC", 18, { domain: "neuro" }),
    },
    {
      name: "arXiv · neural nets",
      run: () =>
        arxivSearch("cat:cs.NE OR cat:cs.AI OR cat:stat.ML", 24, {
          domain: "ai",
        }),
    },
    {
      name: "arXiv · cross-disciplinary",
      run: () =>
        arxivSearch(
          'all:neuromorphic OR all:"quantum machine learning" OR all:"brain-inspired" OR all:"AI for science" OR all:"computational neuroscience" OR all:"biophysics" OR all:"physics-informed"',
          22,
          { domain: "inter", tags: ["cross-field"] },
        ),
    },
    {
      name: "arXiv · AI applied to science",
      run: () =>
        arxivSearch(
          '(cat:q-bio.BM OR cat:q-bio.GN OR cat:q-bio.QM OR cat:physics.med-ph OR cat:physics.chem-ph OR cat:cond-mat.mtrl-sci OR cat:astro-ph.IM OR cat:eess.IV) AND (abs:"deep learning" OR abs:"neural network" OR abs:"language model" OR abs:"machine learning")',
          24,
          { kind: "applied", domain: "science", tags: ["ai-for-science"] },
        ),
    },
  ];
}

export async function hfDaily(): Promise<Draft[]> {
  const data = await getJson<Any[]>(
    "https://huggingface.co/api/daily_papers?limit=40",
  );
  return data
    .filter((d) => d.paper?.id)
    .map((d) => {
      const p = d.paper;
      return {
        kind: "paper" as const,
        domain: "ai",
        source: "Hugging Face Daily Papers",
        title: stripHtml(p.title ?? d.title),
        url: arxivUrl(p.id),
        summary: stripHtml(p.summary ?? d.summary ?? ""),
        authors: arr<Any>(p.authors)
          .map((a) => a.name)
          .filter(Boolean),
        publishedAt: new Date(p.publishedAt ?? d.publishedAt),
        score: Number(p.upvotes ?? 0) * 3,
        tags: ["trending", ...arr<string>(p.ai_keywords).slice(0, 3)],
        meta: {
          arxivId: p.id,
          pdf: `https://arxiv.org/pdf/${p.id}`,
          github: p.githubRepo || undefined,
          githubStars: p.githubStars || undefined,
          project: p.projectPage || undefined,
          hfUpvotes: p.upvotes,
          aiSummary: p.ai_summary || undefined,
          org: p.organization?.fullname || undefined,
          peerReviewed: false,
        },
      };
    });
}

export async function pubmedNeuro(): Promise<Draft[]> {
  const term =
    '(neuroscience[Title/Abstract] OR neuron*[Title/Abstract] OR brain[Title/Abstract] OR cortex[Title/Abstract]) AND hasabstract AND ("Nature"[Journal] OR "Science"[Journal] OR "Cell"[Journal] OR "Neuron"[Journal] OR "Nature neuroscience"[Journal] OR "Nature communications"[Journal] OR "eLife"[Journal] OR "Science advances"[Journal] OR "Proc Natl Acad Sci U S A"[Journal] OR "Current biology"[Journal] OR "Nature human behaviour"[Journal] OR "Brain"[Journal])';
  const s = await getJson<Any>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=26&sort=pub+date&reldate=21&datetype=pdat&term=${encodeURIComponent(term)}`,
  );
  const ids: string[] = s.esearchresult?.idlist ?? [];
  if (!ids.length) return [];
  await sleep(400);
  const raw = await getText(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`,
    { timeout: 25000 },
  );
  const doc = xml.parse(raw) as Any;
  const out: Draft[] = [];
  for (const a of arr<Any>(doc.PubmedArticleSet?.PubmedArticle)) {
    const mc = a.MedlineCitation;
    const art = mc?.Article;
    if (!art) continue;
    const pmid = txt(mc.PMID);
    const abs = arr<Any>(art.Abstract?.AbstractText)
      .map((t) => (t["@_Label"] ? `${t["@_Label"]}: ` : "") + txt(t))
      .join(" ");
    const authorInfo = arr<Any>(art.AuthorList?.Author)
      .filter((x) => x.LastName)
      .map((x) => ({
        name: `${txt(x.ForeName)} ${txt(x.LastName)}`.trim(),
        affiliation:
          txt(arr<Any>(x.AffiliationInfo)[0]?.Affiliation) || undefined,
      }));
    const ids2 = arr<Any>(a.PubmedData?.ArticleIdList?.ArticleId);
    const doi = ids2.find((i) => i["@_IdType"] === "doi");
    const y = txt(
      art.ArticleDate?.Year ?? art.Journal?.JournalIssue?.PubDate?.Year,
    );
    const m = txt(art.ArticleDate?.Month ?? "1");
    const d = txt(art.ArticleDate?.Day ?? "1");
    const title = stripHtml(
      typeof art.ArticleTitle === "object"
        ? JSON.stringify(art.ArticleTitle).replace(/[{}"#:text]/g, " ")
        : txt(art.ArticleTitle),
    );
    out.push({
      kind: "paper",
      domain: "neuro",
      source: txt(art.Journal?.Title) || "PubMed",
      title:
        typeof art.ArticleTitle === "string"
          ? stripHtml(art.ArticleTitle)
          : stripHtml(txt(art.ArticleTitle)) || title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      summary: stripHtml(abs),
      authors: authorInfo.map((x) => x.name),
      publishedAt: y
        ? new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00Z`)
        : new Date(),
      score: 40,
      tags: ["peer-reviewed", "journal"],
      meta: {
        pmid,
        doi: doi ? txt(doi) : undefined,
        journal: txt(art.Journal?.Title),
        authorInfo,
        peerReviewed: true,
        pdf: doi ? `https://doi.org/${txt(doi)}` : undefined,
      },
    });
  }
  return out.filter((d) => d.title.length > 5);
}

// A hand-picked shelf of landmark papers: "old but important" reading.
export const ESSENTIALS: Record<string, { domain: string; why: string }> = {
  "1706.03762": {
    domain: "ai",
    why: "Introduced the Transformer — the architecture behind essentially every modern language model.",
  },
  "2005.14165": {
    domain: "ai",
    why: "GPT-3: showed that scale alone unlocks few-shot learning in language models.",
  },
  "2001.08361": {
    domain: "ai",
    why: "Scaling laws: the maths showing why bigger models + more data keep getting better.",
  },
  "2201.11903": {
    domain: "ai",
    why: "Chain-of-thought prompting: asking a model to reason step by step makes it far more accurate.",
  },
  "2006.11239": {
    domain: "ai",
    why: "Denoising diffusion models — the engine behind modern image generators.",
  },
  "1512.03385": {
    domain: "ai",
    why: "ResNet: residual connections made very deep networks trainable.",
  },
  "1810.04805": {
    domain: "ai",
    why: "BERT: pretrain on raw text, fine-tune for anything — reshaped NLP.",
  },
  "2106.09685": {
    domain: "ai",
    why: "LoRA: fine-tune giant models cheaply by training a tiny add-on.",
  },
  "2312.00752": {
    domain: "ai",
    why: "Mamba: a serious challenger to Transformers for long sequences.",
  },
  "1412.6980": {
    domain: "ai",
    why: "Adam: the default optimiser used to train most neural networks.",
  },
  "2212.13345": {
    domain: "neuro",
    why: "Hinton’s Forward-Forward: a brain-plausible alternative to backpropagation.",
  },
  "1606.03813": {
    domain: "neuro",
    why: "Toward an integration of deep learning and neuroscience — how the brain might learn like deep nets.",
  },
  "2008.02217": {
    domain: "inter",
    why: "Shows modern Hopfield networks (a classic brain-memory model) are secretly the same as Transformer attention.",
  },
  "1910.11333": {
    domain: "quantum",
    why: "Google’s quantum supremacy experiment — the first claim of beating a supercomputer.",
  },
  "1801.00862": {
    domain: "quantum",
    why: "Preskill’s ‘Quantum Computing in the NISQ era and beyond’ — the best framing of where quantum hardware really stands.",
  },
  "2408.13687": {
    domain: "quantum",
    why: "Quantum error correction below the surface-code threshold: errors finally shrink as the system grows.",
  },
  "quant-ph/9508027": {
    domain: "quantum",
    why: "Shor’s algorithm: why quantum computers threaten today’s encryption.",
  },
  "quant-ph/9605043": {
    domain: "quantum",
    why: "Grover’s search: a quantum speedup for searching unsorted data.",
  },
  "1406.2661": {
    domain: "ai",
    why: "Generative Adversarial Nets: two networks competing to create realistic data.",
  },
  "2203.02155": {
    domain: "ai",
    why: "InstructGPT: aligning models with human feedback — the recipe that led to ChatGPT.",
  },
};

export async function essentials(): Promise<Draft[]> {
  const out: Draft[] = [];
  const entries = Object.entries(ESSENTIALS);
  const why = Object.fromEntries(entries.map(([id, v]) => [id, v.why]));
  for (let i = 0; i < entries.length; i += 10) {
    const chunk = entries.slice(i, i + 10);
    const res = await arxivSearch("", 0, {
      domain: "ai",
      ids: chunk.map(([id]) => id),
      essential: why,
      tags: ["essential", "classic"],
    });
    for (const d of res) {
      const id = d.meta?.arxivId as string;
      const e =
        ESSENTIALS[id] ??
        ESSENTIALS[Object.keys(ESSENTIALS).find((k) => k.endsWith(id)) ?? ""];
      if (e) d.domain = e.domain;
      d.score = 400;
      out.push(d);
    }
    await sleep(3200);
  }
  return out;
}
