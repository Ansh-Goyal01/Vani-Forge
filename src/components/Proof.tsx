import { SectionNumber } from "./ui";

/** Deterministic synthetic spectrogram: speech-like bursts of harmonic stripes. Illustrative only. */
function Spectrogram() {
  const cols = 112;
  const rows = 30;
  const cw = 6;
  const rh = 5;
  const cells: React.ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    // syllable-like bursts with short gaps, like speech
    const envelope = Math.pow(Math.max(0, Math.sin(c * 0.21 + 0.5)), 0.55) * (0.72 + 0.28 * Math.sin(c * 0.61));
    for (let r = 0; r < rows; r++) {
      const harmonic = r % 3 === 0 ? 1 : r % 3 === 1 ? 0.5 : 0.18;
      const rolloff = 1 - (r / rows) * 0.8;
      const energy = envelope * harmonic * rolloff * (0.8 + 0.2 * Math.sin(c * 1.9 + r * 0.8));
      if (energy < 0.09) continue;
      cells.push(<rect key={`${c}-${r}`} x={c * cw} y={(rows - 1 - r) * rh} width={cw - 0.8} height={rh - 1.6} fill="#FF4F13" opacity={Math.min(1, 0.18 + energy)} />);
    }
  }
  const W = cols * cw;
  const H = rows * rh;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Illustrative spectrogram, not a real call">
      <line x1="0" x2={W} y1={H * 0.2} y2={H * 0.2} stroke="#FF4F13" strokeDasharray="4 4" opacity="0.7" />
      {cells}
      <rect x={W * 0.53} y={H * 0.12} width={W * 0.13} height={H * 0.86} fill="none" stroke="#e7e5e0" strokeWidth="1.5" />
    </svg>
  );
}

/** Illustrative example, labelled as such. Not data from any real call. */
export function Proof() {
  return (
    <section id="proof" data-band="500" data-title="Testing" aria-labelledby="proof-title" className="scroll-mt-28 py-20">
      <div className="wrap">
        <div className="reveal flex flex-wrap items-start gap-x-8 gap-y-3">
          <SectionNumber n="03" />
          <div className="max-w-4xl pt-1">
            <h2 id="proof-title" className="text-[clamp(2rem,4.6vw,4rem)]">Typing is easy. Talking is where agents slip.</h2>
            <p className="mt-3 text-[17px] text-mute">
              <strong className="font-semibold text-ink">Affected:</strong> any agent that reads well on a screen but mishears a time, or goes quiet when a caller says &ldquo;haan ji&rdquo;.
            </p>
          </div>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr]">
          <figure className="reveal panel-dark on-dark p-5 sm:p-6">
            <figcaption className="label flex flex-wrap justify-between gap-2 text-[10px] text-paper/80">
              <span>Example · caller + agent · 8 kHz phone line</span>
              <span className="text-paper/60">Synthetic spectrogram, illustrative. Not a real call. Dashed line: phone band edge.</span>
            </figcaption>
            <div className="sweep mt-4"><Spectrogram /></div>
            <p className="label mt-3 text-[10px] text-paper/70">↑ &ldquo;Parso saadhe chaar baje&hellip;&rdquo; Hindi-English code-switch &nbsp;·&nbsp; ↑ overlap: caller says &ldquo;haan ji&rdquo; while the agent talks</p>
          </figure>

          <dl className="story divide-y-[1.5px] divide-ink border-y-[1.5px] border-ink">
            <div className="py-4">
              <dt className="label text-mute">Caller said</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight">&ldquo;Parso saadhe chaar baje slot milega?&rdquo;</dd>
            </div>
            <div className="py-4">
              <dt className="label text-mute">Agent heard</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight">
                &ldquo;<span className="strike">Paris</span>&hellip;&rdquo;
              </dd>
            </div>
            <div className="py-4">
              <dt className="label text-mute">Then</dt>
              <dd className="mt-1">The caller&rsquo;s &ldquo;haan&hellip; haan ji&hellip;&rdquo; made the agent stop mid-sentence.</dd>
            </div>
            <div className="py-4">
              <dt className="label flex items-center gap-2 text-problem"><span aria-hidden className="inline-block h-2 w-2 bg-signal" />Proposed fix</dt>
              <dd className="mt-1">Treat &ldquo;haan ji&rdquo; as listening, not as an interruption.</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
