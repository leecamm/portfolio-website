import { render, screen } from "@testing-library/react";
import { it, expect, vi, afterEach } from "vitest";
import App from "../App";
import { shouldShowPreloader } from "./Preloader";

const motionAllowed = () =>
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query === "(prefers-reduced-motion: no-preference)",
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }));

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

it("shows the preloader once per session when motion is allowed", () => {
  motionAllowed();
  expect(shouldShowPreloader()).toBe(true);
  sessionStorage.setItem("launched", "1");
  expect(shouldShowPreloader()).toBe(false);
});

it("never shows the preloader when motion is off", () => {
  expect(shouldShowPreloader()).toBe(false);
});

it("renders no preloader and the hero immediately when motion is off", () => {
  render(<App />);
  expect(screen.queryByText("~/harry $ ./launch portfolio")).toBeNull();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Xin chào! I'm Harry");
});
