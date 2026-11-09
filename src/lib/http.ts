// Small fetch helpers with timeouts + a polite user agent. Every external call in
// the app goes through here so a slow/broken source never blocks the rest.
const UA =
  "Mozilla/5.0 (compatible; CuriosityAtlas/1.0; +local-first research reader)";

export async function getText(
  url: string,
  opts: { timeout?: number; headers?: Record<string, string> } = {},
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout ?? 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": UA, accept: "*/*", ...(opts.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function getJson<T = unknown>(
  url: string,
  opts: { timeout?: number; headers?: Record<string, string> } = {},
): Promise<T> {
  const txt = await getText(url, {
    ...opts,
    headers: { accept: "application/json", ...(opts.headers ?? {}) },
  });
  return JSON.parse(txt) as T;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
