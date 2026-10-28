import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Proof } from "@/components/Proof";
import { AgentList } from "@/components/write/AgentList";
import { WriteFlow } from "@/components/write/WriteFlow";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="start" aria-label="Write your brief" className="wrap scroll-mt-6 py-16">
        <WriteFlow />
      </section>
      <HowItWorks />
      <Proof />
      <section id="agents" aria-labelledby="agents-title" className="wrap scroll-mt-6 py-20">
        <AgentList />
      </section>
      <Footer />
    </>
  );
}
