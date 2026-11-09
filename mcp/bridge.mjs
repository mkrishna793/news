#!/usr/bin/env node
// Curiosity Atlas · MCP stdio bridge
// Lets any MCP-capable agent (Antigravity, Claude Code, Cursor, Codex, Gemini CLI...) talk to
// your locally running Atlas. It simply forwards JSON-RPC lines to the app's /api/mcp endpoint.
//
//   node mcp/bridge.mjs            (ATLAS_URL defaults to http://localhost:3000)
import readline from "node:readline";

const BASE = (process.env.ATLAS_URL || "http://localhost:3000").replace(/\/$/, "");
const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  try {
    const res = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg),
    });
    if (res.status === 202 || res.status === 204) return;
    const out = await res.text();
    if (out.trim()) process.stdout.write(out.trim() + "\n");
  } catch (e) {
    if (msg.id !== undefined) {
      process.stdout.write(
        JSON.stringify({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: `Atlas is not reachable at ${BASE}: ${e.message}` } }) + "\n",
      );
    }
  }
});
