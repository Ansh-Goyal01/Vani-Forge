import Link from "next/link";

/** Opens the builder page. */
export function BuildButton({ className = "btn btn-primary", children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link href="/build" className={className}>
      {children}
    </Link>
  );
}
