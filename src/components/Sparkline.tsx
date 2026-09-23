import { sparklinePoints } from "@/lib/frame";
import { HISTORY } from "@/lib/session";

export default function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  const w = 240, h = 40;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`h-10 w-full ${className}`} aria-hidden>
      <line x1="2" y1={h / 2} x2={w - 2} y2={h / 2} stroke="var(--color-hair)" strokeWidth="1" strokeDasharray="3 3" />
      <polyline points={sparklinePoints(values, w, h, HISTORY)} fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
