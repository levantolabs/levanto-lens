import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Gauge from "@/components/Gauge";
import Sparkline from "@/components/Sparkline";
import Lens from "@/components/Lens";

beforeAll(() => {
  // jsdom has no camera or canvas: stub both like sketch's canvas test.
  const track = { stop: vi.fn() };
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) },
  });
  Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: vi.fn(async () => {}) });
  Object.defineProperty(HTMLVideoElement.prototype, "readyState", { configurable: true, get: () => 4 });
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { configurable: true, get: () => 1280 });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { configurable: true, get: () => 720 });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/jpeg;base64,ZmFrZQ==");
});
afterEach(() => vi.restoreAllMocks());

test("Gauge renders a needle whose transform follows the probability", async () => {
  render(<Gauge p={1} unsure={false} />);
  const g = screen.getByTestId("gauge-needle");
  await waitFor(() => expect(g.getAttribute("transform")).toMatch(/rotate\(/));
});

test("Sparkline renders a polyline", () => {
  const { container } = render(<Sparkline values={[0.2, 0.8]} />);
  expect(container.querySelector("polyline")?.getAttribute("points")).toContain(",");
});

test("Lens opens the camera, sends a frame with the question, shows the probability, and pauses", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ answer: "yes", probability: 0.82, meta: { model: "levanto-sage-v1.1", latencyMs: 400 } }), { status: 200 }),
  );
  render(<Lens />);
  fireEvent.change(screen.getByLabelText(/yes\/no question/i), { target: { value: "Is the door open?" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
  expect(body.question).toBe("Is the door open?");
  expect(body.image).toMatch(/^data:image\/jpeg;base64,/);
  await waitFor(() => expect(screen.getByTestId("lens-pct")).toHaveTextContent("82%"));
  expect(screen.getByText("yes")).toBeInTheDocument();
  const calls = fetchMock.mock.calls.length;
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
  });
  await new Promise((r) => setTimeout(r, 1000));
  expect(fetchMock.mock.calls.length).toBe(calls);
  expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
});

test("Lens shows the camera error when getUserMedia rejects", async () => {
  // The component retries once without facingMode, so both attempts must fail.
  const err = new Error("Permission denied");
  (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err).mockRejectedValueOnce(err);
  render(<Lens />);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/denied/i));
});
