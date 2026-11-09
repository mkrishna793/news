"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Atom,
  AudioLines,
  BookOpen,
  Bookmark,
  ChevronDown,
  Compass,
  Dna,
  FlaskConical,
  GitFork as Github,
  LayoutDashboard,
  Menu,
  Network,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
const groups = [
  {
    name: "DISCOVER",
    links: [
      ["/", "Overview", LayoutDashboard],
      ["/research", "Research library", BookOpen],
      ["/ai", "AI & technology", Sparkles],
      ["/quantum-biology", "Quantum biology", Dna],
      ["/applied", "Applied science", FlaskConical],
      ["/social", "Community signals", AudioLines],
    ],
  },
  {
    name: "YOUR WORKSPACE",
    links: [
      ["/projects", "Project intelligence", Github],
      ["/library", "Saved reading", Bookmark],
      ["/chat", "Ask Atlas", Network],
    ],
  },
] as const;
type Status = {
  running: boolean;
  done: number;
  total: number;
  lastRun?: string;
  results?: { name: string; count: number; error?: string }[];
  error?: string;
};
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("sage");
  const [status, setStatus] = useState<Status>();
  const [notice, setNotice] = useState("");
  const previous = useRef(false);
  useEffect(() => {
    const saved = localStorage.getItem("atlas-theme") || "sage";
    requestAnimationFrame(() => setTheme(saved));
    document.documentElement.dataset.theme = saved;
  }, []);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const r = await fetch("/api/refresh", { cache: "no-store" });
        if (!r.ok) return;
        const s: Status = await r.json();
        if (disposed) return;
        setStatus(s);
        if (previous.current && !s.running) {
          router.refresh();
          const errors = s.results?.filter((x) => x.error).length || 0;
          setNotice(
            errors
              ? `Refresh finished. ${errors} sources unavailable — see source health.`
              : "Your reading desk is up to date.",
          );
        }
        previous.current = s.running;
      } finally {
        if (!disposed)
          timer = setTimeout(
            () => void poll().catch(() => {}),
            previous.current ? 3000 : 30000,
          );
      }
    };
    void poll().catch(() => {});
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [router]);
  useEffect(() => {
    const notify = (event: Event) => {
      const detail = (event as CustomEvent<{ text: string }>).detail;
      if (detail?.text) setNotice(detail.text);
    };
    window.addEventListener("atlas-toast", notify);
    return () => window.removeEventListener("atlas-toast", notify);
  }, []);
  async function refresh() {
    setNotice("");
    try {
      const r = await fetch("/api/refresh", { method: "POST" });
      const s = await r.json();
      if (!r.ok) throw new Error(s.error || "Refresh unavailable");
      setStatus(s);
      previous.current = true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to refresh");
    }
  }
  const nav = (
    <>
      <Link className="brand" href="/">
        <span className="brand-icon">
          <Compass size={25} />
        </span>
        <span>
          curiosity<span className="brand-atlas">ATLAS</span>
        </span>
      </Link>
      <div className="workspace-label">
        <span className="workspace-avatar">K</span> Personal workspace{" "}
        <ChevronDown size={13} />
      </div>
      <nav>
        {groups.map((g) => (
          <div className="nav-group" key={g.name}>
            <div className="eyebrow">{g.name}</div>
            {g.links.map(([href, label, Icon]) => (
              <Link
                onClick={() => setMobile(false)}
                key={href}
                href={href}
                className={`nav-link ${path === href ? "active" : ""}`}
              >
                <Icon size={17} />
                <span>{label}</span>
                {href === "/quantum-biology" && <small>NEW</small>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="curiosity-note">
          <Atom size={22} />
          <strong>
            A little curiosity.
            <br />A wider perspective.
          </strong>
          <p>Your next idea is out there.</p>
          <Link href="/research">
            Find your next read <ArrowUpRight size={13} />
          </Link>
        </div>
        <Link className="nav-link" href="/connect">
          <Settings2 size={17} /> Settings & connections
        </Link>
        <div className="profile">
          <span className="workspace-avatar">K</span>
          <div>
            <strong>Your reading space</strong>
            <small>Made for curious minds</small>
          </div>
          <ChevronDown size={14} />
        </div>
      </div>
    </>
  );
  return (
    <div className="app-frame">
      <aside className="sidebar">{nav}</aside>
      {mobile && (
        <div className="mobile-nav">
          <button aria-label="Close menu" onClick={() => setMobile(false)}>
            <X />
          </button>
          {nav}
        </div>
      )}
      <div className="app-main">
        <header className="topbar">
          <button
            className="mobile-toggle"
            aria-label="Open menu"
            onClick={() => setMobile(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {path === "/" ? "Overview" : path.slice(1).replaceAll("-", " ")}
            </strong>
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search size={16} />
            <input
              aria-label="Search research"
              placeholder="Follow your curiosity…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Appearance">
                <Settings2 size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent
              title="Make yourself at home"
              description="Three light palettes. One quiet place to think."
            >
              <div className="theme-options">
                {["sage", "rose", "sand"].map((t) => (
                  <button
                    data-palette={t}
                    className={theme === t ? "selected" : ""}
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      localStorage.setItem("atlas-theme", t);
                      document.documentElement.dataset.theme = t;
                    }}
                  >
                    <span />
                    {t}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <span className="top-avatar">K</span>
        </header>
        <main className="page-content">
          {notice && (
            <div className="status-notice" role="status">
              {notice}
              <button aria-label="Dismiss" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          <div className="refresh-strip">
            <span>
              <i /> A quieter corner of the internet.
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <button className="source-status">
                  {status?.running
                    ? `Gathering ${status.done}/${status.total}`
                    : status?.lastRun
                      ? `Last checked ${new Date(status.lastRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : "Your personal research desk"}
                </button>
              </DialogTrigger>
              <DialogContent
                title="Source health"
                description="A refresh checks for new publications. It never invents updates."
              >
                <div className="source-list">
                  {status?.results?.length ? (
                    status.results.map((r) => (
                      <div key={r.name}>
                        <strong>{r.name}</strong>
                        <span>
                          {r.error ? r.error : `${r.count} records checked`}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>
                      No completed refresh yet. Update to check your sources.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              disabled={status?.running}
              onClick={() => void refresh()}
            >
              <RefreshCw
                size={13}
                className={status?.running ? "animate-spin" : ""}
              />{" "}
              {status?.running ? "Updating…" : "Update feed"}
            </Button>
          </div>
          {children}
        </main>
        <footer>
          Curiosity Atlas{" "}
          <span>Thoughtfully gathered. Independently explored.</span>
          <Link href="/connect">
            Manage sources <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
