import { ElevenInside } from "@/components/ElevenInside";
import { Footer } from "@/components/Footer";
import { HashScroll } from "@/components/HashScroll";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Pipeline } from "@/components/Pipeline";
import { Proof } from "@/components/Proof";
import { SectionNumber } from "@/components/ui";
import { AgentList } from "@/components/write/AgentList";
import Link from "next/link";

const BUILD_STEPS = [
  ["01", "Describe it", "Type or speak your brief, in English, Hindi or both."],
  ["02", "Check the promises", "What it always does, never does, and when it hands over."],
  ["03", "Pick a voice", "Preview a few, choose one, and the agent goes live."],
] as const;

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Pipeline />
      <Proof />
      <ElevenInside />
      <section id="start" data-band="2000" data-title="Build" aria-labelledby="start-title" className="wrap scroll-mt-28 py-20">
        <div className="reveal mb-10 flex flex-wrap items-start gap-x-8 gap-y-3">
          <SectionNumber n="05" />
          <div className="max-w-3xl pt-1">
            <h2 id="start-title" className="text-[clamp(2rem,4.6vw,4rem)]">Now build yours.</h2>
            <p className="mt-3 text-[17px] text-mute">
              <strong className="font-semibold text-ink">Takes about a minute:</strong> write or speak the brief, check the promises, pick a voice. The agent is created on ElevenLabs and opens in the studio.
            </p>
          </div>
        </div>
        <div className="reveal panel-dark on-dark grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <ol className="grid gap-5 sm:grid-cols-3" aria-label="What the builder asks for">
            {BUILD_STEPS.map(([n, title, body]) => (
              <li key={n} className="border-t border-paper/20 pt-4">
                <span className="font-display text-3xl font-extrabold leading-none tracking-[-0.04em] text-signal">{n}</span>
                <span className="mt-3 block font-semibold text-paper">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-paper/70">{body}</span>
              </li>
            ))}
          </ol>
          <Link href="/build" className="btn btn-primary justify-self-start !px-7 !py-4">
            Open the builder <span aria-hidden className="arrow">→</span>
          </Link>
        </div>
      </section>
      <section id="agents" data-band="4000" data-title="Your agents" aria-labelledby="agents-title" className="wrap scroll-mt-28 py-20">
        <AgentList />
      </section>
      <Footer />
      <HashScroll />
    </>
  );
}
