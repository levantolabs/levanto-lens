/** Pure state for the live loop. The component owns timers and the network; this owns the truth. */
export type Phase = "idle" | "running" | "paused" | "error";

export interface Reading {
  /** 0..1; a null answer from Sage is stored as 0.5 and flagged unsure. */
  p: number;
  unsure: boolean;
  latencyMs: number;
}

export interface SessionState {
  phase: Phase;
  question: string;
  facing: "environment" | "user";
  /** Last HISTORY readings, oldest first. */
  history: Reading[];
  latest: Reading | null;
  model: string | null;
  error: string | null;
  /** Monotonic counter: responses tagged with an older seq are stale and dropped. */
  seq: number;
}

export type SessionAction =
  | { type: "setQuestion"; question: string }
  | { type: "cameraReady" }
  | { type: "cameraFailed"; error: string }
  | { type: "flip" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "sent" }
  | { type: "reading"; seq: number; p: number | null; latencyMs: number; model: string }
  | { type: "requestFailed"; seq: number; error: string }
  | { type: "dismissError" };

export const HISTORY = 30;

export const initialSession = (question = ""): SessionState => ({
  phase: "idle",
  question,
  facing: "environment",
  history: [],
  latest: null,
  model: null,
  error: null,
  seq: 0,
});

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case "setQuestion":
      return { ...s, question: a.question };
    case "cameraReady":
      return s.phase === "idle" || s.phase === "error" ? { ...s, phase: "running", error: null } : s;
    case "cameraFailed":
      return { ...s, phase: "error", error: a.error };
    case "flip":
      return { ...s, facing: s.facing === "environment" ? "user" : "environment" };
    case "pause":
      return s.phase === "running" ? { ...s, phase: "paused" } : s;
    case "resume":
      return s.phase === "paused" ? { ...s, phase: "running" } : s;
    case "sent":
      return { ...s, seq: s.seq + 1 };
    case "reading": {
      if (a.seq !== s.seq) return s; // stale: a newer frame is already in flight or landed
      const r: Reading = { p: a.p ?? 0.5, unsure: a.p === null, latencyMs: a.latencyMs };
      return { ...s, latest: r, model: a.model, history: [...s.history, r].slice(-HISTORY), error: null };
    }
    case "requestFailed":
      // A transient network error should not stop the loop; surface it and keep going.
      return a.seq !== s.seq ? s : { ...s, error: a.error };
    case "dismissError":
      return { ...s, error: null };
  }
}
