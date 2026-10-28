import Image from "next/image";
import { BuildButton } from "./BuildButton";

const SPEC = [
  ["For", "Clinics, shops and studios"],
  ["Languages", "Hindi · English · Hinglish"],
  ["Built on", "ElevenLabs agents, voices and speech-to-text"],
  ["Team", "Short Circuit"],
] as const;

function Screw({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={`absolute h-3 w-3 ${className}`}>
      <circle cx="6" cy="6" r="5" fill="#2a2a2a" stroke="#5a5955" strokeWidth="0.8" />
      <path d="M3.2 8.8L8.8 3.2" stroke="#8a8984" strokeWidth="0.9" />
    </svg>
  );
}

/** Title-slide layout from the deck: giant wordmark and spec table on the left, the Chladni plate figure on the right. */
export function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="pb-16 pt-8">
      <div className="wrap grid items-start gap-12 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
        <div>
          <p className="label anim-fade text-ink">VF-01 &nbsp;/&nbsp; No-code voice AI agent builder</p>
          <h1 id="hero-title" className="anim-fade-2 mt-6 text-[clamp(4rem,12.4vw,10.5rem)] !leading-[0.82] !tracking-[-0.06em]">
            VaniForge<span className="text-signal">.</span>
          </h1>
          <p className="anim-fade-3 mt-8 max-w-xl text-[clamp(1.25rem,2.1vw,1.75rem)] font-medium leading-[1.25] tracking-[-0.01em]">
            Give your business a voice. Describe an agent in plain words, break it with difficult callers, and fix it before your customers hear it.
          </p>
          <dl className="anim-fade-3 mt-10 max-w-xl">
            {SPEC.map(([k, v]) => (
              <div key={k} className="spec-row">
                <dt className="label text-mute">{k}</dt>
                <dd className="text-[17px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-9">
            <BuildButton className="btn btn-primary !px-7 !py-4">Build your agent <span aria-hidden>→</span></BuildButton>
          </div>
        </div>

        <figure className="anim-fade-2">
          <div className="panel-dark relative aspect-square overflow-hidden">
            <Image
              src="/hero/plate-5-3.png"
              alt="A Chladni figure: sand collected along the still lines of a vibrating square plate, rendered from the plate equation"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 92vw"
              className="object-cover"
            />
            <Screw className="left-2 top-2" />
            <Screw className="right-2 top-2" />
            <Screw className="bottom-2 left-2" />
            <Screw className="bottom-2 right-2" />
            <div className="label absolute inset-x-5 bottom-3 flex justify-between gap-2 whitespace-nowrap !text-[8.5px] !tracking-[0.08em] text-paper/80">
              <span>Fig. 01 &nbsp; Chladni figure · mode (5,3) · square plate</span>
              <span className="text-signal">● Excited</span>
            </div>
          </div>
          <figcaption className="mt-4 text-sm leading-relaxed text-mute">
            Sand settles where a vibrating plate stops moving. VaniForge does the same to a voice agent: excite it with chaos callers, find the nodes where it breaks, patch them. Image rendered from the plate equation.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
