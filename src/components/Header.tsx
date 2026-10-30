"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditsBadge } from "./CreditsBadge";
import { Ruler } from "./Ruler";

const LINKS = [
  ["Home", "/"],
  ["How it works", "/#how"],
  ["Testing", "/#proof"],
  ["Build", "/build"],
  ["Your agents", "/#agents"],
] as const;

/** Where the orange marker sits on the ruler for each part of the app (decorative). */
function band(pathname: string): { hz: number; title: string } {
  if (pathname.startsWith("/studio")) return { hz: 2000, title: "STUDIO" };
  if (pathname.startsWith("/build")) return { hz: 1000, title: "BUILD" };
  if (pathname.startsWith("/a/")) return { hz: 4000, title: "TEST PAGE" };
  return { hz: 63, title: "HOME" };
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const [section, setSection] = useState<{ hz: number; title: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // On the landing page the marker follows the section in the middle of the screen.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // At the very bottom the last section may be too short to reach the middle line: pin the last band.
      if (pathname === "/" && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 4) {
        const all = document.querySelectorAll<HTMLElement>("[data-band]");
        const last = all[all.length - 1];
        if (last) setSection({ hz: Number(last.dataset.band), title: (last.dataset.title ?? "").toUpperCase() });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    let io: IntersectionObserver | undefined;
    if (pathname === "/") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            setSection({ hz: Number(el.dataset.band), title: (el.dataset.title ?? "").toUpperCase() });
          }
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      document.querySelectorAll<HTMLElement>("[data-band]").forEach((el) => io!.observe(el));
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, [pathname]);

  const { hz, title } = pathname === "/" && section ? section : band(pathname);
  return (
    <header className={`site-header z-40 ${scrolled ? "scrolled" : ""}`}>
      <div className="wrap pb-1 pt-3">
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
        <div className="mt-2">
          <div className="label flex justify-between text-[9px] text-mute" aria-hidden>
            <span className="transition-opacity">{title}</span>
            <span>{hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`} band</span>
          </div>
          <Ruler marker={hz} />
        </div>
      </div>
    </header>
  );
}
