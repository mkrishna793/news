"use client";
import { sfx } from "@/lib/sound";

export type ToastDetail = { text: string; tone?: "ok" | "err" | "info" };
export function toast(text: string, tone: ToastDetail["tone"] = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>("atlas-toast", { detail: { text, tone } }),
  );
  if (tone === "ok") sfx.success();
  if (tone === "err") sfx.error();
}

export async function api<T = unknown>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T & { error?: string }> {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res
    .json()
    .catch(() => ({ error: `Request failed (${res.status})` }))) as T & {
    error?: string;
  };
}

export function confetti(x: number, y: number, color = "#8b5cf6") {
  const colors = [color, "#22d3ee", "#fbbf24", "#f472b6", "#34d399"];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement("i");
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 140;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${4 + Math.random() * 5}px;height:${7 + Math.random() * 6}px;background:${colors[i % colors.length]};border-radius:2px;z-index:9999;pointer-events:none;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d + 90}px;--rot:${Math.random() * 720}deg;animation:confetti ${0.9 + Math.random() * 0.7}s cubic-bezier(.2,.7,.3,1) forwards`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}
