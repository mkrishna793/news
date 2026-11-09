// Starts the background refresher when the server boots, so the site updates itself
// every time you run it on your laptop - no cron, no AI required.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const g = globalThis as typeof globalThis & { __atlasScheduler?: boolean };
  if (g.__atlasScheduler) return;
  g.__atlasScheduler = true;
  const { isStale, kickoff } = await import("@/lib/ingest");
  const tick = async () => {
    try {
      const hours = Number(process.env.ATLAS_REFRESH_HOURS ?? 3);
      if (await isStale(hours)) kickoff();
    } catch (e) {
      console.error("[atlas] scheduler", e);
    }
  };
  setTimeout(tick, 4000);
  setInterval(tick, 20 * 60 * 1000);
}
