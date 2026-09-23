import { LevantoClient } from "levanto";

let cached: LevantoClient | null = null;

/** Server-only. The key never reaches the browser. */
export function sageClient(): LevantoClient {
  if (cached) return cached;
  const apiKey = process.env.LEVANTO_API_KEY;
  if (!apiKey) throw new Error("LEVANTO_API_KEY is not set");
  cached = new LevantoClient({ apiKey, timeout: 90_000, reasoning: "off" });
  return cached;
}
