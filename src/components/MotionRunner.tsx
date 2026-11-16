import { useId } from "react";

/**
 * Silhouette de coureur dessinée en traits, puis floutée horizontalement :
 * l'effet « photo prise en mouvement » sans utiliser de photo.
 */
export function MotionRunner({
  color = "currentColor",
  blur = 10,
  ghosts = 3,
  className = "",
}: {
  color?: string;
  blur?: number;
  ghosts?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const body = (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="122" cy="40" r="17" fill={color} stroke="none" />
      <path d="M114 66 L96 150" strokeWidth="34" />
      <path d="M108 78 L84 112 L66 94" strokeWidth="15" />
      <path d="M112 78 L138 108 L158 90" strokeWidth="15" />
      <path d="M98 150 L138 186 L124 246 L140 250" strokeWidth="21" />
      <path d="M94 150 L74 206 L30 214" strokeWidth="21" />
    </g>
  );
  return (
    <svg viewBox="-80 0 300 270" className={className} aria-hidden>
      <defs>
        <filter id={`mb-${id}`} x="-60%" y="-20%" width="220%" height="140%">
          <feGaussianBlur stdDeviation={`${blur} ${blur / 6}`} />
        </filter>
        <filter id={`gh-${id}`} x="-60%" y="-20%" width="220%" height="140%">
          <feGaussianBlur stdDeviation={`${blur * 2.4} ${blur / 4}`} />
        </filter>
      </defs>
      {Array.from({ length: ghosts }, (_, i) => (
        <g key={i} transform={`translate(${-(i + 1) * 26} 0)`} opacity={0.32 - i * 0.08} filter={`url(#gh-${id})`}>
          {body}
        </g>
      ))}
      <g filter={`url(#mb-${id})`}>{body}</g>
    </svg>
  );
}
