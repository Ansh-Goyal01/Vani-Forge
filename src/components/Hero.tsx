import Image from "next/image";
import { BuildButton } from "./BuildButton";
import { PlateCanvas } from "./PlateCanvas";

const SPEC = [
  ["For", "Clinics, shops and studios"],
  ["Languages", "Hindi · English · Hinglish"],
  ["Built on", "ElevenLabs agents, voices and speech-to-text"],
  ["Team", "Short Circuit"],
] as const;

const LOOP = [
  ["Describe", "in plain words"],
  ["Break", "with difficult callers"],
  ["Fix", "with one approval"],
] as const;

function Screw({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={`pointer-events-none absolute h-3 w-3 ${className}`}>
      <circle cx="6" cy="6" r="5" fill="#2a2a2a" stroke="#5a5955" strokeWidth="0.8" />
      <path d="M3.2 8.8L8.8 3.2" stroke="#8a8984" strokeWidth="0.9" />
    </svg>
  );
}

/** Title-slide layout from the deck, with a live plate and the product loop in one line. */
export function Hero() {
  const word = "VaniForge";
  return (
    <section id="home" data-band="63" data-title="Home" aria-labelledby="hero-title" className="pb-20 pt-6 lg:pt-10">
      <div className="wrap grid items-start gap-12 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
        <div>
          <p className="label anim-fade text-ink">VF-01 &nbsp;/&nbsp; No-code voice AI agent builder</p>
          <h1 id="hero-title" aria-label="VaniForge" className="mt-6 text-[clamp(3.6rem,10.2vw,9rem)] !leading-[0.86] !tracking-[-0.06em]">
            <span aria-hidden className="whitespace-nowrap">
              {word.split("").map((ch, i) => (
                <span key={i} className="word-mask" style={{ "--i": i } as React.CSSProperties}>
                  <span>{ch}</span>
                </span>
              ))}
              <span className="word-mask" style={{ "--i": word.length + 2 } as React.CSSProperties}>
                <span className="text-signal">.</span>
              </span>
            </span>
          </h1>
          <p className="anim-fade-3 mt-8 max-w-xl text-[clamp(1.35rem,2.3vw,1.95rem)] font-semibold leading-[1.18] tracking-[-0.02em]">
            Voice agents that are tested before they talk to your customers.
          </p>
          <p className="anim-fade-3 mt-4 max-w-xl text-[17px] leading-relaxed text-mute">
            A shop owner describes the receptionist they need, in Hindi or English. VaniForge builds it on ElevenLabs, sends difficult callers at it, explains exactly what broke and fixes it once the owner approves.
          </p>

          <ol className="anim-fade-3 mt-8 flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="How it works in one line">
            {LOOP.map(([k, v], i) => (
              <li key={k} className="flex items-center gap-3">
                <span className="rounded-card border-[1.5px] border-ink bg-card px-2.5 py-1.5 text-[15px]">
                  <span className="label mr-2 font-bold text-problem">0{i + 1}</span>
                  <span className="font-semibold">{k}</span> <span className="text-mute">{v}</span>
                </span>
                {i < LOOP.length - 1 && <span aria-hidden className="hidden font-mono text-mute sm:inline">→</span>}
              </li>
            ))}
          </ol>

          <div className="anim-fade-3 mt-9 flex flex-wrap gap-3">
            <BuildButton className="btn btn-primary !px-7 !py-4">
              Build your agent <span aria-hidden className="arrow">→</span>
            </BuildButton>
            <a href="#loop" className="btn !px-6 !py-4">
              See how it works <span aria-hidden className="arrow">↓</span>
            </a>
          </div>

          <dl className="anim-fade-3 mt-12 max-w-xl">
            {SPEC.map(([k, v]) => (
              <div key={k} className="spec-row">
                <dt className="label text-mute">{k}</dt>
                <dd className="text-[16px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="anim-fade-2 lg:sticky lg:top-32">
          <div className="panel-dark relative aspect-square overflow-hidden">
            {/* Static render underneath: visible before the canvas paints, and without JS. */}
            <Image src="/hero/plate-5-3.png" alt="" fill priority sizes="(min-width: 1024px) 42vw, 92vw" className="object-cover" />
            <PlateCanvas />
            <Screw className="left-2 top-2" />
            <Screw className="right-2 top-2" />
            <Screw className="bottom-2 left-2" />
            <Screw className="bottom-2 right-2" />
          </div>
          <figcaption className="mt-4 text-sm leading-relaxed text-mute">
            <span className="font-semibold text-ink">Live, from the plate equation.</span> Sand settles where a vibrating plate stops moving. VaniForge does the same to a voice agent: excite it with chaos callers, find the nodes where it breaks, patch them.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
