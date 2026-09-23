"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { needleAngle } from "@/lib/frame";

/** A semicircular needle gauge, 0 on the left, 1 on the right. Eases between values. */
export default function Gauge({ p, unsure }: { p: number; unsure: boolean }) {
  const spring = useSpring(needleAngle(p), { stiffness: 120, damping: 18, mass: 0.6 });
  useEffect(() => {
    spring.set(needleAngle(p));
  }, [p, spring]);
  // SVG rotation about the pivot: written straight to the attribute as the spring moves.
  const needle = useRef<SVGGElement>(null);
  useEffect(() => {
    const apply = (a: number) => needle.current?.setAttribute("transform", `rotate(${a} 100 100)`);
    apply(spring.get());
    return spring.on("change", apply);
  }, [spring]);

  return (
    <svg viewBox="0 0 200 112" className="w-full" role="img" aria-label={`Probability ${Math.round(p * 100)} percent`}>
      {/* track */}
      <path d="M 12 100 A 88 88 0 0 1 188 100" fill="none" stroke="var(--color-faint)" strokeWidth="10" strokeLinecap="round" />
      {/* fill from left to the needle */}
      <motion.path
        d="M 12 100 A 88 88 0 0 1 188 100"
        fill="none"
        stroke={unsure ? "var(--color-hair)" : "var(--color-blue)"}
        strokeWidth="10"
        strokeLinecap="round"
        pathLength={1}
        style={{ pathLength: useTransform(spring, (a) => (a + 90) / 180) }}
      />
      {/* ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const a = ((needleAngle(t) - 90) * Math.PI) / 180;
        const x1 = 100 + Math.cos(a) * 74, y1 = 100 + Math.sin(a) * 74, x2 = 100 + Math.cos(a) * 80, y2 = 100 + Math.sin(a) * 80;
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-blue)" strokeWidth="1.5" opacity="0.4" />;
      })}
      {/* needle */}
      <g ref={needle} data-testid="gauge-needle">
        <line x1="100" y1="100" x2="100" y2="24" stroke="var(--color-deep)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="6" fill="var(--color-deep)" />
      </g>
    </svg>
  );
}
