import Link from "next/link";
import { CreditsBadge } from "./CreditsBadge";

const TICKS = ["20", "50", "100", "200", "500", "1k", "2k", "5k", "10k", "20k"];

export function Header() {
  return (
    <header className="mb-10">
      <div className="rule-b mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-head text-2xl font-semibold tracking-tight">
          Vani<span className="text-signal">Forge</span>
        </Link>
        <CreditsBadge />
      </div>
      <div className="mx-auto hidden max-w-6xl px-5 pt-2 sm:block" aria-hidden>
        <div className="relative h-4 border-b-[1.5px] border-ink/60">
          <div className="absolute inset-x-0 bottom-0 flex justify-between">
            {Array.from({ length: 61 }).map((_, i) => (
              <span key={i} className={`w-px bg-ink/60 ${i % 6 === 0 ? "h-3" : "h-1.5"}`} />
            ))}
          </div>
        </div>
        <div className="label mt-1 flex justify-between text-[9px] text-mute">
          {TICKS.map((t) => (
            <span key={t}>{t} Hz</span>
          ))}
        </div>
      </div>
    </header>
  );
}
