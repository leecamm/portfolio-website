import { StrictMode } from "react";
import { render, fireEvent } from "@testing-library/react";
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { gsap, ScrollTrigger } from "../lib/gsap";
import Preloader from "./Preloader";

// GSAP's ticker does not run under fake timers, so the module is stubbed: the countdown is inert
// and the wipe completes at once. What is under test is the component's own lifecycle logic.
vi.mock("../lib/gsap", async () => {
  const { useLayoutEffect } = await import("react");
  const timeline = () => {
    const tl = { fromTo: () => tl, to: () => tl, progress: () => tl };
    return tl;
  };
  return {
    MOTION: { any: "(prefers-reduced-motion: no-preference)" },
    ScrollTrigger: { refresh: vi.fn() },
    gsap: {
      timeline,
      utils: { toArray: (selector, scope) => [...scope.querySelectorAll(selector)] },
      fromTo: vi.fn((el, from, to) => to.onComplete?.()),
      to: vi.fn((el, to) => to.onComplete?.()),
    },
    // like useGSAP: run once on mount, hand over contextSafe, call the returned cleanup on unmount
    useGSAP: (callback) => useLayoutEffect(() => callback({}, (fn) => fn), []),
  };
});

const html = document.documentElement;

function mount(onDone, { strict = false } = {}) {
  const tree = (
    <>
      <Preloader onDone={onDone} />
      <nav>
        <a href="#home">home</a>
      </nav>
    </>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

beforeEach(() => {
  vi.useFakeTimers();
  html.style.overflow = "clip"; // a previous value the preloader must hand back
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  sessionStorage.clear();
  html.style.overflow = "";
});

it("finishes exactly once when Escape and the timers both fire, even under StrictMode's double run", async () => {
  const onDone = vi.fn();
  mount(onDone, { strict: true });
  fireEvent.keyDown(window, { key: "Escape" });
  await vi.advanceTimersByTimeAsync(5000); // min wait and the 4 s cap both elapse
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(gsap.fromTo).toHaveBeenCalledTimes(1);
  expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
});

it("locks the page while up, then restores overflow, removes inert and records the launch", async () => {
  const onDone = vi.fn();
  const { container } = mount(onDone);
  const nav = container.querySelector("nav");
  expect(html.style.overflow).toBe("hidden");
  expect(nav).toHaveAttribute("inert");
  expect(sessionStorage.getItem("launched")).toBeNull();

  await vi.advanceTimersByTimeAsync(1600); // fonts and load are already done in jsdom; min wait elapses
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(html.style.overflow).toBe("clip");
  expect(nav).not.toHaveAttribute("inert");
  expect(sessionStorage.getItem("launched")).toBe("1");
});

it("cleans up on unmount without finishing: listener removed, overflow and inert restored", () => {
  const add = vi.spyOn(window, "addEventListener");
  const remove = vi.spyOn(window, "removeEventListener");
  const onDone = vi.fn();
  const { container, unmount } = mount(onDone);
  const nav = container.querySelector("nav");
  const onKey = add.mock.calls.find(([type]) => type === "keydown")[1];
  unmount();
  expect(remove).toHaveBeenCalledWith("keydown", onKey);
  expect(html.style.overflow).toBe("clip");
  expect(nav).not.toHaveAttribute("inert");
  vi.advanceTimersByTime(5000);
  expect(onDone).not.toHaveBeenCalled();
});

it("ignores modified keys and swallows the Space/Enter it uses to skip", () => {
  const onDone = vi.fn();
  mount(onDone);
  fireEvent.keyDown(window, { key: "Escape", ctrlKey: true });
  fireEvent.keyDown(window, { key: " ", metaKey: true });
  expect(onDone).not.toHaveBeenCalled();
  const notPrevented = fireEvent.keyDown(window, { key: " " });
  expect(notPrevented).toBe(false); // preventDefault was called
  expect(onDone).toHaveBeenCalledTimes(1);
});

it("still reveals the page when ScrollTrigger.refresh throws", () => {
  ScrollTrigger.refresh.mockImplementationOnce(() => {
    throw new Error("boom");
  });
  const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
  const onDone = vi.fn();
  mount(onDone);
  expect(() => fireEvent.keyDown(window, { key: "Escape" })).not.toThrow();
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(debug).toHaveBeenCalled();
});
