import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-8 border-t-[1.5px] border-ink">
      <div className="wrap flex flex-wrap items-start justify-between gap-6 py-8">
        <p className="label flex items-baseline gap-2">
          <span className="font-bold tracking-[0.08em]">VaniForge</span>
          <span className="text-mute">VF-01 / Short Circuit</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          {[
            ["How it works", "/#how"],
            ["Testing", "/#proof"],
            ["Your agents", "/#agents"],
          ].map(([l, h]) => (
            <Link key={l} href={h} className="label text-mute underline-offset-8 hover:text-ink hover:underline">{l}</Link>
          ))}
        </nav>
        <p className="max-w-sm text-sm text-mute">
          A prototype for Build Arena 2026. Every agent says it is an AI assistant, and only made-up data belongs in it.
        </p>
      </div>
    </footer>
  );
}
