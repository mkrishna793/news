import { callTool, TOOLS } from "@/lib/tools";

export const dynamic = "force-dynamic";

// Simple REST alternative to MCP for scripts/agents:
//   curl -X POST localhost:3000/api/agent -d '{"tool":"get_digest","args":{"section":"paper"}}'
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!b.tool)
    return Response.json(
      { error: "tool required", tools: TOOLS.map((t) => t.name) },
      { status: 400 },
    );
  try {
    return Response.json({ result: await callTool(b.tool, b.args ?? {}) });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ tools: TOOLS });
}
