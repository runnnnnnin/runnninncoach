import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * Le « R » italique avec ses traînées (grises puis rouge) et le point rouge,
 * suivi du nom en gras minuscule. Même marque que les stories et l'icône du site.
 */
export function LogoMark({ className = "h-7 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <filter id="logo-trail" x="-60%" y="-20%" width="220%" height="140%">
          <feGaussianBlur stdDeviation="2.6 0.3" />
        </filter>
      </defs>
      <g style={{ fontFamily: "var(--font-serif), Georgia, serif", fontStyle: "italic" }} fontSize="104" textAnchor="end">
        <text x="62" y="84" fill="#8a8d93" opacity="0.3" filter="url(#logo-trail)">R</text>
        <text x="69" y="84" fill="#8a8d93" opacity="0.45" filter="url(#logo-trail)">R</text>
        <text x="76" y="84" fill="var(--signal)" opacity="0.5" filter="url(#logo-trail)">R</text>
        <text x="83" y="84" fill="currentColor">R</text>
      </g>
      <circle cx="104" cy="80" r="8" fill="var(--signal)" />
    </svg>
  );
}

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`group flex items-center gap-1 ${className}`} aria-label={BRAND.name}>
      <LogoMark className="h-8 w-10 transition group-hover:translate-x-0.5" />
      <span className="serif hidden text-xl lowercase leading-none min-[380px]:inline">{BRAND.name.toLowerCase()}</span>
    </Link>
  );
}
