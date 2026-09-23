export interface AskBody {
  question: string;
  image: string;
}

const MAX_IMAGE_CHARS = 1_048_576; // 1 MiB of data URI
const PREFIXES = ["data:image/png;base64,", "data:image/jpeg;base64,"];

export function validateAskBody(body: unknown): { ok: true; value: AskBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "body must be a JSON object" };
  const b = body as Record<string, unknown>;
  const question = typeof b.question === "string" ? b.question.trim() : "";
  if (question.length < 1 || question.length > 120) return { ok: false, error: "question must be 1 to 120 characters" };
  const image = b.image;
  if (typeof image !== "string" || !PREFIXES.some((p) => image.startsWith(p))) {
    return { ok: false, error: "image must be a png or jpeg data URI" };
  }
  if (image.length > MAX_IMAGE_CHARS) return { ok: false, error: "image must be under 1 MiB" };
  return { ok: true, value: { question, image } };
}
