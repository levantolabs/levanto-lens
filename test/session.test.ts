import { HISTORY, initialSession, sessionReducer, type SessionState } from "@/lib/session";

const step = (s: SessionState, ...as: Parameters<typeof sessionReducer>[1][]) => as.reduce(sessionReducer, s);
const s0 = initialSession("Is the door open?");

test("camera ready starts running; pause and resume toggle; flip swaps facing", () => {
  const run = sessionReducer(s0, { type: "cameraReady" });
  expect(run.phase).toBe("running");
  expect(sessionReducer(run, { type: "pause" }).phase).toBe("paused");
  expect(step(run, { type: "pause" }, { type: "resume" }).phase).toBe("running");
  expect(sessionReducer(s0, { type: "flip" }).facing).toBe("user");
});

test("camera failure is an error state and cameraReady recovers from it", () => {
  const e = sessionReducer(s0, { type: "cameraFailed", error: "denied" });
  expect(e.phase).toBe("error");
  expect(sessionReducer(e, { type: "cameraReady" }).phase).toBe("running");
});

test("readings must match the latest seq; stale ones are dropped", () => {
  let s = step(s0, { type: "cameraReady" }, { type: "sent" }, { type: "sent" });
  expect(s.seq).toBe(2);
  s = sessionReducer(s, { type: "reading", seq: 1, p: 0.9, latencyMs: 400, model: "m" });
  expect(s.latest).toBeNull();
  s = sessionReducer(s, { type: "reading", seq: 2, p: 0.8, latencyMs: 400, model: "m" });
  expect(s.latest?.p).toBeCloseTo(0.8);
  expect(s.model).toBe("m");
});

test("null answer becomes 0.5 flagged unsure; history is capped", () => {
  let s = step(s0, { type: "cameraReady" });
  for (let i = 0; i < HISTORY + 5; i++) {
    s = sessionReducer(s, { type: "sent" });
    s = sessionReducer(s, { type: "reading", seq: s.seq, p: i === 0 ? null : 0.3, latencyMs: 1, model: "m" });
  }
  expect(s.history).toHaveLength(HISTORY);
  const first = step(s0, { type: "sent" }, { type: "reading", seq: 1, p: null, latencyMs: 1, model: "m" });
  expect(first.latest).toEqual({ p: 0.5, unsure: true, latencyMs: 1 });
});

test("a failed request surfaces an error but keeps running; a stale failure is ignored", () => {
  let s = step(s0, { type: "cameraReady" }, { type: "sent" });
  s = sessionReducer(s, { type: "requestFailed", seq: 1, error: "boom" });
  expect(s.phase).toBe("running");
  expect(s.error).toBe("boom");
  expect(sessionReducer(s, { type: "dismissError" }).error).toBeNull();
  expect(sessionReducer(s, { type: "requestFailed", seq: 0, error: "old" }).error).toBe("boom");
});
