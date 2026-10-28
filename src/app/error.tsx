"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap py-20">
      <h1 className="text-[clamp(2.25rem,5vw,4rem)]">Something went wrong.</h1>
      <p className="mt-3 text-mute">The page could not be shown. Your agents are safe. Try again, and if it keeps happening restart the app.</p>
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>Try again</button>
    </section>
  );
}
