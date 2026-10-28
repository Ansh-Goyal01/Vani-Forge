import Link from "next/link";
import { Asterisk } from "./art";

export function Footer() {
  return (
    <footer className="mt-10 border-t-[1.5px] border-plum">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-8">
        <p className="label flex items-center gap-2.5 !tracking-[0.28em]">
          <Asterisk /> VaniForge
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          {[
            ["How it works", "/#how"],
            ["Testing", "/#proof"],
            ["Your agents", "/#agents"],
          ].map(([l, h]) => (
            <Link key={l} href={h} className="label underline-offset-8 hover:underline">{l}</Link>
          ))}
        </nav>
        <p className="max-w-sm text-sm text-mute">
          A prototype by Team Short Circuit for Build Arena 2026. Every agent says it is an AI assistant, and only made-up data belongs in it.
        </p>
      </div>
    </footer>
  );
}
