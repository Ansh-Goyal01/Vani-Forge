import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-16">
      <h1 className="text-4xl font-semibold">We could not find that page.</h1>
      <Link href="/" className="btn btn-primary mt-6 inline-block">Back to start</Link>
    </section>
  );
}
