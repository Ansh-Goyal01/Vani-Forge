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

/** A compact "built on" band; the full where-and-why table is one click away for anyone who wants it. */
export function ElevenInside() {
  return (
    <section id="eleven" data-band="1000" data-title="ElevenLabs inside" aria-labelledby="eleven-title" className="scroll-mt-28 py-12">
      <div className="wrap">
        <div className="reveal panel-dark on-dark p-7 sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-12">
            <div>
              <p className="label text-signal">Built on ElevenLabs · {ROWS.length} capabilities</p>
              <h2 id="eleven-title" className="mt-3 text-[clamp(1.6rem,2.6vw,2.25rem)] leading-tight text-paper">
                One voice layer, from the first spoken brief to the last scored call.
              </h2>
            </div>
            <ul className="flex flex-wrap content-start gap-2" aria-label="ElevenLabs capabilities used">
              {ROWS.map(([cap]) => (
                <li key={cap} className="label rounded-card border border-paper/25 px-3 py-2 text-paper/85">
                  {cap}
                </li>
              ))}
            </ul>
          </div>

          <details className="group mt-8 border-t border-paper/15 pt-5">
            <summary className="label flex cursor-pointer list-none items-center gap-2 text-signal [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="inline-block w-3 text-center group-open:hidden">+</span>
              <span aria-hidden className="hidden w-3 text-center group-open:inline">−</span>
              Where each one runs
            </summary>
            <ul className="mt-4">
              {ROWS.map(([cap, where, job]) => (
                <li key={cap} className="grid gap-1 border-b border-paper/10 py-3 last:border-b-0 md:grid-cols-[1.1fr_0.9fr_2fr] md:gap-6">
                  <span className="font-semibold text-paper">{cap}</span>
                  <span className="label self-center text-paper/60">{where}</span>
                  <span className="text-[15px] text-paper/80">{job}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
