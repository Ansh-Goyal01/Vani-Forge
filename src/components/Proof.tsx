import { SectionNumber } from "./ui";

/** Deterministic synthetic spectrogram: speech-like bursts of harmonic stripes. Illustrative only. */
function Spectrogram() {
  const cols = 72;
  const rows = 26;
  const cells: React.ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    const envelope = Math.pow(Math.max(0, Math.sin(c * 0.43 + 0.4)), 0.7) * (0.65 + 0.35 * Math.sin(c * 0.97));
    for (let r = 0; r < rows; r++) {
      const stripe = r % 2 === 0 ? 1 : 0.35;
      const energy = envelope * stripe * (1 - (r / rows) * 0.85) * (0.8 + 0.2 * Math.sin(c * 2.1 + r * 0.7));
      if (energy < 0.1) continue;
      cells.push(<rect key={`${c}-${r}`} x={c * 9 + 1} y={(rows - 1 - r) * 6} width="7.5" height="3.2" fill="#FF4F13" opacity={Math.min(1, 0.2 + energy * 0.95)} />);
    }
  }
  return (
    <svg viewBox={`0 0 ${cols * 9} ${rows * 6}`} className="h-auto w-full" role="img" aria-label="Illustrative spectrogram, not a real call">
      <line x1="0" x2={cols * 9} y1="34" y2="34" stroke="#FF4F13" strokeDasharray="4 4" opacity="0.7" />
      {cells}
      <rect x="318" y="20" width="78" height="128" fill="none" stroke="#e7e5e0" strokeWidth="1.5" />
    </svg>
  );
}

/** Illustrative example, labelled as such. Not data from any real call. */
export function Proof() {
  return (
    <section id="proof" aria-labelledby="proof-title" className="scroll-mt-6 py-16">
      <div className="wrap">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
          <SectionNumber n="02" />
          <div className="max-w-4xl pt-1">
            <h2 id="proof-title" className="text-[clamp(2rem,4.6vw,4rem)]">Typing is easy. Talking is where agents slip.</h2>
            <p className="mt-3 text-[17px] text-mute">
              <strong className="font-semibold text-ink">Affected:</strong> any agent that reads well on a screen but mishears a time, or goes quiet when a caller says &ldquo;haan ji&rdquo;.
            </p>
          </div>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr]">
          <figure className="panel-dark on-dark p-5 sm:p-6">
            <figcaption className="label flex flex-wrap justify-between gap-2 text-[10px] text-paper/80">
              <span>Example · caller + agent · 8 kHz phone line</span>
              <span className="text-paper/60">Synthetic spectrogram, illustrative. Not a real call.</span>
            </figcaption>
            <div className="mt-4"><Spectrogram /></div>
            <p className="label mt-3 text-[10px] text-paper/70">↑ &ldquo;Parso saadhe chaar baje&hellip;&rdquo; Hindi-English code-switch &nbsp;·&nbsp; ↑ overlap: caller says &ldquo;haan ji&rdquo; while the agent talks</p>
          </figure>

          <dl className="divide-y-[1.5px] divide-ink border-y-[1.5px] border-ink">
            <div className="py-4">
              <dt className="label text-mute">Caller said</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight">&ldquo;Parso saadhe chaar baje slot milega?&rdquo;</dd>
            </div>
            <div className="py-4">
              <dt className="label text-mute">Agent heard</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight">
                &ldquo;<span className="line-through decoration-signal decoration-[3px]">Paris</span>&hellip;&rdquo;
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
