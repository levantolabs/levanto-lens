import { fitLongEdge, needleAngle, sparklinePoints } from "@/lib/frame";

test("fitLongEdge scales the long edge to 512 and never upscales", () => {
  expect(fitLongEdge(1920, 1080)).toEqual({ width: 512, height: 288 });
  expect(fitLongEdge(720, 1280)).toEqual({ width: 288, height: 512 });
  expect(fitLongEdge(300, 200)).toEqual({ width: 300, height: 200 });
});

test("needleAngle spans -90..90", () => {
  expect(needleAngle(0)).toBe(-90);
  expect(needleAngle(0.5)).toBe(0);
  expect(needleAngle(1)).toBe(90);
  expect(needleAngle(2)).toBe(90);
});

test("sparklinePoints right-aligns a short series and is empty for no data", () => {
  expect(sparklinePoints([], 100, 20, 30)).toBe("");
  const pts = sparklinePoints([0, 1], 100, 20, 30).split(" ");
  expect(pts).toHaveLength(2);
  expect(pts[1]).toBe("98.0,2.0"); // latest at the right edge, top for p=1
});
