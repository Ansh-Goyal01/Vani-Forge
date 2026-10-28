"use client";

/** Smooth-scrolls to the brief section and focuses the text box. Falls back to the #start anchor. */
export function BuildButton({ className = "btn btn-primary", children }: { className?: string; children: React.ReactNode }) {
  return (
    <a
      href="#start"
      className={className}
      onClick={(e) => {
        const target = document.getElementById("start");
        if (!target) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        window.setTimeout(() => document.getElementById("brief")?.focus({ preventScroll: true }), reduce ? 0 : 600);
      }}
    >
      {children}
    </a>
  );
}
