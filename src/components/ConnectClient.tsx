"use client";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bot,
  Check,
  Copy,
  GitBranch,
  Loader2,
  Mail,
  PlugZap,
  Radar,
  Rss,
  Trash2,
  Wand2,
  Cpu,
  Server,
  TerminalSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api, toast } from "@/lib/client";
import { sfx } from "@/lib/sound";

type Src = {
  id: number;
  type: string;
  name: string;
  target: string;
  section: string;
  domain: string;
  enabled: boolean;
};
type Props = {
  tab: string;
  ai: {
    mode: string;
    baseUrl: string;
    model: string;
    command: string;
    hasKey: boolean;
    enabled: boolean;
  };
  gh: { hasToken: boolean; username: string };
  sources: Src[];
  status: {
    running: boolean;
    lastRun: string | null;
    results: { name: string; count: number; error?: string }[];
  };
  accounts: { id: number; label: string; username: string; host: string }[];
  providers: Record<
    string,
    { label: string; host: string; port: number; help: string }
  >;
  tools: { name: string; description: string }[];
  cwd: string;
};

const TABS = [
  { k: "brain", l: "AI brain", i: <Bot size={15} /> },
  { k: "agents", l: "Agents & MCP", i: <TerminalSquare size={15} /> },
  { k: "sources", l: "Social & sources", i: <Rss size={15} /> },
  { k: "github", l: "GitHub", i: <GitBranch size={15} /> },
  { k: "email", l: "Email", i: <Mail size={15} /> },
  { k: "status", l: "Data status", i: <Radar size={15} /> },
];

const SECTIONS: Record<string, string> = {
  paper: "Research",
  ai_news: "AI Radar",
  applied: "AI Applied",
  industry: "Industry",
  geo: "World",
  video: "Videos",
  hn: "Hacker News",
};
const PRESETS: {
  type: string;
  target: string;
  name: string;
  section: string;
  domain: string;
  label: string;
}[] = [
  {
    type: "reddit",
    target: "neuroscience",
    name: "r/neuroscience",
    section: "paper",
    domain: "neuro",
    label: "Reddit · r/neuroscience",
  },
  {
    type: "reddit",
    target: "QuantumComputing",
    name: "r/QuantumComputing",
    section: "paper",
    domain: "quantum",
    label: "Reddit · r/QuantumComputing",
  },
  {
    type: "reddit",
    target: "ollama",
    name: "r/ollama",
    section: "ai_news",
    domain: "community",
    label: "Reddit · r/ollama",
  },
  {
    type: "reddit",
    target: "geopolitics",
    name: "r/geopolitics",
    section: "geo",
    domain: "world",
    label: "Reddit · r/geopolitics",
  },
  {
    type: "mastodon",
    target: "mastodon.social#neuroscience",
    name: "Mastodon #neuroscience",
    section: "paper",
    domain: "neuro",
    label: "Mastodon · #neuroscience",
  },
  {
    type: "mastodon",
    target: "mastodon.social#machinelearning",
    name: "Mastodon #machinelearning",
    section: "ai_news",
    domain: "community",
    label: "Mastodon · #machinelearning",
  },
  {
    type: "bluesky",
    target: "quantum computing",
    name: "Bluesky · quantum",
    section: "paper",
    domain: "quantum",
    label: "Bluesky · quantum computing",
  },
  {
    type: "bluesky",
    target: "open source LLM",
    name: "Bluesky · LLMs",
    section: "ai_news",
    domain: "community",
    label: "Bluesky · open-source LLMs",
  },
  {
    type: "youtube",
    target: "@ArtemKirsanov",
    name: "Artem Kirsanov",
    section: "video",
    domain: "explainers",
    label: "YouTube · Artem Kirsanov (neuroscience)",
  },
  {
    type: "youtube",
    target: "@bycloudAI",
    name: "bycloud",
    section: "video",
    domain: "news",
    label: "YouTube · bycloud (AI papers)",
  },
  {
    type: "rss",
    target: "https://www.quantamagazine.org/feed/",
    name: "Quanta Magazine",
    section: "paper",
    domain: "inter",
    label: "RSS · Quanta Magazine",
  },
  {
    type: "rss",
    target: "https://www.nature.com/neuro.rss",
    name: "Nature Neuroscience",
    section: "paper",
    domain: "neuro",
    label: "RSS · Nature Neuroscience",
  },
  {
    type: "rss",
    target: "https://phys.org/rss-feed/physics-news/quantum-physics/",
    name: "Phys.org Quantum",
    section: "paper",
    domain: "quantum",
    label: "RSS · Phys.org quantum",
  },
  {
    type: "rss",
    target: "https://www.technologyreview.com/feed/",
    name: "MIT Technology Review",
    section: "industry",
    domain: "bigtech",
    label: "RSS · MIT Tech Review",
  },
  {
    type: "github_topic",
    target: "neuroscience",
    name: "GitHub · neuroscience",
    section: "applied",
    domain: "builders",
    label: "GitHub topic · neuroscience",
  },
  {
    type: "github_topic",
    target: "quantum-computing",
    name: "GitHub · quantum",
    section: "applied",
    domain: "builders",
    label: "GitHub topic · quantum-computing",
  },
];

function Panel({
  title,
  sub,
  children,
  icon,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-white">
        {icon}
        {title}
      </h2>
      {sub && (
        <p className="mt-1 mb-5 text-[13px] leading-relaxed text-mute">{sub}</p>
      )}
      {children}
    </section>
  );
}

function Code({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-2xl border border-line bg-black/50 p-4 pr-12 font-mono text-[12px] leading-relaxed text-cyan-100">
        {text}
      </pre>
      <button
        className="btn absolute right-2 top-2 !p-1.5"
        onClick={() => {
          void navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }}
      >
        {ok ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

export default function ConnectClient(p: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(p.tab);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  // ---------- AI
  const [mode, setMode] = useState(p.ai.mode);
  const [baseUrl, setBaseUrl] = useState(p.ai.baseUrl);
  const [model, setModel] = useState(p.ai.model);
  const [apiKey, setApiKey] = useState(p.ai.hasKey ? "••••••" : "");
  const [command, setCommand] = useState(p.ai.command);
  const [found, setFound] = useState<
    { name: string; baseUrl: string; models: string[] }[] | null
  >(null);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);

  const detect = async () => {
    setBusy("detect");
    const r = await api<{
      found: { name: string; baseUrl: string; models: string[] }[];
    }>("/api/ai?detect=1");
    setFound(r.found ?? []);
    setBusy("");
    if (r.found?.length) {
      sfx.success();
      const f = r.found[0];
      setMode("openai");
      setBaseUrl(f.baseUrl);
      setModels(f.models);
      if (!model && f.models[0]) setModel(f.models[0]);
    } else
      toast(
        "No local AI server found on the usual ports. Start Ollama or LM Studio, or use the agent option.",
        "err",
      );
  };
  const saveAi = async (doTest = false) => {
    setBusy(doTest ? "test" : "save");
    setTest(null);
    const r = await api<{
      ok: boolean;
      reply?: string;
      error?: string;
      ms?: number;
    }>("/api/ai", "POST", {
      mode,
      baseUrl,
      model,
      apiKey,
      command,
      test: doTest,
    });
    setBusy("");
    if (doTest)
      setTest(
        r.ok
          ? { ok: true, text: `Connected — replied “${r.reply}” in ${r.ms}ms` }
          : { ok: false, text: r.error ?? "Failed" },
      );
    if (r.ok || !doTest) {
      toast(doTest ? "AI connected ✓" : "Saved", "ok");
      router.refresh();
    }
  };

  // ---------- GitHub
  const [token, setToken] = useState(p.gh.hasToken ? "••••••" : "");
  const [user, setUser] = useState(p.gh.username);

  // ---------- Email
  const prov = p.providers;
  const [ef, setEf] = useState({
    provider: "gmail",
    label: "",
    username: "",
    password: "",
    host: "",
    port: "993",
  });

  // ---------- Sources
  const [sf, setSf] = useState({
    type: "rss",
    target: "",
    name: "",
    section: "ai_news",
    domain: "general",
  });
  const addSource = async (s: {
    type: string;
    target: string;
    name: string;
    section: string;
    domain: string;
  }) => {
    setBusy("src");
    const r = await api("/api/sources", "POST", s);
    setBusy("");
    if (r.error) return toast(r.error, "err");
    toast(`Connected ${s.name || s.target} — pulling now`, "ok");
    router.refresh();
  };

  const mcpStdio = JSON.stringify(
    {
      mcpServers: {
        "curiosity-atlas": {
          command: "node",
          args: [`${p.cwd}/mcp/bridge.mjs`],
          env: { ATLAS_URL: origin },
        },
      },
    },
    null,
    2,
  );
  const mcpHttp = JSON.stringify(
    {
      mcpServers: {
        "curiosity-atlas": {
          serverUrl: `${origin}/api/mcp`,
          url: `${origin}/api/mcp`,
        },
      },
    },
    null,
    2,
  );

  return (
    <>
      <section className="glass fade-up mb-6 rounded-[2rem] p-7 md:p-9">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-mint">
          <PlugZap size={14} /> Connectors
        </div>
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight md:text-5xl">
          Plug Atlas into your world.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-soft">
          Everything works with zero setup and no AI. Connect only what you
          want: a local model or coding agent for deeper answers, GitHub, email,
          and any social source.
        </p>
      </section>

      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
        {TABS.map((t) => (
          <button
            key={t.k}
            className="pill"
            data-active={tab === t.k}
            onClick={() => setTab(t.k)}
            style={{ ["--c" as string]: "#34d399" }}
          >
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {tab === "brain" && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Panel
            icon={<Bot className="text-cyan" size={20} />}
            title="Connect an AI (optional)"
            sub="Atlas already answers using an algorithm that searches 7 sources and cross-checks them. Add an AI for richer explanations and chat. It runs on YOUR machine — nothing leaves your laptop except the web searches."
          >
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  k: "off",
                  t: "No AI",
                  d: "Algorithm only",
                  i: <Cpu size={18} />,
                },
                {
                  k: "openai",
                  t: "Local model",
                  d: "Ollama, LM Studio, llama.cpp…",
                  i: <Server size={18} />,
                },
                {
                  k: "cli",
                  t: "Coding agent",
                  d: "Claude Code, Gemini CLI, Codex…",
                  i: <TerminalSquare size={18} />,
                },
              ].map((m) => (
                <button
                  key={m.k}
                  onClick={() => setMode(m.k)}
                  className={`rounded-2xl border p-4 text-left transition-all ${mode === m.k ? "border-cyan bg-cyan/10 shadow-[0_0_30px_-10px_#22d3ee]" : "border-line bg-white/[0.03] hover:bg-white/[0.07]"}`}
                >
                  <div className="mb-2 text-cyan">{m.i}</div>
                  <div className="font-bold text-white">{m.t}</div>
                  <div className="text-[11.5px] text-mute">{m.d}</div>
                </button>
              ))}
            </div>

            {mode === "openai" && (
              <div className="space-y-4">
                <button
                  className="btn btn-primary"
                  onClick={detect}
                  disabled={busy === "detect"}
                >
                  {busy === "detect" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Wand2 size={15} />
                  )}{" "}
                  Auto-detect local AI
                </button>
                {found && found.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {found.map((f) => (
                      <button
                        key={f.baseUrl}
                        className="chip"
                        style={{ ["--c" as string]: "#34d399" }}
                        onClick={() => {
                          setBaseUrl(f.baseUrl);
                          setModels(f.models);
                          setModel(f.models[0] ?? "");
                        }}
                      >
                        ✓ {f.name} · {f.models.length} models
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">
                      Server URL (OpenAI-compatible)
                    </label>
                    <input
                      className="field"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input
                      className="field"
                      list="models"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="llama3.2, qwen2.5, …"
                    />
                    <datalist id="models">
                      {models.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">
                      API key (only for hosted servers — leave empty for local)
                    </label>
                    <input
                      className="field"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            {mode === "cli" && (
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Command — Atlas sends the prompt on stdin and reads the
                    answer from stdout
                  </label>
                  <input
                    className="field font-mono"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="claude -p"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "claude -p",
                    'gemini -p ""',
                    "codex exec -",
                    "ollama run llama3.2",
                    "opencode run",
                  ].map((c) => (
                    <button
                      key={c}
                      className="chip"
                      style={{ ["--c" as string]: "#22d3ee" }}
                      onClick={() => setCommand(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] text-mute">
                  The command runs locally with your own logged-in agent. Make
                  sure it works in your terminal first (
                  <code>echo hi | claude -p</code>).
                </p>
              </div>
            )}
            {mode === "off" && (
              <p className="rounded-2xl border border-line bg-white/[0.03] p-4 text-[13.5px] text-soft">
                ✅ Fully AI-free mode. Summaries come from the built-in
                plain-English engine, ranking from the importance algorithm, and
                chat answers from a parallel multi-source search with
                cross-verification.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                className="btn btn-primary"
                onClick={() => saveAi(mode !== "off")}
                disabled={!!busy}
              >
                {busy === "test" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}{" "}
                {mode === "off" ? "Save" : "Save & test connection"}
              </button>
              {test && (
                <span
                  className={`flex items-center gap-1.5 text-[13px] ${test.ok ? "text-mint" : "text-red-300"}`}
                >
                  {test.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{" "}
                  {test.text}
                </span>
              )}
            </div>
          </Panel>
          <Panel
            title="How it fits together"
            sub="Three ways to bring intelligence in:"
          >
            <ol className="space-y-4 text-[13.5px] leading-relaxed text-soft">
              <li>
                <b className="text-white">1 · Algorithm (default).</b> Works
                offline-first, zero cost. Good for summaries, ranking,
                verification by cross-source counting.
              </li>
              <li>
                <b className="text-white">2 · Local model.</b> Install Ollama or
                LM Studio, pull a model, hit auto-detect. Chat gets streaming,
                cited, conversational answers.
              </li>
              <li>
                <b className="text-white">3 · Agent in your IDE.</b> Use the{" "}
                <i>Agents & MCP</i> tab: tools like <code>verify_claim</code>{" "}
                and <code>publish_item</code> let your coding agent
                (Antigravity, Claude Code, Cursor…) read Atlas and{" "}
                <em>push its own findings back onto the site</em>.
              </li>
            </ol>
          </Panel>
        </div>
      )}

      {tab === "agents" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            icon={<TerminalSquare className="text-violet" size={20} />}
            title="Connect any coding agent (MCP)"
            sub="Antigravity, Claude Code, Cursor, Windsurf, Gemini CLI, Codex and VS Code all speak MCP. Paste one of these into the agent’s MCP settings (Antigravity: Agent panel → ⋯ → MCP Servers → Manage → View raw config)."
          >
            <div className="space-y-5">
              <div>
                <div className="label">
                  Option A · stdio bridge (most compatible)
                </div>
                <Code text={mcpStdio} />
              </div>
              <div>
                <div className="label">Option B · direct HTTP</div>
                <Code text={mcpHttp} />
              </div>
              <div>
                <div className="label">Claude Code one-liner</div>
                <Code
                  text={`claude mcp add curiosity-atlas -e ATLAS_URL=${origin} -- node ${p.cwd}/mcp/bridge.mjs`}
                />
              </div>
              <div>
                <div className="label">Plain REST (any script)</div>
                <Code
                  text={`curl -X POST ${origin}/api/agent -H 'content-type: application/json' \\\n  -d '{"tool":"verify_claim","args":{"claim":"Google achieved quantum error correction below threshold"}}'`}
                />
              </div>
            </div>
          </Panel>
          <div className="space-y-6">
            <Panel
              title="Starter prompt for your agent"
              sub="Paste this into your agent once — it becomes your personal research tracker that keeps Atlas updated."
            >
              <Code
                text={`You have the "curiosity-atlas" MCP server. Each day:\n1. get_digest for sections paper, ai_news, applied, geo.\n2. Pick the 5 most important items and call verify_claim on each headline claim.\n3. For solid ones, write a friendly 150-word explanation for a non-expert and call save_explanation.\n4. Search the web for notable things Atlas missed (new models, papers, policy changes) and call publish_item.\n5. Call inbox_summary and list_projects, then tell me what needs attention.`}
              />
            </Panel>
            <Panel title="Tools your agent gets">
              <ul className="space-y-2.5">
                {p.tools.map((t) => (
                  <li
                    key={t.name}
                    className="rounded-xl border border-line bg-white/[0.03] p-3"
                  >
                    <code className="text-[12.5px] font-bold text-cyan">
                      {t.name}
                    </code>
                    <div className="mt-0.5 text-[12px] leading-snug text-mute">
                      {t.description}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      )}

      {tab === "sources" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <Panel
              icon={<Rss className="text-amber" size={20} />}
              title="One-click connectors"
              sub="Reddit, Mastodon, Bluesky, YouTube, RSS and GitHub topics — public data, no accounts or API keys. X/Twitter has no free API, so use an RSS bridge URL below if you have one."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {PRESETS.map((s) => {
                  const on = p.sources.some(
                    (x) =>
                      x.type === s.type &&
                      (x.target === s.target || x.name === s.name),
                  );
                  return (
                    <button
                      key={s.label}
                      disabled={on || busy === "src"}
                      onClick={() => addSource(s)}
                      className="flex items-center gap-2 rounded-2xl border border-line bg-white/[0.03] px-3.5 py-2.5 text-left text-[13px] text-soft transition-colors hover:border-mint/50 hover:bg-mint/10 hover:text-white disabled:opacity-50"
                    >
                      {on ? (
                        <Check size={14} className="text-mint" />
                      ) : (
                        <PlugZap size={14} className="text-mint" />
                      )}{" "}
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Add your own source">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Type</label>
                  <select
                    className="field"
                    value={sf.type}
                    onChange={(e) => setSf({ ...sf, type: e.target.value })}
                  >
                    {[
                      ["rss", "RSS / Atom URL (blogs, X bridges, Substack…)"],
                      ["reddit", "Subreddit name"],
                      ["youtube", "YouTube channel (@handle or URL)"],
                      ["mastodon", "Mastodon hashtag (host#tag)"],
                      ["bluesky", "Bluesky search"],
                      ["hn", "Hacker News keyword"],
                      ["github_topic", "GitHub topic"],
                      ["gnews", "Google News search"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Target</label>
                  <input
                    className="field"
                    value={sf.target}
                    onChange={(e) => setSf({ ...sf, target: e.target.value })}
                    placeholder="https://… or name or keyword"
                  />
                </div>
                <div>
                  <label className="label">Show on page</label>
                  <select
                    className="field"
                    value={sf.section}
                    onChange={(e) => setSf({ ...sf, section: e.target.value })}
                  >
                    {Object.entries(SECTIONS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    Category (e.g. neuro, quantum, ai, models, explainers)
                  </label>
                  <input
                    className="field"
                    value={sf.domain}
                    onChange={(e) => setSf({ ...sf, domain: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Display name</label>
                  <input
                    className="field"
                    value={sf.name}
                    onChange={(e) => setSf({ ...sf, name: e.target.value })}
                    placeholder="optional"
                  />
                </div>
              </div>
              <button
                className="btn btn-primary mt-4"
                disabled={!sf.target || busy === "src"}
                onClick={() =>
                  addSource(sf).then(() =>
                    setSf({ ...sf, target: "", name: "" }),
                  )
                }
              >
                {busy === "src" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <PlugZap size={15} />
                )}{" "}
                Connect source
              </button>
            </Panel>
          </div>
          <Panel
            title={`Connected (${p.sources.length})`}
            sub="Pulled on every refresh."
          >
            {p.sources.length === 0 && (
              <p className="text-sm text-mute">
                Nothing yet. Built-in sources (arXiv, PubMed, Hugging Face,
                Reddit, HN, GitHub, YouTube, news) are always on.
              </p>
            )}
            <div className="space-y-2">
              {p.sources.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-white">
                      {s.name}
                    </div>
                    <div className="truncate text-[11px] text-mute">
                      {s.type} → {SECTIONS[s.section] ?? s.section} / {s.domain}
                    </div>
                  </div>
                  <button
                    className={`chip ${s.enabled ? "" : "opacity-50"}`}
                    style={{ ["--c" as string]: "#34d399" }}
                    onClick={async () => {
                      await api("/api/sources", "PATCH", {
                        id: s.id,
                        enabled: !s.enabled,
                      });
                      router.refresh();
                    }}
                  >
                    {s.enabled ? "on" : "off"}
                  </button>
                  <button
                    className="btn !p-1.5 hover:!text-red-400"
                    onClick={async () => {
                      await api(`/api/sources?id=${s.id}`, "DELETE");
                      router.refresh();
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "github" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            icon={<GitBranch className="text-violet" size={20} />}
            title="GitHub"
            sub="Public repos work without anything (60 requests/hour). Add a token to see private repos, review requests, assigned issues and avoid rate limits."
          >
            <div className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  className="field"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="octocat"
                />
              </div>
              <div>
                <label className="label">
                  Personal access token (read-only is enough)
                </label>
                <input
                  className="field"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="github_pat_…"
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await api("/api/github", "POST", { token, username: user });
                    toast("GitHub saved", "ok");
                    router.refresh();
                  }}
                >
                  <Check size={15} /> Save
                </button>
                {p.gh.hasToken && (
                  <button
                    className="btn"
                    onClick={async () => {
                      await api("/api/github", "POST", {
                        token: "",
                        username: user,
                      });
                      setToken("");
                      toast("Token removed", "info");
                      router.refresh();
                    }}
                  >
                    Remove token
                  </button>
                )}
              </div>
            </div>
          </Panel>
          <Panel title="Create a safe token">
            <ol className="list-decimal space-y-2 pl-5 text-[13.5px] leading-relaxed text-soft">
              <li>
                GitHub → Settings → Developer settings →{" "}
                <b>Fine-grained tokens</b> → Generate.
              </li>
              <li>Repository access: all (or select your projects).</li>
              <li>
                Permissions (read-only):{" "}
                <b>Metadata, Contents, Issues, Pull requests</b>.
              </li>
              <li>Paste it here. It’s stored only in your local database.</li>
            </ol>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
              className="btn mt-4"
            >
              Open GitHub token page
            </a>
          </Panel>
        </div>
      )}

      {tab === "email" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Panel
            icon={<Mail className="text-rose" size={20} />}
            title="Add an email account"
            sub="Read-only IMAP. Atlas verifies the login before saving and encrypts the password in your local database. Use an app password."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Provider</label>
                <select
                  className="field"
                  value={ef.provider}
                  onChange={(e) => setEf({ ...ef, provider: e.target.value })}
                >
                  {Object.entries(prov).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Label</label>
                <input
                  className="field"
                  value={ef.label}
                  onChange={(e) => setEf({ ...ef, label: e.target.value })}
                  placeholder="Personal / University"
                />
              </div>
              <div>
                <label className="label">Email address</label>
                <input
                  className="field"
                  value={ef.username}
                  onChange={(e) => setEf({ ...ef, username: e.target.value })}
                />
              </div>
              <div>
                <label className="label">App password</label>
                <input
                  className="field"
                  type="password"
                  value={ef.password}
                  onChange={(e) => setEf({ ...ef, password: e.target.value })}
                />
              </div>
              {ef.provider === "custom" && (
                <>
                  <div>
                    <label className="label">IMAP host</label>
                    <input
                      className="field"
                      value={ef.host}
                      onChange={(e) => setEf({ ...ef, host: e.target.value })}
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div>
                    <label className="label">Port</label>
                    <input
                      className="field"
                      value={ef.port}
                      onChange={(e) => setEf({ ...ef, port: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <p className="mt-3 rounded-xl border border-line bg-white/[0.03] p-3 text-[12px] text-mute">
              💡 {prov[ef.provider]?.help}
            </p>
            <button
              className="btn btn-primary mt-4"
              disabled={busy === "mail" || !ef.username || !ef.password}
              onClick={async () => {
                setBusy("mail");
                const r = await api("/api/email", "POST", ef);
                setBusy("");
                if (r.error) return toast(r.error, "err");
                toast("Email connected ✓", "ok");
                setEf({ ...ef, username: "", password: "", label: "" });
                router.refresh();
              }}
            >
              {busy === "mail" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Mail size={15} />
              )}{" "}
              Verify & connect
            </button>
          </Panel>
          <Panel title={`Connected accounts (${p.accounts.length})`}>
            {p.accounts.length === 0 && (
              <p className="text-sm text-mute">
                None yet — connect two or three.
              </p>
            )}
            <div className="space-y-2">
              {p.accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-3"
                >
                  <Mail size={16} className="text-rose" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-white">
                      {a.label}
                    </div>
                    <div className="truncate text-[11px] text-mute">
                      {a.username} · {a.host}
                    </div>
                  </div>
                  <button
                    className="btn !p-1.5 hover:!text-red-400"
                    onClick={async () => {
                      await api(`/api/email?id=${a.id}`, "DELETE");
                      router.refresh();
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "status" && (
        <Panel
          icon={<Radar className="text-cyan" size={20} />}
          title="Data pipeline"
          sub={`Atlas refreshes automatically when stale (every ~3h while running) and whenever you open it. Last run: ${p.status.lastRun ? new Date(p.status.lastRun).toLocaleString() : "never"}.`}
        >
          <button
            className="btn btn-primary mb-5"
            onClick={async () => {
              await api("/api/refresh", "POST");
              toast("Refresh started — watch the top bar", "info");
              router.refresh();
            }}
          >
            <Radar size={15} /> Refresh everything now
          </button>
          <div className="grid gap-2 md:grid-cols-2">
            {p.status.results.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] px-3.5 py-2.5 text-[13px]"
              >
                {r.error ? (
                  <XCircle size={15} className="shrink-0 text-red-400" />
                ) : (
                  <CheckCircle2 size={15} className="shrink-0 text-mint" />
                )}
                <span className="truncate text-soft">{r.name}</span>
                <span className="ml-auto shrink-0 text-[11px] text-mute">
                  {r.error ? (
                    <span className="text-red-300" title={r.error}>
                      failed
                    </span>
                  ) : (
                    `${r.count} items`
                  )}
                </span>
              </div>
            ))}
          </div>
          {p.status.results.some((r) => r.error) && (
            <p className="mt-4 text-[12px] text-mute">
              Failures are usually temporary (rate limits, a site being down).
              The rest of the pipeline keeps working.
            </p>
          )}
        </Panel>
      )}
    </>
  );
}
