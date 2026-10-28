import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-20">
      <h1 className="text-[clamp(2.25rem,5vw,4rem)]">We could not find that page.</h1>
      <Link href="/" className="btn btn-primary mt-6 inline-block">Back to start</Link>
    </section>
  );
}
