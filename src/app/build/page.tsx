import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { FocusOnMount } from "@/components/FocusOnMount";
import { RecentAgents } from "@/components/write/RecentAgents";
import { WriteFlow } from "@/components/write/WriteFlow";

export const metadata: Metadata = { title: "Build your agent · VaniForge" };

const FLOW = [
  ["01", "Brief", "Type or speak what the agent should do, in English, Hindi or both."],
  ["02", "Promises", "Check what it must always do, must never do, and when it hands the call to you."],
  ["03", "Voice", "Pick a voice that suits your business. Play a preview before you choose."],
  ["04", "Studio", "The agent is created on ElevenLabs and opens ready to test, break and fix."],
] as const;

const NOTES = [
  "Takes about a minute.",
  "Every agent says it is an AI assistant in its first line.",
  "Use made-up names and numbers: the free AI service may learn from what you type.",
];

/** The builder: one job on this page, turning a brief into a live agent. */
export default function BuildPage() {
  return (
    <>
      <div className="wrap pb-24 pt-8">
        <nav aria-label="Breadcrumb" className="anim-fade label flex items-center gap-2 text-mute">
          <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">Home</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" className="text-ink">Build</span>
        </nav>

        <header className="anim-fade-2 mt-6 max-w-4xl">
          <p className="label text-problem">New agent</p>
          <h1 className="mt-2 text-[clamp(2.75rem,6.4vw,5.5rem)] leading-[0.95]">
            Build your agent<span className="text-signal">.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] text-mute">
            Describe your business the way you would brief a new receptionist. VaniForge turns it into a voice agent with clear promises, then opens it in the studio so you can test it before any customer hears it.
          </p>
        </header>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
          <div className="min-w-0">
            <WriteFlow />
          </div>

          <aside aria-label="About the builder" className="anim-fade-3 space-y-5">
            <div className="panel-dark on-dark p-6">
              <p className="label text-signal">From brief to live agent</p>
              <ol className="mt-5 space-y-5">
                {FLOW.map(([n, title, body]) => (
                  <li key={n} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2">
                    <span className="font-display text-2xl font-extrabold leading-none tracking-[-0.04em] text-signal">{n}</span>
                    <span>
                      <span className="block font-semibold text-paper">{title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-paper/70">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <ul className="mt-6 space-y-2 border-t border-paper/15 pt-5">
                {NOTES.map((n) => (
                  <li key={n} className="flex gap-2.5 text-sm text-paper/80">
                    <span aria-hidden className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <RecentAgents />
          </aside>
        </div>
      </div>
      <Footer />
      <FocusOnMount id="brief" />
    </>
  );
}
