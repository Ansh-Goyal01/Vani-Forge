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
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 lg:px-8">
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
        <div className="flex w-full items-center justify-between gap-3 md:w-auto">
          <CreditsBadge />
          <Link href="/#agents" className="btn whitespace-nowrap !py-2 !px-4">
            Open studio <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
