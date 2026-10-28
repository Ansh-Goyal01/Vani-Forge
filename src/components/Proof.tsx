/** Illustrative example, labelled as such. Not data from any real call. */
export function Proof() {
  return (
    <section id="proof" aria-labelledby="proof-title" className="on-plum scroll-mt-6 bg-plum py-20 text-blush">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
        <div>
          <p className="label text-mauve">Testing</p>
          <h2 id="proof-title" className="mt-3 text-[clamp(2.2rem,5vw,4.5rem)] text-mauve">
            Typing is easy. Talking is where agents slip.
          </h2>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-blush/90">
            Agents that read well on a screen can still mishear a time, or stop talking when a caller says &ldquo;haan ji&rdquo;. VaniForge calls your agent out loud, shows what it heard, and fixes what it got wrong.
          </p>
        </div>

        <figure className="rounded-card bg-blush p-6 text-plum sm:p-8">
          <figcaption className="label mb-5 text-mute">An example of what testing catches. Not a real call.</figcaption>
          <dl className="space-y-5">
            <div>
              <dt className="label text-mute">Caller said</dt>
              <dd className="mt-1 font-display text-xl">&ldquo;Parso saadhe chaar baje slot milega?&rdquo;</dd>
            </div>
            <div>
              <dt className="label text-mute">Agent heard</dt>
              <dd className="mt-1 font-display text-xl">
                &ldquo;<span className="line-through decoration-terracotta decoration-[3px]">Paris</span>&hellip;&rdquo;
              </dd>
            </div>
            <div>
              <dt className="label text-mute">Then</dt>
              <dd className="mt-1 text-[16px]">
                The caller&rsquo;s &ldquo;haan&hellip; haan ji&hellip;&rdquo; made the agent stop mid-sentence.
              </dd>
            </div>
            <div className="border-t-[1.5px] border-plum pt-5">
              <dt className="label flex items-center gap-2 text-mute">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-terracotta" />
                Proposed fix
              </dt>
              <dd className="mt-1 text-[16px]">Treat &ldquo;haan ji&rdquo; as listening, not as an interruption.</dd>
            </div>
          </dl>
        </figure>
      </div>
    </section>
  );
}
