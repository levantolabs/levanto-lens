"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Gauge from "@/components/Gauge";
import Sparkline from "@/components/Sparkline";
import { fitLongEdge } from "@/lib/frame";
import { pillClass } from "@/lib/pill";
import { initialSession, sessionReducer } from "@/lib/session";

const MIN_INTERVAL_MS = 900;
const WAKING_AFTER_MS = 5000;
const JPEG_QUALITY = 0.7;
const DEFAULT_QUESTION = "Is someone in the frame?";

export default function Lens() {
  const [s, dispatch] = useReducer(sessionReducer, DEFAULT_QUESTION, initialSession);
  const [waking, setWaking] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const inFlight = useRef(false);
  const questionRef = useRef(s.question);
  questionRef.current = s.question;

  // Camera: (re)open whenever facing changes. Rear camera first; fall back to any camera.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      if (!navigator.mediaDevices?.getUserMedia) {
        dispatch({ type: "cameraFailed", error: "This browser has no camera API. On a phone the page must be served over HTTPS." });
        return;
      }
      try {
        let ms: MediaStream;
        try {
          ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: s.facing }, width: { ideal: 1280 } }, audio: false });
        } catch {
          ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) {
          ms.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = ms;
        if (video.current) {
          video.current.srcObject = ms;
          await video.current.play().catch(() => {});
        }
        dispatch({ type: "cameraReady" });
      } catch (err) {
        dispatch({ type: "cameraFailed", error: err instanceof Error ? err.message : "Camera unavailable" });
      }
    })();
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, [s.facing]);

  const grab = useCallback((): string | null => {
    const v = video.current;
    if (!v || v.readyState < 2) return null;
    const { width, height } = fitLongEdge(v.videoWidth, v.videoHeight);
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, width, height);
    return c.toDataURL("image/jpeg", JPEG_QUALITY);
  }, []);

  // The loop: one request in flight at a time, at most one every MIN_INTERVAL_MS.
  const seqRef = useRef(0);
  useEffect(() => {
    if (s.phase !== "running") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (stopped) return;
      const started = Date.now();
      const frame = inFlight.current ? null : grab();
      if (frame) {
        inFlight.current = true;
        const seq = ++seqRef.current;
        dispatch({ type: "sent" });
        const wake = setTimeout(() => setWaking(true), WAKING_AFTER_MS);
        try {
          const res = await fetch("/api/ask", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ question: questionRef.current, image: frame }),
          });
          const json = (await res.json()) as { answer: string | null; probability: number | null; meta: { model: string; latencyMs: number } } | { error: string };
          if (!res.ok || "error" in json) throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
          dispatch({ type: "reading", seq, p: json.probability, latencyMs: json.meta.latencyMs, model: json.meta.model });
        } catch (err) {
          dispatch({ type: "requestFailed", seq, error: err instanceof Error ? err.message : "request failed" });
        } finally {
          clearTimeout(wake);
          setWaking(false);
          inFlight.current = false;
        }
      }
      if (stopped) return;
      timer = setTimeout(tick, Math.max(0, MIN_INTERVAL_MS - (Date.now() - started)));
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [s.phase, grab]);

  const p = s.latest?.p ?? 0.5;
  const pct = Math.round(p * 100);
  const unsure = s.latest?.unsure ?? true;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-2 sm:mx-auto sm:w-full sm:max-w-md">
      <input
        value={s.question}
        onChange={(e) => dispatch({ type: "setQuestion", question: e.target.value })}
        placeholder="Is the door open?"
        aria-label="Yes/no question"
        maxLength={120}
        enterKeyHint="done"
        className="w-full shrink-0 rounded-none border border-hairline-dark bg-card px-4 py-3 text-[17px] text-ink outline-none focus:border-pine"
      />

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-none bg-console">
        <video ref={video} playsInline muted autoPlay className="h-full w-full object-cover" data-testid="lens-video" />
        {s.phase === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[14px] text-cream" role="alert">
            {s.error}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "flip" })}
            aria-label="Flip camera"
            className="rounded-full border border-cream/40 bg-console/60 px-4 py-2 font-mono text-[12px] text-cream backdrop-blur"
          >
            flip
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: s.phase === "paused" ? "resume" : "pause" })}
            disabled={s.phase === "idle" || s.phase === "error"}
            className="rounded-full border border-cream/40 bg-console/60 px-4 py-2 font-mono text-[12px] text-cream backdrop-blur disabled:opacity-40"
          >
            {s.phase === "paused" ? "resume" : "pause"}
          </button>
        </div>
      </div>

      <div className="shrink-0 rounded-none border border-hairline-dark bg-cream-soft px-4 pb-2 pt-3">
        <div className="flex items-end gap-4">
          <div className="w-[38%] shrink-0">
            <Gauge p={p} unsure={unsure} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-medium tracking-[-0.045em] text-5xl leading-none tabular-nums text-pine" data-testid="lens-pct">
                {s.latest ? `${pct}%` : "–"}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                {s.latest ? (unsure ? "unsure" : p >= 0.5 ? "yes" : "no") : s.phase === "running" ? "looking…" : s.phase}
              </span>
            </div>
            <Sparkline values={s.history.map((r) => r.p)} className="mt-1" />
          </div>
        </div>
        <div className="mt-1 font-mono text-[10.5px] text-ink-soft">
          <span className="block truncate" aria-live="polite">
            {s.error && s.phase === "running" ? (
              <button type="button" className="text-ember underline" onClick={() => dispatch({ type: "dismissError" })}>
                {s.error}
              </button>
            ) : waking ? (
              "waking Sage up (first call can take a minute)…"
            ) : s.latest ? (
              `${s.model} · ${Math.round(s.latest.latencyMs)}ms`
            ) : (
              "one frame a second"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
