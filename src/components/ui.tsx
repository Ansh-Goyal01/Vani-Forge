import type { ReactNode } from "react";

export function SectionNumber({ n }: { n: string }) {
  return <span className="font-head text-5xl font-semibold leading-none text-signal">{n}</span>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "keys"; children: ReactNode }) {
  const style =
    tone === "error"
      ? "border-signal bg-signal/10"
      : tone === "keys"
        ? "border-ink bg-paper"
        : "border-ink/40 bg-paper";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-sq border-[1.5px] px-4 py-3 text-sm ${style}`}>
      {tone === "keys" && <span className="label mr-2 text-signal">Add your keys</span>}
      {children}
    </div>
  );
}

export function XRay({ title = "X-Ray", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="panel-dark group">
      <summary className="label cursor-pointer select-none px-4 py-3 text-alu/80">
        {title} <span className="text-alu/40">(technical detail)</span>
      </summary>
      <div className="max-h-80 overflow-auto px-4 pb-4 font-mono text-xs leading-relaxed text-alu/90">{children}</div>
    </details>
  );
}

export function Waveform({ active, getLevel }: { active: boolean; getLevel?: () => number }) {
  void getLevel;
  return (
    <div className="flex h-10 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="w-[4px] origin-bottom bg-signal"
          style={{
            height: "100%",
            transform: active ? undefined : "scaleY(0.15)",
            animation: active ? `bar ${0.5 + ((i * 37) % 7) / 10}s ease-in-out ${(i % 5) * 0.07}s infinite` : "none",
          }}
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
