/** Decorative 20 Hz to 20 kHz log ruler with an orange marker, as in the deck's top bar. */
const MIN = 20;
const MAX = 20000;
const LABELS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const pos = (f: number) => (Math.log10(f) - Math.log10(MIN)) / (Math.log10(MAX) - Math.log10(MIN));
/** Fixed precision so server and client render identical style strings. */
const pct = (f: number) => `${(pos(f) * 100).toFixed(3)}%`;
const fmt = (f: number) => (f >= 1000 ? `${f / 1000}k` : String(f));

const TICKS: { f: number; major: boolean }[] = [];
for (const decade of [1, 10, 100, 1000, 10000]) {
  for (let k = 1; k <= 9; k++) {
    const f = k * decade;
    if (f >= MIN && f <= MAX) TICKS.push({ f, major: [1, 2, 5].includes(k) });
  }
}

export function Ruler({ marker }: { marker: number }) {
  return (
    <div aria-hidden className="relative h-9 select-none">
      <div className="absolute inset-x-0 top-3 border-t border-ink/70" />
      {TICKS.map((t) => (
        <span key={t.f} className="absolute top-3 w-px bg-ink/70" style={{ left: pct(t.f), height: t.major ? "8px" : "4px" }} />
      ))}
      {LABELS.map((f) => (
        <span
          key={f}
          className="label absolute top-5 -translate-x-1/2 !text-[8.5px] !normal-case !tracking-normal text-mute"
          style={{ left: pct(f), transform: f === MIN ? "none" : f === MAX ? "translateX(-100%)" : undefined }}
        >
          {fmt(f)}
        </span>
      ))}
      <span
        className="anim-marker marker-move absolute top-0 -translate-x-1/2 border-x-[5px] border-t-[8px] border-x-transparent border-t-signal"
        style={{ left: pct(marker) }}
      />
    </div>
  );
}
