"use client";
// Synthesised UI sounds (Web Audio) — no audio files, instant, tiny.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let last = 0;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function initSound() {
  if (typeof window === "undefined") return;
  enabled = localStorage.getItem("atlas-sound") !== "off";
}
export const soundOn = () => enabled;
export function setSound(on: boolean) {
  enabled = on;
  localStorage.setItem("atlas-sound", on ? "on" : "off");
  if (on) sfx.toggle();
}

function tone(
  freq: number,
  dur: number,
  o: {
    type?: OscillatorType;
    gain?: number;
    at?: number;
    to?: number;
    attack?: number;
  } = {},
) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const peak = o.gain ?? 0.08;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + (o.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur: number, from: number, to: number, gain = 0.05) {
  const c = ac();
  if (!c || !master) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(to, c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
}

const guard =
  (fn: () => void, gap = 0) =>
  () => {
    if (!enabled) return;
    const now = performance.now();
    if (now - last < gap) return;
    last = now;
    fn();
  };

export const sfx = {
  click: guard(() => {
    tone(720, 0.09, { type: "triangle", gain: 0.07, to: 980 });
    tone(1440, 0.06, { type: "sine", gain: 0.025, at: 0.012 });
  }),
  hover: guard(() => tone(1900, 0.03, { type: "sine", gain: 0.012 }), 70),
  open: guard(() => {
    noise(0.28, 500, 2600, 0.04);
    tone(330, 0.2, { type: "sine", gain: 0.04, to: 660 });
  }),
  save: guard(() => {
    tone(784, 0.1, { type: "triangle", gain: 0.07 });
    tone(1175, 0.16, { type: "triangle", gain: 0.06, at: 0.07 });
  }),
  success: guard(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, 0.28, { type: "triangle", gain: 0.06, at: i * 0.075 }),
    );
    tone(2093, 0.5, { type: "sine", gain: 0.015, at: 0.3 });
  }),
  error: guard(() => {
    tone(220, 0.18, { type: "sawtooth", gain: 0.04, to: 150 });
    tone(180, 0.22, { type: "sawtooth", gain: 0.035, at: 0.1, to: 110 });
  }),
  send: guard(() => {
    noise(0.18, 900, 3200, 0.03);
    tone(520, 0.12, { type: "sine", gain: 0.05, to: 880 });
  }),
  receive: guard(() => {
    tone(880, 0.12, { type: "sine", gain: 0.05 });
    tone(1320, 0.18, { type: "sine", gain: 0.04, at: 0.09 });
  }),
  toggle: guard(() => {
    tone(660, 0.07, { type: "square", gain: 0.025 });
    tone(990, 0.09, { type: "square", gain: 0.025, at: 0.06 });
  }),
  tick: guard(() => tone(1100, 0.04, { type: "triangle", gain: 0.035 }), 40),
};
export type Sfx = keyof typeof sfx;
