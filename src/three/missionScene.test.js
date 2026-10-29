import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMissionScene, supportsWebGL, STAGE_AT, LIFTOFF_AT } from "./missionScene";

// Real three for geometry, materials and math; only the renderer is faked, since jsdom has no WebGL.
const { renderers, fail } = vi.hoisted(() => ({ renderers: [], fail: { layout: false } }));
vi.mock("three", async (importOriginal) => {
  const three = await importOriginal();
  class WebGLRenderer {
    constructor() {
      this.info = {};
      this.render = vi.fn();
      this.dispose = vi.fn();
      this.forceContextLoss = vi.fn();
      renderers.push(this);
    }
    setPixelRatio() {}
    getPixelRatio() {
      return 1;
    }
    setSize() {}
    setClearColor() {}
  }
  class TubeGeometry extends three.TubeGeometry {
    constructor(...args) {
      if (fail.layout) throw new Error("layout failed");
      super(...args);
    }
  }
  return { ...three, WebGLRenderer, TubeGeometry };
});

// The glow sprite texture is drawn with a 2D canvas, which jsdom does not implement.
const fake2d = { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {}, fillStyle: "" };

function sizedCanvas(w = 1440, h = 900) {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { configurable: true, get: () => w });
  Object.defineProperty(canvas, "clientHeight", { configurable: true, get: () => h });
  return canvas;
}

class FakeResizeObserver {
  static instances = [];
  constructor(cb) {
    this.cb = cb;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    FakeResizeObserver.instances.push(this);
  }
}

beforeEach(() => {
  renderers.length = 0;
  fail.layout = false;
  FakeResizeObserver.instances.length = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((type) => (type === "2d" ? fake2d : null));
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("exposes the scene API and sync points", () => {
  expect(typeof createMissionScene).toBe("function");
  expect(STAGE_AT).toHaveLength(4);
  expect([...STAGE_AT].sort((a, b) => a - b)).toEqual(STAGE_AT);
  expect(STAGE_AT[3]).toBeLessThan(LIFTOFF_AT);
});

it("reports no WebGL in jsdom instead of throwing", () => {
  expect(supportsWebGL()).toBe(false);
});

it("disposes once: renderer freed, context dropped, listeners and observer removed", () => {
  const canvas = sizedCanvas();
  const docRemove = vi.spyOn(document, "removeEventListener");
  const canvasRemove = vi.spyOn(canvas, "removeEventListener");
  const scene = createMissionScene(canvas, { mobile: false });
  const [renderer] = renderers;
  const [ro] = FakeResizeObserver.instances;
  expect(ro.observe).toHaveBeenCalledWith(canvas);

  scene.dispose();
  expect(() => scene.dispose()).not.toThrow(); // idempotent

  expect(renderer.dispose).toHaveBeenCalledTimes(1);
  expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
  expect(ro.disconnect).toHaveBeenCalledTimes(1);
  expect(docRemove.mock.calls.filter(([type]) => type === "visibilitychange")).toHaveLength(1);
  expect(canvasRemove.mock.calls.map(([type]) => type).sort()).toEqual(["webglcontextlost", "webglcontextrestored"]);
});

it("falls back to the window resize event without ResizeObserver, and removes it", () => {
  vi.stubGlobal("ResizeObserver", undefined);
  const add = vi.spyOn(window, "addEventListener");
  const remove = vi.spyOn(window, "removeEventListener");
  const scene = createMissionScene(sizedCanvas(390, 1264), { mobile: true });
  const onResize = add.mock.calls.find(([type]) => type === "resize")?.[1];
  expect(onResize).toBeTypeOf("function");
  scene.dispose();
  expect(remove).toHaveBeenCalledWith("resize", onResize);
});

it("skips frames until the canvas has a size instead of throwing", () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  let w = 0;
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { get: () => w });
  Object.defineProperty(canvas, "clientHeight", { get: () => (w ? 900 : 0) });
  const scene = createMissionScene(canvas, { mobile: false });
  const [renderer] = renderers;
  scene.setProgress(0.5);
  scene.start();
  expect(() => vi.advanceTimersToNextFrame()).not.toThrow();
  expect(renderer.render).not.toHaveBeenCalled();

  w = 1440;
  scene.resize();
  vi.advanceTimersToNextFrame();
  expect(renderer.render).toHaveBeenCalledTimes(1);
  scene.dispose();
  vi.advanceTimersToNextFrame();
  expect(renderer.render).toHaveBeenCalledTimes(1); // the loop stopped
});

it("calls onLost only when a lost context is not restored in time", () => {
  vi.useFakeTimers();
  const onLost = vi.fn();
  const canvas = sizedCanvas();
  const scene = createMissionScene(canvas, { mobile: false, onLost });
  const lose = () => {
    const e = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(e);
    return e;
  };

  expect(lose().defaultPrevented).toBe(true); // lets the browser restore it
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  vi.advanceTimersByTime(5000);
  expect(onLost).not.toHaveBeenCalled();

  lose();
  vi.advanceTimersByTime(1999);
  expect(onLost).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(onLost).toHaveBeenCalledTimes(1);
  scene.dispose();
});

it("frees the renderer and attaches no listeners when the first layout fails", () => {
  fail.layout = true; // throws inside layout(), after the renderer and materials exist
  const docAdd = vi.spyOn(document, "addEventListener");
  expect(() => createMissionScene(sizedCanvas(), { mobile: false })).toThrow();
  const [renderer] = renderers;
  expect(renderer.dispose).toHaveBeenCalledTimes(1);
  expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
  expect(docAdd.mock.calls.some(([type]) => type === "visibilitychange")).toBe(false);
  expect(FakeResizeObserver.instances).toHaveLength(0);
});
