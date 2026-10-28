import { SectionNumber } from "./ui";

type Box = { t: string; s: string; dark?: boolean };
const W = 192;

const L1: Box[] = [
  { t: "Spoken or typed brief", s: "HINDI / ENGLISH · MIC" },
  { t: "Price list PDF", s: "OWNER DOCUMENT" },
  { t: "Owner edits", s: "CHAT + FORM" },
];
const L2: Box[] = [
  { t: "Scribe v2", s: "SPEECH TO TEXT" },
  { t: "Gemini → VoiceIR", s: "JSON SCHEMA · ZOD-CHECKED" },
  { t: "Chat → JSON Patch", s: "RFC 6902 OPS ON VOICEIR" },
];
const L4: Box[] = [
  { t: "Agent config", s: "PROMPT · FIRST MESSAGE · LANGS" },
  { t: "Evaluation criteria", s: "ONE PER PROMISE" },
  { t: "Pronunciation dictionary", s: "ALIAS RULES FOR NAMES" },
  { t: "Turn + ASR settings", s: "IGNORE TERMS · KEYWORDS" },
  { t: "Built-in tools", s: "END CALL · TRANSFER" },
];
const L5: Box[] = [
  { t: "1  Simulation tests × 3", s: "TEXT TIER · PER PROMISE" },
  { t: "2  Audio chaos", s: "TTS → AGENT WEBSOCKET" },
  { t: "3  Heal proposal", s: "QUOTE · EXPLAIN · PATCH" },
  { t: "4  Owner approves", s: "NEW VERSION · RE-RUN", dark: true },
];

const X = { l1: 8, l2: 252, l3: 498, l4: 760, l5: 1004 };
const L12Y = [64, 214, 364];
const L4Y = [40, 120, 200, 280, 360];
const L5Y = [52, 146, 240, 334];
const MID = 232;

function BoxSvg({ x, y, h, b, w = W }: { x: number; y: number; h: number; b: Box; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={b.dark ? "#181818" : "#f4f3ef"} stroke={b.dark ? "#ff4f13" : "#111111"} strokeWidth="1.5" />
      <text x={x + 12} y={y + h / 2 - 3} className="svg-title" style={b.dark ? { fill: "#e7e5e0" } : undefined}>{b.t}</text>
      <text x={x + 12} y={y + h / 2 + 14} className="svg-sub" style={b.dark ? { fill: "#ff4f13" } : undefined}>{b.s}</text>
    </g>
  );
}

const CODE: [string, string][] = [
  ["promises:", ""],
  ["  always ", "book appointments"],
  ["  never  ", "medical advice"],
  ["  handoff", " pain → owner"],
  ["states: ", "greet → book | prices"],
  ["        ", "| pain → close"],
  ["tools:  ", "end_call, transfer"],
  ["lexicon:", " Bhatnagar"],
  ["        ", "→ “Bhut-nuh-gar”"],
  ["speech: ", "ignore “haan ji”"],
];

function Diagram() {
  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
  };
  const spine = [
    ...L12Y.map((y) => `M${X.l1 + W} ${y + 40} L${X.l2} ${y + 40}`),
    ...L12Y.map((y) => curve(X.l2 + W, y + 40, X.l3, MID)),
    ...L4Y.map((y) => curve(X.l3 + 216, MID, X.l4, y + 33)),
    ...L4Y.map((y) => curve(X.l4 + 214, y + 33, X.l5, L5Y[0] + 38)),
  ];
  return (
    <svg viewBox="0 0 1200 560" className="draw h-auto w-full" role="img" aria-labelledby="pipe-title pipe-desc">
      <title id="pipe-title">How VaniForge turns a brief into a tested ElevenLabs agent</title>
      <desc id="pipe-desc">
        Inputs are parsed into one VoiceIR spec, compiled to an ElevenLabs agent, then verified by simulation tests and audio chaos. Failures produce a patch the owner approves, which recompiles the agent and re-runs the test.
      </desc>
      {(["L1 · INPUT", "L2 · PARSE", "L3 · VOICEIR", "L4 · EMIT TO ELEVENLABS", "L5 · VERIFY + HEAL"] as const).map((h, i) => (
        <text key={h} x={[X.l1, X.l2, X.l3, X.l4, X.l5][i]} y="22" className="svg-head">{h}</text>
      ))}

      {/* connectors: drawn on reveal, then orange pulses flow along them */}
      <g fill="none" stroke="#111111" strokeWidth="1.3">
        {spine.map((d, i) => (
          <path key={i} d={d} className="d" pathLength={1} style={{ "--len": 1, "--d": i % 5 } as React.CSSProperties} />
        ))}
        <path d={`M${X.l5 + 96} ${L5Y[0] + 76} V${L5Y[1]} M${X.l5 + 96} ${L5Y[1] + 76} V${L5Y[2]} M${X.l5 + 96} ${L5Y[2] + 76} V${L5Y[3]}`} className="d" pathLength={1} style={{ "--len": 1, "--d": 6 } as React.CSSProperties} />
      </g>
      <g fill="none" stroke="#ff4f13" strokeWidth="2.4" strokeLinecap="round">
        {spine.slice(3, 11).map((d, i) => (
          <path key={i} d={d} pathLength={240} className="flow" style={{ animationDelay: `${i * 0.37}s` }} />
        ))}
      </g>

      {L1.map((b, i) => <BoxSvg key={b.t} x={X.l1} y={L12Y[i]} h={80} b={b} />)}
      {L2.map((b, i) => <BoxSvg key={b.t} x={X.l2} y={L12Y[i]} h={80} b={b} />)}

      {/* L3: the single source of truth */}
      <g>
        <rect x={X.l3 - 3} y="55" width="222" height="354" rx="4" fill="none" stroke="#ff4f13" strokeOpacity="0.18" strokeWidth="3" />
        <rect x={X.l3} y="58" width="216" height="348" rx="3" fill="#181818" stroke="#ff4f13" strokeWidth="1.5" />
        <rect x={X.l3} y="58" width="216" height="30" rx="3" fill="#ff4f13" />
        <text x={X.l3 + 12} y="78" className="svg-head" style={{ fill: "#111111", fontWeight: 700 }}>VOICEIR</text>
        <text x={X.l3 + 204} y="78" textAnchor="end" className="svg-head" style={{ fill: "#111111" }}>v1 · JSON</text>
        {CODE.map(([k, v], i) => (
          <text key={i} x={X.l3 + 12} y={114 + i * 28.5} className="svg-code">
            <tspan className="svg-code-k">{k}</tspan>
            {v}
          </text>
        ))}
      </g>

      {L4.map((b, i) => <BoxSvg key={b.t} x={X.l4} y={L4Y[i]} h={66} w={214} b={b} />)}
      {L5.map((b, i) => <BoxSvg key={b.t} x={X.l5} y={L5Y[i]} h={76} w={192} b={b} />)}

      {/* the heal loop back into VoiceIR */}
      <path d={`M${X.l5 + 96} ${L5Y[3] + 76} C${X.l5 + 96} 520 ${X.l3 + 108} 520 ${X.l3 + 108} 410`} fill="none" stroke="#ff4f13" strokeWidth="1.8" className="heal-dash" />
      <path d={`M${X.l3 + 102} 418 L${X.l3 + 108} 408 L${X.l3 + 114} 418`} fill="none" stroke="#ff4f13" strokeWidth="1.8" />
      <text x={(X.l5 + 96 + X.l3 + 108) / 2} y="546" textAnchor="middle" className="svg-heal">
        HEAL: RFC 6902 PATCH → RECOMPILE → NEW VERSION → RE-RUN THE CALLER
      </text>
    </svg>
  );
}

const MOBILE: { col: string; items: Box[] }[] = [
  { col: "L1 · Input", items: L1 },
  { col: "L2 · Parse", items: L2 },
  { col: "L3 · VoiceIR", items: [{ t: "One JSON spec", s: "PROMISES · STATES · TOOLS · LEXICON · SPEECH", dark: true }] },
  { col: "L4 · Emit to ElevenLabs", items: L4 },
  { col: "L5 · Verify + heal", items: L5 },
];

export function Pipeline() {
  return (
    <section id="loop" data-band="250" data-title="Under the hood" aria-labelledby="loop-title" className="scroll-mt-28 py-20">
      <div className="wrap">
        <div className="reveal flex flex-wrap items-start gap-x-8 gap-y-3">
          <SectionNumber n="02" />
          <div className="max-w-4xl pt-1">
            <h2 id="loop-title" className="text-[clamp(2rem,4.6vw,4rem)]">One spec drives the build, the tests and the fixes.</h2>
            <p className="mt-3 max-w-3xl text-[17px] text-mute">
              <strong className="font-semibold text-ink">Under the hood:</strong> the brief becomes a typed VoiceIR spec. VaniForge compiles it into an ElevenLabs agent, attacks it, and every repair is a reviewable JSON Patch on that spec, so the agent can always be rebuilt or rolled back.
            </p>
          </div>
        </div>

        <div className="reveal mt-12 hidden rounded-card border-[1.5px] border-ink bg-card/60 p-6 lg:block" style={{ "--d": 1 } as React.CSSProperties}>
          <Diagram />
        </div>

        <ol className="mt-10 space-y-6 lg:hidden">
          {MOBILE.map((c, i) => (
            <li key={c.col} className="reveal" style={{ "--d": i } as React.CSSProperties}>
              <p className="label mb-2 font-bold">{c.col}</p>
              <ul className="space-y-2">
                {c.items.map((b) => (
                  <li key={b.t} className={`rounded-card border-[1.5px] px-4 py-3 ${b.dark ? "border-signal bg-graphite text-paper" : "border-ink bg-card"}`}>
                    <span className="block font-semibold">{b.t}</span>
                    <span className={`label block !text-[10px] ${b.dark ? "text-signal" : "text-mute"}`}>{b.s}</span>
                  </li>
                ))}
              </ul>
              {i < MOBILE.length - 1 && <p aria-hidden className="mt-2 text-center font-mono text-mute">↓</p>}
            </li>
          ))}
          <li className="reveal label rounded-card border-[1.5px] border-dashed border-signal px-4 py-3 !text-[10.5px] font-semibold text-problem">
            ↺ Heal: RFC 6902 patch → recompile → new version → re-run the caller
          </li>
        </ol>
      </div>
    </section>
  );
}
