import { ElevenInside } from "@/components/ElevenInside";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Pipeline } from "@/components/Pipeline";
import { Proof } from "@/components/Proof";
import { SectionNumber } from "@/components/ui";
import { AgentList } from "@/components/write/AgentList";
import { WriteFlow } from "@/components/write/WriteFlow";

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
        <WriteFlow />
      </section>
      <section id="agents" data-band="4000" data-title="Your agents" aria-labelledby="agents-title" className="wrap scroll-mt-28 py-20">
        <AgentList />
      </section>
      <Footer />
    </>
  );
}
