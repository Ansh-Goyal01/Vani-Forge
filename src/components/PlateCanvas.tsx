"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MODES, step, type Mode } from "@/lib/plate";

const SAND = "rgba(214, 211, 200, 0.82)";
const GRAPHITE = "#181818";

/**
 * Live Chladni figure. Sand starts scattered and settles onto the nodal lines of the current mode,
 * the way VaniForge excites an agent and finds where it breaks. Pauses off-screen and once settled.
 * With reduced motion it computes the settled state and draws it once.
 */
export function PlateCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pts = useRef<Float32Array | null>(null);
  const frame = useRef<number | null>(null);
  const visible = useRef(true);
  const [modeIndex, setModeIndex] = useState(0);
  // The mode index that has finished settling; `settled` is derived so the effect never sets state synchronously.
  const [settledMode, setSettledMode] = useState<number | null>(null);
  const settled = settledMode === modeIndex;
  const mode: Mode = MODES[modeIndex];

  const draw = useCallback(() => {
    const c = canvas.current;
    const p = pts.current;
    if (!c || !p) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    ctx.fillStyle = GRAPHITE;
    ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = SAND;
    const s = Math.max(1, w / 520);
    for (let i = 0; i < p.length; i += 2) ctx.fillRect(p[i] * w, p[i + 1] * w, s, s);
  }, []);

  // Size the canvas to its box at device pixel ratio.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const resize = () => {
      const px = Math.round(c.clientWidth * Math.min(2, window.devicePixelRatio || 1));
      if (px && c.width !== px) {
        c.width = px;
        c.height = px;
        draw();
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(c);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [draw]);

  // Run the sand for the current mode.
  useEffect(() => {
    const count = window.innerWidth < 640 ? 9000 : 16000;
    if (!pts.current || pts.current.length !== count * 2) {
      pts.current = new Float32Array(count * 2);
      for (let i = 0; i < pts.current.length; i++) pts.current[i] = Math.random();
    }
    // Re-exciting: give every grain a kick so the new mode visibly reorganises the sand.
    else for (let i = 0; i < pts.current.length; i++) pts.current[i] = Math.min(1, Math.max(0, pts.current[i] + (Math.random() - 0.5) * 0.12));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const p = pts.current;
      frame.current = requestAnimationFrame(() => {
        for (let k = 0; k < 260; k++) step(p, mode, 0.05 * (1 - k / 300));
        draw();
        setSettledMode(modeIndex);
      });
      return () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      };
    }
    let t = 0;
    const tick = () => {
      if (visible.current) {
        const strength = 0.06 * Math.max(0.12, 1 - t / 220);
        for (let k = 0; k < 2; k++) step(pts.current!, mode, strength);
        draw();
        t++;
      }
      if (t < 260) frame.current = requestAnimationFrame(tick);
      else setSettledMode(modeIndex);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [mode, modeIndex, draw]);

  return (
    <>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="absolute inset-x-8 bottom-3.5 flex items-end justify-between gap-3">
        <span className="label whitespace-nowrap !text-[8.5px] !tracking-[0.08em] text-paper/80">
          Fig. 01 &nbsp; Chladni plate · mode ({mode[0]},{mode[1]})
        </span>
        <span className={`label whitespace-nowrap !text-[8.5px] ${settled ? "text-paper/70" : "text-signal"}`} aria-live="polite">
          <span className={settled ? "" : "live-dot"}>●</span> {settled ? "Settled" : "Excited"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setModeIndex((i) => (i + 1) % MODES.length)}
        className="label absolute right-7 top-5 rounded-card border border-paper/40 bg-graphite/70 px-2.5 py-1.5 !text-[9px] text-paper transition-colors hover:border-signal hover:text-signal"
      >
        Excite next mode <span aria-hidden>↻</span>
      </button>
    </>
  );
}
