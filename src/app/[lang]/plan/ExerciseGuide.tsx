"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { guideFor, type Pose, type Prop } from "@/lib/exercise-guide";
import type { Exercise } from "@/lib/types";

const BONE = "var(--bone)", FAR = "#6f747b", SIGNAL = "var(--signal)", MIST = "#9a9ea5";

function PropShape({ p, marker }: { p: Prop; marker: string }) {
  switch (p[0]) {
    case "step":
      return <rect x={p[1]} y={p[2]} width={p[3]} height={p[4]} fill="#22252a" stroke={MIST} strokeWidth={1.5} />;
    case "wall":
      return <line x1={p[1]} y1={6} x2={p[1]} y2={100} stroke={MIST} strokeWidth={3} />;
    case "line":
      return <line x1={p[1]} y1={p[2]} x2={p[3]} y2={p[4]} stroke={MIST} strokeWidth={2} strokeLinecap="round" />;
    case "band":
      return <line x1={p[1]} y1={p[2]} x2={p[3]} y2={p[4]} stroke={SIGNAL} strokeWidth={3} strokeLinecap="round" />;
    case "db":
      return (
        <g fill={MIST}>
          <rect x={p[1] - 6} y={p[2] - 1.5} width={12} height={3} />
          <rect x={p[1] - 8} y={p[2] - 4} width={3.5} height={8} rx={1} />
          <rect x={p[1] + 4.5} y={p[2] - 4} width={3.5} height={8} rx={1} />
        </g>
      );
    case "arrow":
      return <line x1={p[1]} y1={p[2]} x2={p[3]} y2={p[4]} stroke={SIGNAL} strokeWidth={2.5} strokeLinecap="round" markerEnd={`url(#${marker})`} />;
    case "guide":
      return <line x1={p[1]} y1={p[2]} x2={p[3]} y2={p[4]} stroke={SIGNAL} strokeWidth={1.5} strokeDasharray="3 3" />;
    case "label":
      return (
        <text x={p[1]} y={p[2]} fill={SIGNAL} fontSize={10} textAnchor="middle" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
          {p[3]}
        </text>
      );
  }
}

/** Un bonhomme en bâtons : les membres du fond en gris, ceux du premier plan en clair. */
function Figure({ pose, marker }: { pose: Pose; marker: string }) {
  const pts = (...p: [number, number][]) => p.map((x) => x.join(",")).join(" ");
  const leg = (l: NonNullable<Pose["l2"]>) => pts(pose.p, l[0], l[1], l[2] ?? [l[1][0] + 7, l[1][1]]);
  const arm = (a: NonNullable<Pose["a2"]>) => pts(pose.s, a[0], a[1]);
  const line = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 -6 120 116" className="block w-full" role="img" aria-hidden>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={SIGNAL} />
        </marker>
      </defs>
      <line x1={4} y1={101} x2={116} y2={101} stroke="rgba(236,232,223,0.22)" strokeWidth={1.5} />
      {pose.props?.filter((p) => p[0] !== "arrow" && p[0] !== "guide" && p[0] !== "label" && p[0] !== "band" && p[0] !== "db").map((p, i) => <PropShape key={i} p={p} marker={marker} />)}
      {pose.l2 && <polyline points={leg(pose.l2)} stroke={FAR} strokeWidth={5} {...line} />}
      {pose.a2 && <polyline points={arm(pose.a2)} stroke={FAR} strokeWidth={4} {...line} />}
      <line x1={pose.s[0]} y1={pose.s[1]} x2={pose.p[0]} y2={pose.p[1]} stroke={BONE} strokeWidth={6.5} strokeLinecap="round" />
      <polyline points={leg(pose.l1)} stroke={BONE} strokeWidth={5} {...line} />
      <polyline points={arm(pose.a1)} stroke={BONE} strokeWidth={4} {...line} />
      <circle cx={pose.h[0]} cy={pose.h[1]} r={7} fill={BONE} />
      {pose.props?.filter((p) => p[0] === "arrow" || p[0] === "guide" || p[0] === "label" || p[0] === "band" || p[0] === "db").map((p, i) => <PropShape key={i} p={p} marker={marker} />)}
    </svg>
  );
}

/** Une ligne d'exercice : nom + dose, et en touchant, le mouvement en 3 dessins et 3 consignes. */
export function ExerciseRow({ e, lang, defaultOpen = false }: { e: Exercise; lang: Locale; defaultOpen?: boolean }) {
  const guide = guideFor(e.name);
  const [open, setOpen] = useState(defaultOpen);
  const id = useId().replace(/:/g, "");
  const head = (
    <>
      <span className="text-left">
        {e.name}
        {e.cue && <span className="block text-xs text-fog">{e.cue}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-xs text-mist">{e.dose}</span>
        {guide && (
          <span className="no-print label flex items-center gap-1.5 text-signal">
            {open ? (lang === "fr" ? "Fermer" : "Close") : lang === "fr" ? "Comment faire" : "How to"}
            <span className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}>↓</span>
          </span>
        )}
      </span>
    </>
  );
  if (!guide) return <li className="flex justify-between gap-4 border-b border-hairline py-2.5">{head}</li>;
  return (
    <li className="border-b border-hairline">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 py-2.5 text-left hover:text-white">
        {head}
      </button>
      {open && (
        <ol className="no-print grid grid-cols-3 gap-2 pb-4 sm:gap-3">
          {guide.frames.map((pose, i) => (
            <li key={i} className="border border-hairline bg-night/60 p-2 sm:p-3">
              <Figure pose={pose} marker={`arrow-${id}-${i}`} />
              <p className="mt-2 font-mono text-[10px] text-signal">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 text-xs leading-snug text-mist">{guide[lang][i]}</p>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}
