import { it, expect } from "vitest";
import { createMissionScene, supportsWebGL, STAGE_AT, LIFTOFF_AT } from "./missionScene";

it("exposes the scene API and sync points", () => {
  expect(typeof createMissionScene).toBe("function");
  expect(STAGE_AT).toHaveLength(4);
  expect([...STAGE_AT].sort((a, b) => a - b)).toEqual(STAGE_AT);
  expect(STAGE_AT[3]).toBeLessThan(LIFTOFF_AT);
});

it("reports no WebGL in jsdom instead of throwing", () => {
  expect(supportsWebGL()).toBe(false);
});
