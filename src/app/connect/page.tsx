import { getAi, aiEnabled } from "@/lib/ai";
import { getSetting } from "@/lib/settings";
import { listSources } from "@/lib/ingest/custom";
import { ingestStatus } from "@/lib/ingest";
import { db } from "@/db";
import { emailAccounts } from "@/db/schema";
import { ready } from "@/db/ensure";
import { PROVIDERS } from "@/lib/mail";
import { TOOLS } from "@/lib/tools";
import ConnectClient from "@/components/ConnectClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connect · Curiosity Atlas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ready();
  const sp = await searchParams;
  const tab = String(Array.isArray(sp.tab) ? sp.tab[0] : (sp.tab ?? "brain"));
  const [ai, gh, sources, status, accs] = await Promise.all([
    getAi(),
    getSetting<{ token?: string; username?: string }>("github", {}),
    listSources(),
    ingestStatus(),
    db.select().from(emailAccounts).orderBy(emailAccounts.id),
  ]);
  return (
    <ConnectClient
      tab={tab}
      ai={{
        mode: ai.mode,
        baseUrl: ai.baseUrl,
        model: ai.model,
        command: ai.command,
        hasKey: !!ai.apiKey,
        enabled: aiEnabled(ai),
      }}
      gh={{ hasToken: !!gh.token, username: gh.username ?? "" }}
      sources={sources.map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        target: s.target,
        section: s.section,
        domain: s.domain,
        enabled: s.enabled,
      }))}
      status={{
        running: status.running,
        lastRun: status.lastRun ?? null,
        results: status.results,
      }}
      accounts={accs.map((a) => ({
        id: a.id,
        label: a.label,
        username: a.username,
        host: a.host,
      }))}
      providers={PROVIDERS}
      tools={TOOLS.map((t) => ({ name: t.name, description: t.description }))}
      cwd={process.cwd()}
    />
  );
}
