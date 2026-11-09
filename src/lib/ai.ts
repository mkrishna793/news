import { spawn } from "node:child_process";
import { getSetting } from "@/lib/settings";
import { getJson } from "@/lib/http";

export type AiConfig = {
  mode: "off" | "openai" | "cli";
  baseUrl: string;
  model: string;
  apiKey: string;
  command: string; // CLI agent: reads prompt on stdin, prints answer
};
export const AI_DEFAULT: AiConfig = {
  mode: "off",
  baseUrl: "http://localhost:11434/v1",
  model: "",
  apiKey: "",
  command: "",
};

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export const getAi = () => getSetting<AiConfig>("ai", AI_DEFAULT);
export const aiEnabled = (c: AiConfig) =>
  (c.mode === "openai" && !!c.baseUrl && !!c.model) ||
  (c.mode === "cli" && !!c.command.trim());

// Known local servers we can auto-detect with one click.
export const LOCAL_PROBES = [
  { name: "Ollama", baseUrl: "http://localhost:11434/v1" },
  { name: "LM Studio", baseUrl: "http://localhost:1234/v1" },
  { name: "llama.cpp / llamafile", baseUrl: "http://localhost:8080/v1" },
  { name: "Jan", baseUrl: "http://localhost:1337/v1" },
  { name: "vLLM", baseUrl: "http://localhost:8000/v1" },
  { name: "LocalAI", baseUrl: "http://localhost:8081/v1" },
];

export async function listModels(
  baseUrl: string,
  apiKey?: string,
): Promise<string[]> {
  const d = await getJson<{ data?: { id: string }[] }>(
    `${baseUrl.replace(/\/$/, "")}/models`,
    {
      timeout: 2500,
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    },
  );
  return (d.data ?? []).map((m) => m.id);
}

function runCli(
  command: string,
  prompt: string,
  timeout = 120000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => {
      child.kill();
      reject(new Error("The agent command timed out"));
    }, timeout);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      if (out.trim()) resolve(out.trim());
      else
        reject(
          new Error(
            err.trim().slice(0, 300) || `Agent exited with code ${code}`,
          ),
        );
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// Streams tokens from whichever backend is configured.
export async function* complete(
  cfg: AiConfig,
  messages: Msg[],
): AsyncGenerator<string> {
  if (cfg.mode === "cli") {
    const prompt =
      messages
        .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
        .join("\n\n") + "\n\nASSISTANT:";
    yield await runCli(cfg.command, prompt);
    return;
  }
  const res = await fetch(
    `${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cfg.apiKey ? { authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: true,
        temperature: 0.3,
      }),
    },
  );
  if (!res.ok || !res.body)
    throw new Error(
      `AI server answered ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const data = l.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const j = JSON.parse(data);
        const tok = j.choices?.[0]?.delta?.content;
        if (tok) yield tok as string;
      } catch {
        /* ignore partial */
      }
    }
  }
}

export async function completeText(
  cfg: AiConfig,
  messages: Msg[],
): Promise<string> {
  let out = "";
  for await (const t of complete(cfg, messages)) out += t;
  return out.trim();
}
