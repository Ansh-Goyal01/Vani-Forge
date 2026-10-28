import { PERSONAS } from "@/lib/personas";
import { IconBreak, IconDeploy, IconSheet } from "./art";

const COURSES = [
  {
    n: "1",
    title: "Say what you need",
    icon: <IconSheet />,
    body: "Describe the agent the way you would brief a new receptionist. VaniForge turns it into a promise sheet you can edit: what it always does, what it never does, and when it hands the call to you.",
    extra: (
      <div className="mt-5 rounded-card border-[1.5px] border-plum bg-blush px-4 py-3 text-[15px]">
        <p className="label mb-2 text-mute">Example promise sheet</p>
        <p><span className="font-medium">Always:</span> book appointments</p>
        <p><span className="font-medium">Never:</span> give medical advice</p>
        <p><span className="font-medium">Hand off:</span> a patient in pain goes to the doctor</p>
      </div>
    ),
  },
  {
    n: "2",
    title: "Break it before customers do",
    icon: <IconBreak />,
    body: "Four difficult callers test your agent on purpose. When it breaks a promise, you see the exact line, a plain explanation and a fix to approve.",
    extra: (
      <ul className="mt-5 space-y-2 text-[15px]">
        {PERSONAS.map((p) => (
          <li key={p.id} className="flex gap-3">
            <span aria-hidden className="mt-2 h-2 w-2 flex-none rounded-full bg-terracotta" />
            {p.name}
          </li>
        ))}
      </ul>
    ),
  },
  {
    n: "3",
    title: "Put it to work",
    icon: <IconDeploy />,
    body: "Share a test link, drop the call button on your website, and read every call afterwards with a summary and a score for each promise.",
    extra: (
      <p className="mt-5 text-[15px] text-mute">
        Phone numbers connect through Twilio or Exotel. The steps are in the app; no number is connected in this prototype.
      </p>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-6 py-20">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <p className="label text-mute">How it works</p>
        <h2 id="how-title" className="mt-3 max-w-3xl text-[clamp(2rem,4.4vw,3.75rem)]">Three courses, no kitchen skills needed.</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
          {COURSES.map((c, i) => (
            <li key={c.n} className={`flex flex-col md:px-8 ${i > 0 ? "md:border-l-[1.5px] md:border-plum/50" : "md:pl-0"} ${i === 2 ? "md:pr-0" : ""}`}>
              <span aria-hidden className="font-display text-[5.5rem] font-medium italic leading-none">{c.n}</span>
              <div className="mt-4">{c.icon}</div>
              <h3 className="mt-4 text-2xl">{c.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed">{c.body}</p>
              {c.extra}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
