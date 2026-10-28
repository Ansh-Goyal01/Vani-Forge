import type { ReactNode } from "react";

/** Big orange numeral, as in the deck's section headers. Decorative: the heading beside it carries the meaning. */
export function SectionNumber({ n }: { n: string }) {
  return <span aria-hidden className="font-display text-[clamp(3.5rem,7vw,6.5rem)] font-extrabold leading-[0.85] tracking-[-0.05em] text-signal">{n}</span>;
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`inline-block ${className}`}>
      <path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

/** A signal-orange dot: the shape that marks a problem (the words stay ink or problem-ink for contrast). */
export function ProblemDot() {
  return <span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-signal align-middle" />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "keys"; children: ReactNode }) {
  const style = tone === "error" ? "border-signal bg-card" : "border-ink bg-card";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-card border-[1.5px] px-4 py-3 text-[15px] ${style}`}>
      {tone === "error" && <ProblemDot />}
      {tone === "keys" && <span className="label mr-3 font-semibold text-problem">Add your keys</span>}
      {children}
    </div>
  );
}

export function XRay({ title = "X-Ray", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="panel-dark group">
      <summary className="label cursor-pointer select-none px-4 py-3 text-signal">
        {title} <span className="text-paper/60">(technical detail)</span>
      </summary>
      <div className="max-h-80 overflow-auto px-4 pb-4 font-mono text-xs leading-relaxed text-paper/90">{children}</div>
    </details>
  );
}

const BAR_PROFILE = [0.35, 0.6, 0.45, 0.8, 0.55, 0.95, 0.7, 0.5, 0.85, 0.4, 0.75, 1, 0.6, 0.45, 0.9, 0.55, 0.7, 0.4, 0.8, 0.5, 0.65, 0.35, 0.75, 0.5, 0.6, 0.4, 0.55, 0.3];

/**
 * Orange waveform bars on graphite. `level` (0..1) is the real output audio level from the call;
 * with no call the bars rest at a low line. No canned animation.
 */
export function Waveform({ level = 0, active = false }: { level?: number; active?: boolean }) {
  const l = active ? Math.min(1, Math.max(0, level * 1.6)) : 0;
  return (
    <div className="flex h-14 items-end gap-[3px]" role="img" aria-label={active ? "Call audio level" : "No call in progress"}>
      {BAR_PROFILE.map((p, i) => (
        <span
          key={i}
          className="w-[5px] origin-bottom bg-signal"
          style={{ height: "100%", transform: `scaleY(${0.08 + l * p * 0.92})`, transition: "transform 120ms linear" }}
        />
      ))}
    </div>
  );
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("We could not reach the VaniForge server. Is it still running?");
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body;
}
