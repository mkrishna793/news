import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailAccounts } from "@/db/schema";
import { ready } from "@/db/ensure";
import { fetchInbox, encrypt, PROVIDERS } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  await ready();
  const only = new URL(req.url).searchParams.get("list");
  const accs = await db.select().from(emailAccounts).orderBy(emailAccounts.id);
  if (only)
    return Response.json({
      accounts: accs.map(({ passEnc: _p, ...a }) => a),
      providers: PROVIDERS,
    });
  const out = await Promise.all(
    accs.map(async ({ passEnc, ...a }) => {
      try {
        return { ...a, inbox: await fetchInbox({ ...a, passEnc }, 20) };
      } catch (e) {
        return {
          ...a,
          error: (e instanceof Error ? e.message : "failed")
            .replace(/\s+/g, " ")
            .slice(0, 160),
        };
      }
    }),
  );
  return Response.json({ accounts: out });
}

export async function POST(req: Request) {
  await ready();
  const b = await req.json().catch(() => ({}));
  const p = PROVIDERS[b.provider] ?? PROVIDERS.custom;
  const row = {
    label: String(b.label || b.username),
    provider: String(b.provider || "custom"),
    host: String(b.host || p.host),
    port: Number(b.port || p.port),
    secure: b.secure !== false,
    username: String(b.username ?? "").trim(),
    passEnc: encrypt(String(b.password ?? "").replace(/\s+/g, "")),
  };
  if (!row.username || !b.password || !row.host)
    return Response.json(
      { error: "Email, app password and host are required." },
      { status: 400 },
    );
  try {
    await fetchInbox(row, 1); // verify credentials before saving
  } catch (e) {
    return Response.json(
      {
        error: `Couldn't sign in: ${(e instanceof Error ? e.message : "failed").slice(0, 160)}. ${p.help}`,
      },
      { status: 400 },
    );
  }
  await db.insert(emailAccounts).values(row);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  await db
    .delete(emailAccounts)
    .where(
      eq(emailAccounts.id, Number(new URL(req.url).searchParams.get("id"))),
    );
  return Response.json({ ok: true });
}
