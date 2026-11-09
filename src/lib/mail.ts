import crypto from "node:crypto";
import { ImapFlow } from "imapflow";

const KEY = crypto
  .createHash("sha256")
  .update(
    process.env.APP_SECRET ??
      `curiosity-atlas:${process.env.DATABASE_URL ?? "local"}`,
  )
  .digest();

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(blob: string): string {
  const [iv, tag, enc] = blob.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

export const PROVIDERS: Record<
  string,
  { label: string; host: string; port: number; help: string }
> = {
  gmail: {
    label: "Gmail",
    host: "imap.gmail.com",
    port: 993,
    help: "Use an App Password (Google Account → Security → 2-Step Verification → App passwords). IMAP must be enabled.",
  },
  outlook: {
    label: "Outlook / Hotmail",
    host: "outlook.office365.com",
    port: 993,
    help: "Personal Outlook accounts need an app password; some work/school tenants block IMAP.",
  },
  yahoo: {
    label: "Yahoo",
    host: "imap.mail.yahoo.com",
    port: 993,
    help: "Generate an app password in Yahoo Account Security.",
  },
  icloud: {
    label: "iCloud",
    host: "imap.mail.me.com",
    port: 993,
    help: "Use an app-specific password from appleid.apple.com.",
  },
  zoho: {
    label: "Zoho",
    host: "imap.zoho.com",
    port: 993,
    help: "Use an application-specific password.",
  },
  custom: {
    label: "Other (IMAP)",
    host: "",
    port: 993,
    help: "Enter your provider’s IMAP host.",
  },
};

export type MailMsg = {
  uid: number;
  from: string;
  subject: string;
  date: string;
  seen: boolean;
  priority: boolean;
  tag?: string;
};
export type Inbox = { unseen: number; total: number; messages: MailMsg[] };

const PRIORITY =
  /\b(urgent|deadline|due|interview|offer|invoice|payment|action required|security alert|verify|review requested|reminder|expires?|final notice|your application|scholarship|admission|decision)\b/i;
function tagFor(from: string, subject: string): string | undefined {
  if (/github\.com/i.test(from))
    return /review|pull request|PR|merge/i.test(subject)
      ? "GitHub · review"
      : "GitHub";
  if (
    /arxiv|biorxiv|scholar|openreview|nature\.com|springer|elsevier|ieee|acm\.org/i.test(
      from,
    )
  )
    return "Research";
  if (/\.edu|university|ac\.in|iit|iisc/i.test(from)) return "Academic";
  if (/linkedin|indeed|naukri|workday|greenhouse|lever/i.test(from + subject))
    return "Career";
  return undefined;
}

export async function fetchInbox(
  acc: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    passEnc: string;
  },
  limit = 15,
): Promise<Inbox> {
  const client = new ImapFlow({
    host: acc.host,
    port: acc.port,
    secure: acc.secure,
    auth: { user: acc.username, pass: decrypt(acc.passEnc) },
    logger: false,
    socketTimeout: 20000,
    greetingTimeout: 12000,
  });
  client.on("error", () => undefined);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      const total =
        (client.mailbox && typeof client.mailbox === "object"
          ? client.mailbox.exists
          : 0) ?? 0;
      const unseenList = (await client.search({ seen: false })) || [];
      const unseen = Array.isArray(unseenList) ? unseenList.length : 0;
      const messages: MailMsg[] = [];
      if (total > 0) {
        const start = Math.max(1, total - limit + 1);
        for await (const m of client.fetch(`${start}:*`, {
          envelope: true,
          flags: true,
          uid: true,
        })) {
          const from = m.envelope?.from?.[0];
          const fromStr = from
            ? `${from.name || from.address?.split("@")[0]} <${from.address}>`
            : "unknown";
          const subject = m.envelope?.subject ?? "(no subject)";
          const seen = m.flags?.has("\\Seen") ?? false;
          messages.push({
            uid: m.uid,
            from: fromStr,
            subject,
            date: new Date(m.envelope?.date ?? Date.now()).toISOString(),
            seen,
            priority: !seen && PRIORITY.test(subject),
            tag: tagFor(fromStr, subject),
          });
        }
      }
      messages.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      return { unseen, total, messages };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}
