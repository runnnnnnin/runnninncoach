import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`group flex items-baseline gap-1.5 ${className}`} aria-label={BRAND.name}>
      <span className="serif text-2xl leading-none">
        Run<em className="motion-text">flow</em>
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-signal transition group-hover:translate-x-1" />
    </Link>
  );
}
