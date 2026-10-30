import { PERSONA_LABELS } from "@/lib/personas";
import { SectionNumber } from "./ui";

const STEPS = [
  {
    tag: "F1",
    title: "Say what you need",
    body: "Describe the agent the way you would brief a new receptionist, by typing or speaking. VaniForge writes a promise sheet you can edit: what it always does, what it never does, and when it hands the call to you.",
    spec: "input: voice or text · Hindi, English, Hinglish → promise sheet",
  },
  {
    tag: "F2",
    title: "Break it before customers do",
    body: "Four difficult callers test your agent on purpose. When it breaks a promise you see the exact line, a plain explanation and a fix to approve.",
    spec: "callers: " + PERSONA_LABELS.map((n) => n.toLowerCase()).join(" · "),
  },
  {
    tag: "F3",
    title: "Put it to work",
    body: "Share a test link, drop the call button on your website, and read every call afterwards with a summary and a score for each promise.",
    spec: "phone numbers connect through Twilio or Exotel; none is connected in this prototype",
  },
];

export function HowItWorks() {
  return (
    <section id="how" data-band="125" data-title="How it works" aria-labelledby="how-title" className="scroll-mt-28 py-20">
      <div className="wrap">
        <div className="reveal flex flex-wrap items-start gap-x-8 gap-y-3">
          <SectionNumber n="01" />
          <div className="max-w-3xl pt-1">
            <h2 id="how-title" className="text-[clamp(2rem,4.6vw,4rem)]">Three steps. No engineers needed.</h2>
            <p className="mt-3 text-[17px] text-mute">
              <strong className="font-semibold text-ink">For:</strong> clinics, coaching centres, shops and studios that live on phone calls and cannot hire voice engineers.
            </p>
          </div>
        </div>
        <ol className="mt-12 grid border-t-[1.5px] border-ink md:grid-cols-3 md:gap-x-10 md:border-t-0">
          {STEPS.map((s, i) => (
            <li key={s.tag} className="reveal border-t-[1.5px] border-ink py-6" style={{ "--d": i + 1 } as React.CSSProperties}>
              <p className="label font-bold text-problem">{s.tag}</p>
              <h3 className="mt-3 text-[1.6rem]">{s.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed">{s.body}</p>
              <p className="label mt-4 !normal-case !tracking-normal text-mute">
                <span className="mr-2 uppercase tracking-[0.14em]">Spec</span>
                {s.spec}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
