import { handleRpc, TOOLS } from "@/lib/tools";

export const dynamic = "force-dynamic";

// MCP over plain HTTP (JSON-RPC). Point any MCP client at http://localhost:3000/api/mcp
// or use the stdio bridge in /mcp/bridge.mjs.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body)
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(handleRpc))).filter(Boolean);
    return out.length
      ? Response.json(out)
      : new Response(null, { status: 202 });
  }
  const out = await handleRpc(body);
  return out ? Response.json(out) : new Response(null, { status: 202 });
}

export async function GET() {
  return Response.json({
    name: "curiosity-atlas",
    transport: "http-jsonrpc",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
  });
}
