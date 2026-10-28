import Link from "next/link";
import { Asterisk } from "./art";
import { CreditsBadge } from "./CreditsBadge";

const LINKS = [
  ["Home", "/"],
  ["How it works", "/#how"],
  ["Testing", "/#proof"],
  ["Your agents", "/#agents"],
] as const;

export function Header() {
  return (
    <header className="relative z-20">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
        <Link href="/" className="label flex items-center gap-2.5 !tracking-[0.28em]" aria-label="VaniForge home">
          <Asterisk />
          VaniForge
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {LINKS.map(([label, href]) => (
            <Link key={label} href={href} className="label hover:underline underline-offset-8">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <CreditsBadge />
          <Link href="/#agents" className="btn !py-2 !px-4">
            Open studio <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
