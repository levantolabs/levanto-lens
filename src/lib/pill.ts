/**
 * Button shapes from levanto-landing's runtime system (`runtime.module.css`):
 * `.primary` is a blue fill with paper text that lifts 2px on hover,
 * `.secondary` the same shape outlined, `.navCta` the small 1px pill that
 * fills blue on hover, `.textLink` an underline-on-hover text link.
 */
export const PILL_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] tracking-[-0.01em] transition-[transform,background-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-40";

export const PILL_TONES = {
  primary: "border border-blue bg-blue text-paper hover:-translate-y-0.5",
  secondary: "border border-blue text-blue hover:bg-blue hover:text-paper",
  ghost: "px-2 py-1 text-blue underline-offset-4 hover:underline",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function pillClass(tone: PillTone = "primary", className = ""): string {
  return `${PILL_BASE} ${PILL_TONES[tone]} ${className}`;
}
