import { validateAskBody } from "@/lib/validate";

const jpg = "data:image/jpeg;base64," + "A".repeat(100);
const png = "data:image/png;base64," + "A".repeat(100);

test("accepts png and jpeg and trims the question", () => {
  expect(validateAskBody({ question: " Is the door open? ", image: jpg })).toEqual({ ok: true, value: { question: "Is the door open?", image: jpg } });
  expect(validateAskBody({ question: "x", image: png }).ok).toBe(true);
});

test.each([
  [{ image: jpg }, /question/],
  [{ question: "", image: jpg }, /question/],
  [{ question: "x".repeat(121), image: jpg }, /question/],
  [{ question: "x", image: "data:image/gif;base64,AAAA" }, /png or jpeg/],
  [{ question: "x", image: "data:image/jpeg;base64," + "A".repeat(1_100_000) }, /1 MiB/],
  [null, /body/],
])("rejects %j", (body, msg) => {
  const r = validateAskBody(body);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toMatch(msg);
});
