import type { ReactNode } from "react";

export function SectionNumber({ n }: { n: string }) {
  return <span className="font-display text-5xl font-medium leading-none text-plum">{n}</span>;
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`inline-block ${className}`}>
      <path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A terracotta dot: the shape that marks a problem (text stays plum or problem-ink for contrast). */
export function ProblemDot() {
  return <span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-terracotta align-middle" />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "keys"; children: ReactNode }) {
  const style =
    tone === "error"
      ? "border-terracotta bg-shell"
      : tone === "keys"
        ? "border-plum bg-shell"
        : "border-plum/40 bg-blush";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-card border-[1.5px] px-5 py-3.5 text-[15px] ${style}`}>
      {tone === "error" && <ProblemDot />}
      {tone === "keys" && <span className="label mr-3 font-semibold">Add your keys</span>}
      {children}
    </div>
  );
}

export function XRay({ title = "X-Ray", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="panel-dark group">
      <summary className="label cursor-pointer select-none px-5 py-3.5 text-blush/80">
        {title} <span className="text-blush/60">(technical detail)</span>
      </summary>
      <div className="max-h-80 overflow-auto px-5 pb-5 font-mono text-xs leading-relaxed text-blush/90">{children}</div>
    </details>
  );
}

/**
 * Concentric terracotta and mauve rings, 1px lines, no glow. `level` (0..1) is the real output
 * audio level from the call; at 0 the rings sit still.
 */
export function Rings({ level = 0, active = false }: { level?: number; active?: boolean }) {
  const l = active ? Math.min(1, Math.max(0, level)) : 0;
  return (
    <svg viewBox="-100 -100 200 200" className="mx-auto h-44 w-44" role="img" aria-label={active ? "Call audio level" : "No call in progress"}>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          r={22 + i * 15}
          fill="none"
          strokeWidth="1"
          stroke={i % 2 === 0 ? "#c75a3a" : "#c9a0a7"}
          style={{ transform: `scale(${1 + l * 0.22 * (i + 1) * 0.35})`, transition: "transform 140ms linear", transformOrigin: "center" }}
        />
      ))}
      <circle r={9 + l * 8} fill="#c75a3a" style={{ transition: "r 140ms linear" }} />
    </svg>
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
