import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { CloudSwirl, Medallion, MicFallback } from "./art";
import { BuildButton } from "./BuildButton";

const HERO_FILE = path.join(process.cwd(), "public", "hero", "hero-object.png");

/** Decided at render time on the server: the photo if the file exists, otherwise the line-art microphone. */
function HeroObject() {
  if (fs.existsSync(HERO_FILE)) {
    return (
      <Image
        src="/hero/hero-object.png"
        alt="A vintage studio microphone in deep plum and terracotta"
        fill
        priority
        sizes="(min-width: 1024px) 36vw, 78vw"
        className="hero-mask object-contain"
      />
    );
  }
  return <MicFallback className="absolute inset-0 h-full w-full" />;
}

export function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="relative overflow-x-clip">
      <div className="mx-auto grid max-w-[1440px] gap-y-8 px-5 pb-14 pt-2 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,27%)_minmax(0,35%)_minmax(0,1fr)] lg:items-center lg:gap-y-0 lg:px-8 lg:py-0">
        {/* Left: the word, vertical on desktop */}
        <div className="relative flex items-center justify-center lg:justify-start">
          {/* The rotation lives on the outer element so the rise-in animation cannot override it. */}
          <div aria-hidden className="hero-word-rot">
            <p className="hero-word anim-rise text-plum">Voice</p>
          </div>
          <ul className="label absolute bottom-6 right-0 hidden space-y-3 text-plum lg:block" style={{ right: "-1.5rem" }}>
            <li>Real callers</li>
            <li>Hindi + English</li>
            <li>Fixed before launch</li>
          </ul>
        </div>

        {/* Centre: the object, clouds behind it */}
        <div className="relative z-10 lg:-ml-16">
          <div className="hero-image-box">
            <CloudSwirl className="anim-cloud-l absolute -left-[34%] top-[6%] hidden w-[70%] sm:block lg:-left-[24%] lg:w-[58%]" />
            <CloudSwirl flip className="anim-cloud-r absolute -right-[34%] bottom-[16%] hidden w-[70%] sm:block lg:bottom-auto lg:top-[36%] lg:-right-[20%] lg:w-[44%]" />
            <div className="anim-fade absolute inset-0">
              <HeroObject />
            </div>
          </div>
          <ul className="label mt-6 space-y-2 text-center text-plum lg:hidden">
            <li>Real callers</li>
            <li>Hindi + English</li>
            <li>Fixed before launch</li>
          </ul>
        </div>

        {/* Right: headline */}
        <div className="relative z-10 lg:pl-6">
          <p className="label mb-5 text-plum">For clinics, shops and studios</p>
          <h1 id="hero-title" className="text-[clamp(2.75rem,5.2vw,5.25rem)] leading-[0.98]">
            Give your
            <br />
            business
            <br />
            a voice
          </h1>
          <p className="label mt-6 max-w-xs leading-relaxed text-plum">It picks up every call, in Hindi or English</p>
          <BuildButton className="btn btn-primary mt-8 !px-8 !py-4">Build your agent <span aria-hidden>→</span></BuildButton>
          <div className="mt-10 flex justify-center lg:absolute lg:-bottom-24 lg:right-0 lg:mt-0">
            <Medallion size={170} />
          </div>
        </div>
      </div>
    </section>
  );
}
