import { AgentList } from "@/components/write/AgentList";
import { Hero } from "@/components/Hero";
import { WriteFlow } from "@/components/write/WriteFlow";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="start" className="wrap scroll-mt-6 py-16">
        <WriteFlow />
      </section>
      <section id="agents" className="wrap scroll-mt-6 pb-20">
        <AgentList />
      </section>
    </>
  );
}
