"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditsBadge } from "./CreditsBadge";
import { Ruler } from "./Ruler";

const LINKS = [
  ["Home", "/"],
  ["How it works", "/#how"],
  ["Testing", "/#proof"],
  ["Your agents", "/#agents"],
] as const;

/** Where the orange marker sits on the ruler for each part of the app (decorative). */
function band(pathname: string): { hz: number; title: string } {
  if (pathname.startsWith("/studio")) return { hz: 500, title: "STUDIO" };
  if (pathname.startsWith("/a/")) return { hz: 1000, title: "TEST PAGE" };
  return { hz: 63, title: "HOME" };
}

export function Header() {
  const { hz, title } = band(usePathname() ?? "/");
  return (
    <header className="relative z-20">
      <div className="wrap pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Link href="/" className="label flex items-baseline gap-2 !text-[11px]" aria-label="VaniForge home">
            <span className="font-bold tracking-[0.08em]">VaniForge</span>
            <span className="text-mute">VF-01 / Short Circuit</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {LINKS.map(([label, href]) => (
              <Link key={label} href={href} className="label text-mute underline-offset-8 hover:text-ink hover:underline">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex w-full items-center justify-between gap-3 md:w-auto">
            <CreditsBadge />
            <Link href="/#agents" className="btn whitespace-nowrap !px-3 !py-2 !text-[10.5px] sm:!px-4 sm:!text-[12px]">
              Open studio <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
        <div className="mt-3">
          <div className="label flex justify-between text-[9px] text-mute" aria-hidden>
            <span>{title}</span>
            <span>{hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`} band</span>
          </div>
          <Ruler marker={hz} />
        </div>
      </div>
    </header>
  );
}
