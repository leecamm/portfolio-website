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
    const tl = { fromTo: () => tl, to: () => tl, progress: () => tl, duration: () => 1.95 }; // 3 beats x 0.65 s
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

function mount(onDone, { strict = false, onExit } = {}) {
  const tree = (
    <>
      <Preloader onDone={onDone} onExit={onExit} />
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
  const onExit = vi.fn();
  mount(onDone, { strict: true, onExit });
  fireEvent.keyDown(window, { key: "Escape" });
  await vi.advanceTimersByTimeAsync(6000); // min wait, the 2.5 s cap and the failsafe all elapse
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledTimes(1);
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

  await vi.advanceTimersByTimeAsync(1949); // fonts are ready in jsdom; the countdown is still playing
  expect(gsap.fromTo).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); // the minimum is the countdown's own length
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

it("caps the wait at 2.5 s when fonts never settle", async () => {
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: new Promise(() => {}) } }); // jsdom has none
  try {
    const onDone = vi.fn();
    mount(onDone);
    await vi.advanceTimersByTimeAsync(2499);
    expect(gsap.fromTo).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(gsap.fromTo).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  } finally {
    delete document.fonts;
  }
});

it("starts the hero at 60% of the wipe and unmounts the curtain only at the end", () => {
  let wipe;
  gsap.fromTo.mockImplementationOnce((el, from, to) => (wipe = to)); // drive the wipe by hand
  const onDone = vi.fn();
  const onExit = vi.fn();
  mount(onDone, { onExit });
  fireEvent.keyDown(window, { key: "Escape" });
  wipe.onUpdate.call({ progress: () => 0.3 });
  expect(onDone).not.toHaveBeenCalled();
  wipe.onUpdate.call({ progress: () => 0.6 });
  wipe.onUpdate.call({ progress: () => 0.8 });
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(onExit).not.toHaveBeenCalled();
  expect(html.style.overflow).toBe("hidden"); // still locked until the curtain is gone
  wipe.onComplete();
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(html.style.overflow).toBe("clip");
});

it("drops the overlay by itself if GSAP never completes the wipe", async () => {
  gsap.fromTo.mockImplementationOnce(() => {}); // the ticker never runs (suspended rAF)
  const onDone = vi.fn();
  const onExit = vi.fn();
  const { container } = mount(onDone, { onExit });
  const overlay = container.firstChild;
  const nav = container.querySelector("nav");
  await vi.advanceTimersByTimeAsync(3999);
  expect(onDone).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); // MAX_MS + 1500
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(overlay).toHaveStyle({ display: "none" });
  expect(html.style.overflow).toBe("clip");
  expect(nav).not.toHaveAttribute("inert");
  expect(sessionStorage.getItem("launched")).toBe("1");
});
