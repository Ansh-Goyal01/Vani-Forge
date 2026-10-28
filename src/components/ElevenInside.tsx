import { SectionNumber } from "./ui";

/** Every ElevenLabs capability the code uses, and where. Mirrors the README table. */
const ROWS: [string, string, string][] = [
  ["Agents API", "Write, Refine, Heal", "creates and updates the agent on every new VoiceIR version"],
  ["Agent config", "compile.ts", "prompt, first message, languages, Hinglish, TTS model, built-in tools"],
  ["Evaluation criteria", "compile.ts → Observe", "every promise becomes a criterion, so every real call is scored on it"],
  ["Scribe v2", "Write", "turns the owner's spoken brief into text"],
  ["Voices", "Write, Chaos", "voice picker with previews; stock voices for the test callers"],
  ["Pronunciation dictionary", "compile.ts", "alias rules so names like Bhatnagar are said right"],
  ["Signed URL + React SDK", "Test", "live browser call with transcript, latency and interruptions"],
  ["Agent tests (simulation)", "Chaos · text tier", "each caller against each promise, three times"],
  ["Text to speech", "Chaos · audio tier", "caller lines as 16 kHz audio, generated once and cached"],
  ["Agent WebSocket", "Chaos · audio tier", "streams that audio in real time; records what the agent heard"],
  ["Turn + ASR settings", "Heal", "words that should not interrupt, words to listen for"],
  ["Conversations + analysis", "Observe", "call list, transcript, summary and per-promise result"],
  ["Widget", "Deploy", "shareable test page and a copy-paste embed snippet"],
  ["Subscription", "Header", "credit balance and the guard that protects the demo reserve"],
];

export function ElevenInside() {
  return (
    <section id="eleven" data-band="1000" data-title="ElevenLabs inside" aria-labelledby="eleven-title" className="scroll-mt-28 py-20">
      <div className="wrap">
        <div className="reveal flex flex-wrap items-start gap-x-8 gap-y-3">
          <SectionNumber n="04" />
          <div className="max-w-4xl pt-1">
            <h2 id="eleven-title" className="text-[clamp(2rem,4.6vw,4rem)]">
              {ROWS.length} ElevenLabs capabilities, each with a job.
            </h2>
            <p className="mt-3 text-[17px] text-mute">
              <strong className="font-semibold text-ink">Where it runs:</strong> ElevenLabs is the voice and agent layer for every step, from the first spoken brief to the last scored call.
            </p>
          </div>
        </div>

        <div className="reveal mt-12 overflow-hidden rounded-card border-[1.5px] border-ink bg-card" style={{ "--d": 1 } as React.CSSProperties}>
          <div className="label hidden grid-cols-[1.1fr_0.9fr_2fr] gap-6 border-b-[1.5px] border-ink px-5 py-3 font-bold text-problem md:grid">
            <span>Capability</span>
            <span>Where</span>
            <span>Job in VaniForge</span>
          </div>
          <ul>
            {ROWS.map(([cap, where, job], i) => (
              <li
                key={cap}
                className="reveal grid gap-1 border-b border-ink/15 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-paper md:grid-cols-[1.1fr_0.9fr_2fr] md:gap-6"
                style={{ "--d": Math.min(i, 8) } as React.CSSProperties}
              >
                <span className="font-semibold">{cap}</span>
                <span className="label self-center text-mute">{where}</span>
                <span className="text-[15px]">{job}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
