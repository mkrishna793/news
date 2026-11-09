import { after } from "next/server";
import { ingestStatus, runIngestion } from "@/lib/ingest";
export const dynamic = "force-dynamic";
export async function POST() {
  try {
    const run = runIngestion();
    after(async () => {
      await run.catch((e) => console.error("[atlas] refresh", e));
    });
    return Response.json(await ingestStatus(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "The research store is unavailable. Please retry." },
      { status: 503 },
    );
  }
}
export async function GET() {
  try {
    return Response.json(await ingestStatus(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Unable to read source health" },
      { status: 503 },
    );
  }
}
