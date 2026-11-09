"use client";
import { useRef, type CSSProperties, type ReactNode } from "react";

// Premium 3D tilt + cursor-follow glow. Pure CSS variables, no re-renders.
export default function Tilt({
  children,
  color = "#8b5cf6",
  className = "",
  max = 5,
  style,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`tilt glass ${className}`}
      style={{ ["--c" as string]: color, ...style }}
    >
      {children}
    </div>
  );
}
