"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type Variant = "neural" | "atom" | "globe" | "helix";

function sprite(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.7)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Scene3D({
  variant = "neural",
  color = "#8b5cf6",
  color2 = "#22d3ee",
  className = "",
  intensity = 1,
}: {
  variant?: Variant;
  color?: string;
  color2?: string;
  className?: string;
  intensity?: number;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    const root = new THREE.Group();
    scene.add(root);
    const tex = sprite();
    const c1 = new THREE.Color(color);
    const c2 = new THREE.Color(color2);
    const disposables: { dispose: () => void }[] = [tex];
    const tickers: ((t: number, dt: number) => void)[] = [];

    const mkPoints = (
      pos: Float32Array,
      size: number,
      col: THREE.Color,
      opacity = 1,
    ) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({
        size,
        map: tex,
        color: col,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      disposables.push(g, m);
      return new THREE.Points(g, m);
    };
    const lineMat = (col: THREE.Color, opacity: number) => {
      const m = new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      disposables.push(m);
      return m;
    };

    if (variant === "neural") {
      const N = 78;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < N; i++) {
        const r = i < 50 ? 2.5 : rand(0.6, 2.2);
        const u = Math.random() * 2 - 1;
        const th = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        pts.push(
          new THREE.Vector3(r * s * Math.cos(th), r * u, r * s * Math.sin(th)),
        );
      }
      const pos = new Float32Array(N * 3);
      pts.forEach((p, i) => p.toArray(pos, i * 3));
      root.add(mkPoints(pos, 0.2, c1));
      const edges: [number, number][] = [];
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++)
          if (pts[i].distanceTo(pts[j]) < 1.45) edges.push([i, j]);
      const lp = new Float32Array(edges.length * 6);
      edges.forEach(([a, b], i) => {
        pts[a].toArray(lp, i * 6);
        pts[b].toArray(lp, i * 6 + 3);
      });
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
      disposables.push(lg);
      root.add(new THREE.LineSegments(lg, lineMat(c2, 0.22 * intensity)));
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.55, 1),
        new THREE.MeshBasicMaterial({
          color: c1,
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        }),
      );
      disposables.push(core.geometry, core.material as THREE.Material);
      root.add(core);
      const P = 16;
      const sig = Array.from({ length: P }, () => ({
        e: edges[Math.floor(Math.random() * edges.length)] ?? [0, 1],
        t: Math.random(),
        v: rand(0.25, 0.7),
      }));
      const sp = new Float32Array(P * 3);
      const sPts = mkPoints(sp, 0.32, new THREE.Color("#ffffff"), 0.95);
      root.add(sPts);
      tickers.push((_, dt) => {
        sig.forEach((s, i) => {
          s.t += dt * s.v;
          if (s.t >= 1) {
            const from = s.e[1];
            const next = edges.filter((e) => e[0] === from || e[1] === from);
            const e =
              next[Math.floor(Math.random() * next.length)] ??
              edges[Math.floor(Math.random() * edges.length)];
            s.e = e[0] === from ? e : [e[1], e[0]];
            s.t = 0;
          }
          const a = pts[s.e[0]];
          const b = pts[s.e[1]];
          sp[i * 3] = a.x + (b.x - a.x) * s.t;
          sp[i * 3 + 1] = a.y + (b.y - a.y) * s.t;
          sp[i * 3 + 2] = a.z + (b.z - a.z) * s.t;
        });
        sPts.geometry.attributes.position.needsUpdate = true;
        core.rotation.y += dt * 0.6;
        core.rotation.x += dt * 0.3;
      });
    } else if (variant === "atom") {
      const nuc = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7, 2),
        new THREE.MeshBasicMaterial({
          color: c1,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
        }),
      );
      disposables.push(nuc.geometry, nuc.material as THREE.Material);
      root.add(nuc);
      root.add(mkPoints(new Float32Array([0, 0, 0]), 2.2, c1, 0.7));
      const electrons: {
        ring: THREE.Group;
        pts: THREE.Points;
        a: number;
        s: number;
        rx: number;
        ry: number;
      }[] = [];
      [0, 1, 2, 3].forEach((i) => {
        const ring = new THREE.Group();
        const rx = 3 + i * 0.35;
        const ry = 1.15 + i * 0.25;
        const pp: number[] = [];
        for (let k = 0; k <= 128; k++)
          pp.push(
            Math.cos((k / 128) * Math.PI * 2) * rx,
            Math.sin((k / 128) * Math.PI * 2) * ry,
            0,
          );
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3));
        disposables.push(g);
        ring.add(new THREE.Line(g, lineMat(i % 2 ? c1 : c2, 0.35 * intensity)));
        const e = mkPoints(new Float32Array(3), 0.5, new THREE.Color("#fff"));
        ring.add(e);
        ring.rotation.set(rand(0, 3), rand(0, 3), (i * Math.PI) / 4);
        root.add(ring);
        electrons.push({
          ring,
          pts: e,
          a: rand(0, 6),
          s: rand(0.8, 1.6),
          rx,
          ry,
        });
      });
      tickers.push((_, dt) => {
        nuc.rotation.y += dt * 0.8;
        nuc.rotation.x += dt * 0.4;
        electrons.forEach((e) => {
          e.a += dt * e.s;
          const p = e.pts.geometry.attributes.position as THREE.BufferAttribute;
          p.setXYZ(0, Math.cos(e.a) * e.rx, Math.sin(e.a) * e.ry, 0);
          p.needsUpdate = true;
          e.ring.rotation.z += dt * 0.05;
        });
      });
    } else if (variant === "globe") {
      const R = 2.6;
      const sph = new THREE.Mesh(
        new THREE.SphereGeometry(R, 28, 20),
        new THREE.MeshBasicMaterial({
          color: c2,
          wireframe: true,
          transparent: true,
          opacity: 0.1 * intensity,
        }),
      );
      disposables.push(sph.geometry, sph.material as THREE.Material);
      root.add(sph);
      const N = 1100;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = i * 2.399963;
        pos[i * 3] = Math.cos(th) * r * R;
        pos[i * 3 + 1] = y * R;
        pos[i * 3 + 2] = Math.sin(th) * r * R;
      }
      root.add(mkPoints(pos, 0.07, c1, 0.9));
      const arcs: THREE.QuadraticBezierCurve3[] = [];
      const randPt = () => {
        const u = Math.random() * 2 - 1;
        const th = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        return new THREE.Vector3(
          s * Math.cos(th),
          u,
          s * Math.sin(th),
        ).multiplyScalar(R);
      };
      for (let i = 0; i < 9; i++) {
        const a = randPt();
        const b = randPt();
        const mid = a
          .clone()
          .add(b)
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(R * (1.35 + a.distanceTo(b) * 0.08));
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        arcs.push(curve);
        const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
        disposables.push(g);
        root.add(new THREE.Line(g, lineMat(c1, 0.55 * intensity)));
      }
      const dp = new Float32Array(arcs.length * 3);
      const dots = mkPoints(dp, 0.28, new THREE.Color("#fff"));
      root.add(dots);
      const ph = arcs.map(() => Math.random());
      tickers.push((_, dt) => {
        arcs.forEach((c, i) => {
          ph[i] = (ph[i] + dt * 0.25) % 1;
          c.getPoint(ph[i], new THREE.Vector3()).toArray(dp, i * 3);
        });
        dots.geometry.attributes.position.needsUpdate = true;
        root.rotation.y += dt * 0.12;
      });
      root.rotation.z = 0.35;
    } else {
      const N = 46;
      const a = new Float32Array(N * 3);
      const b = new Float32Array(N * 3);
      const rungs: number[] = [];
      for (let i = 0; i < N; i++) {
        const t = (i / (N - 1) - 0.5) * 7.4;
        const ang = t * 1.5;
        const r = 1.15;
        a.set([Math.cos(ang) * r, t, Math.sin(ang) * r], i * 3);
        b.set(
          [Math.cos(ang + Math.PI) * r, t, Math.sin(ang + Math.PI) * r],
          i * 3,
        );
        if (i % 2 === 0)
          rungs.push(a[i * 3], t, a[i * 3 + 2], b[i * 3], t, b[i * 3 + 2]);
      }
      root.add(mkPoints(a, 0.32, c1), mkPoints(b, 0.32, c2));
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(rungs, 3));
      disposables.push(g);
      root.add(
        new THREE.LineSegments(
          g,
          lineMat(new THREE.Color("#fff"), 0.18 * intensity),
        ),
      );
      root.rotation.z = 0.5;
      tickers.push((_, dt) => (root.rotation.y += dt * 0.5));
    }

    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 1 ? 11 : 8;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) {
        if (variant !== "globe") root.rotation.y += dt * 0.12;
        tickers.forEach((f) => f(now / 1000, dt));
      }
      root.rotation.x += (my * 0.35 - root.rotation.x) * 0.04;
      camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant, color, color2, intensity]);

  return <div ref={host} className={className} aria-hidden />;
}
