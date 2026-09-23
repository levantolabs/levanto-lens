import { NextResponse } from "next/server";
import { YesNo, image } from "levanto";
import { sageClient } from "@/lib/client";
import { validateAskBody } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const FRAME_CONTEXT = "A live camera frame. Answer only from what is visible in this frame.";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = validateAskBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const t0 = Date.now();
    const client = sageClient();
    // decide() rather than yesno() so the response meta (model, latency) comes back too.
    const env = await client.decide(image(parsed.value.image, FRAME_CONTEXT), new YesNo(parsed.value.question), { reasoning: "off" });
    const r = env.result as { answer: "yes" | "no" | null; probability: number | null };
    return NextResponse.json({
      answer: r.answer ?? null,
      probability: r.probability ?? null,
      meta: { model: env.meta.model, latencyMs: env.meta.latency_ms ?? Date.now() - t0 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "sage request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
