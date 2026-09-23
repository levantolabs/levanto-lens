/** Size a video frame so its long edge is `max` px, preserving aspect. */
export function fitLongEdge(w: number, h: number, max = 512): { width: number; height: number } {
  if (w <= 0 || h <= 0) return { width: max, height: max };
  const s = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
}

/** Where the needle points for a probability: -90deg at 0, +90deg at 1. */
export function needleAngle(p: number): number {
  const c = Math.min(1, Math.max(0, p));
  return -90 + c * 180;
}

/** SVG polyline points for a 0..1 series in a w x h box, oldest left, latest right. Empty series gives "". */
export function sparklinePoints(values: number[], w: number, h: number, n: number): string {
  if (values.length === 0) return "";
  const pad = 2;
  const step = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const start = n - values.length; // right-align so the line grows from the right
  return values
    .map((v, i) => `${(pad + (start + i) * step).toFixed(1)},${(pad + (1 - Math.min(1, Math.max(0, v))) * (h - pad * 2)).toFixed(1)}`)
    .join(" ");
}
