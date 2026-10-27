# Launch Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fast first load, a launch-countdown preloader, and a three.js Mission Control signature moment.

**Architecture:** Same Vite + React 19 + Tailwind 3.4 + GSAP app. The preloader is a React overlay gated by `prefers-reduced-motion` and sessionStorage; App holds a `launched` flag that delays the Hero intro. Mission Control keeps its HTML as the source of truth and lazily mounts a plain-three.js scene (`src/three/missionScene.js`) behind it, driven by the existing scrubbed ScrollTrigger progress.

**Tech Stack:** React 19, Vite 8, Tailwind 3.4, GSAP 3.15, three 0.186, Vitest 5, cwebp, Playwright-core + Chrome (scratchpad only), Lighthouse via npx (scratchpad only).

Spec: `docs/superpowers/specs/2026-10-28-launch-sequence-design.md`

## Global Constraints

- Package manager: **yarn**. Never add `package-lock.json`. The only new runtime dependency is `three@^0.186`.
- No invented numbers in copy.
- DOM animation: only `transform`, `opacity`, `clip-path` (plus `timeScale`). WebGL internals are exempt.
- Every GSAP animation inside `gsap.matchMedia()` using `MOTION.*`. Under reduced motion: no preloader, no WebGL, no smoother/pin/scrub; static markup is the final state.
- ScrollTriggers are created only after App's `ready` flag (the ScrollSmoother exists first).
- Exactly one `<h1>`. Section ids in order: `home, about, journey, mission, work, toolbox, contact`.
- three.js is loaded only via dynamic `import()` (separate chunk), never in the initial bundle.
- Use the installed three.js skills as reference: `.claude/skills/threejs-fundamentals/SKILL.md`, `threejs-performance`, `threejs-geometry`, `threejs-materials`, `threejs-shaders`, `threejs-animation` (they match three 0.186).
- Browser checks use the scratchpad runner: `/private/tmp/claude-501/-Users-duchieule-Development-Portfolio-website/02e52c30-7ff6-422f-8efe-7faedf59121d/scratchpad/runner/shots.mjs` (`node shots.mjs <url> <outDir> <w> <h> <no|reduce> <frames>`). Do not add playwright or lighthouse to the project.
- Branch `redesign`. Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push.

---

### Task 1: Performance (images, budget test, Lighthouse baseline)

**Files:**
- Create: `src/assets/gradient.webp`, `src/assets/mypixel.webp`, `src/assets/finishmytask.webp`, `src/assets/assets.test.js`
- Modify: `src/App.jsx` (gradient url), `src/data/content.js` (image imports), `src/components/Work.jsx` (img attrs)
- Delete: `src/assets/gradient.png`, `src/assets/mypixel.png`, `src/assets/finishmytask.png`

**Interfaces:** Produces the image budget test that later tasks must keep green.

- [ ] **Step 1: Lighthouse baseline** (before any change)

```bash
cd "/Users/duchieule/Development/Portfolio website/portfolio-web" && yarn build && (yarn preview --port 4173 --strictPort > /tmp/prev.log 2>&1 &) && sleep 3
SC=/private/tmp/claude-501/-Users-duchieule-Development-Portfolio-website/02e52c30-7ff6-422f-8efe-7faedf59121d/scratchpad
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd $SC && npx -y lighthouse http://localhost:4173 --chrome-path="$CHROME" --chrome-flags="--headless=new" --only-categories=performance --form-factor=mobile --output=json --output-path=$SC/lh-before-mobile.json --quiet
npx -y lighthouse http://localhost:4173 --chrome-path="$CHROME" --chrome-flags="--headless=new" --only-categories=performance --preset=desktop --output=json --output-path=$SC/lh-before-desktop.json --quiet
node -e 'for (const f of process.argv.slice(1)) { const r = require(f); const a = r.audits; console.log(f.split("/").pop(), "score", Math.round(r.categories.performance.score*100), "LCP", a["largest-contentful-paint"].displayValue, "CLS", a["cumulative-layout-shift"].displayValue, "TBT", a["total-blocking-time"].displayValue, "bytes", a["total-byte-weight"].displayValue); }' $SC/lh-before-mobile.json $SC/lh-before-desktop.json
```

Record the numbers in the report.

- [ ] **Step 2: Write the failing budget test** — `src/assets/assets.test.js`:

```js
import { readdirSync, statSync } from "node:fs";
import { it, expect } from "vitest";

const dir = new URL("./", import.meta.url);

it("keeps every image asset at or under 300KB", () => {
  for (const file of readdirSync(dir)) {
    if (!/\.(png|jpe?g|webp|avif|svg)$/i.test(file)) continue;
    expect(statSync(new URL(file, dir)).size, file).toBeLessThanOrEqual(300 * 1024);
  }
});
```

- [ ] **Step 3: Run to verify failure** — `yarn test src/assets` → FAIL naming `finishmytask.png`, `gradient.png`, `mypixel.png`.

- [ ] **Step 4: Convert images**

```bash
cd "/Users/duchieule/Development/Portfolio website/portfolio-web/src/assets"
cwebp -quiet -q 80 gradient.png -o gradient.webp
cwebp -quiet -q 80 -resize 1200 0 mypixel.png -o mypixel.webp
cwebp -quiet -q 80 -resize 1200 0 finishmytask.png -o finishmytask.webp
ls -la *.webp
```

If `gradient.webp` shows visible banding versus the PNG (compare screenshots of the Contact section), retry with `-q 90` or add `-noalpha`; keep it ≤ 300KB.

- [ ] **Step 5: Update references**
  - `src/App.jsx`: `bg-[url('../src/assets/gradient.png')]` → `bg-[url('../src/assets/gradient.webp')]`.
  - `src/data/content.js`: `../assets/finishmytask.png` → `../assets/finishmytask.webp`, `../assets/mypixel.png` → `../assets/mypixel.webp`.
  - `src/components/Work.jsx`, on the card `<img>`: add `loading="lazy" decoding="async" width={1200} height={675}` (the `aspect-video object-cover` classes stay; the attributes reserve space).

```bash
git rm src/assets/gradient.png src/assets/mypixel.png src/assets/finishmytask.png
grep -rn "gradient.png\|mypixel.png\|finishmytask.png" src index.html || echo "no stale refs"
```

- [ ] **Step 6: Tests + build** — `yarn test && yarn build` → all PASS, and the build output lists the three `.webp` files.

- [ ] **Step 7: Lighthouse after.** Repeat Step 1's commands with output names `lh-after-*.json`; restart preview after rebuilding. Also shoot the Contact and Work sections at 1440 to compare the gradient visually with the baseline (runner `shots.mjs`, Read the PNGs).

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "perf: convert heavy images to webp, lazy-load work images, add asset budget test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Launch-countdown preloader

**Files:**
- Create: `src/components/Preloader.jsx`, `src/components/Preloader.test.jsx`
- Modify: `src/App.jsx`, `src/components/Hero.jsx`

**Interfaces:**
- Produces `Preloader` (default export, props `{ onDone: () => void }`) and named `shouldShowPreloader(): boolean`.
- App: `const [launched, setLaunched] = useState(() => !shouldShowPreloader())`; renders `{!launched && <Preloader onDone={() => setLaunched(true)} />}`; passes `launched` to `<Hero launched={launched} />`.
- Hero: builds its intro only when `launched` is true (`dependencies: [launched]`).

- [ ] **Step 1: Write failing tests** — `src/components/Preloader.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run to verify failure** — `yarn test src/components/Preloader.test.jsx` → FAIL (cannot resolve `./Preloader`).

- [ ] **Step 3: Create `src/components/Preloader.jsx`**

```jsx
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION } from "../lib/gsap";

const MIN_MS = 1600; // long enough for the countdown to finish
const MAX_MS = 4000; // a slow network never hangs the page

function alreadyLaunched() {
  try {
    return sessionStorage.getItem("launched") === "1";
  } catch {
    return false;
  }
}

export function shouldShowPreloader() {
  return window.matchMedia(MOTION.any).matches && !alreadyLaunched();
}

const pageLoaded = () =>
  document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true }));

export default function Preloader({ onDone }) {
  const root = useRef();

  useGSAP(
    () => {
      const html = document.documentElement;
      html.style.overflow = "hidden"; // ScrollSmoother rides native scroll, so this locks it too

      const count = gsap.timeline();
      gsap.utils.toArray(".preloader-beat", root.current).forEach((beat) => {
        count
          .fromTo(beat, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power3.out" })
          .to(beat, { opacity: 0, duration: 0.2 }, "+=0.2");
      });

      let finished = false;
      const finish = () => {
        if (finished || !root.current) return;
        finished = true;
        count.progress(1);
        gsap.to(root.current, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.9,
          ease: "expo.inOut",
          onComplete: () => {
            html.style.overflow = "";
            try {
              sessionStorage.setItem("launched", "1");
            } catch {
              /* storage blocked: the countdown just plays again next time */
            }
            ScrollTrigger.refresh();
            onDone();
          },
        });
      };

      Promise.all([document.fonts?.ready ?? Promise.resolve(), pageLoaded(), new Promise((r) => setTimeout(r, MIN_MS))]).then(finish);
      const cap = setTimeout(finish, MAX_MS);
      const onKey = (e) => ["Escape", "Enter", " "].includes(e.key) && finish();
      window.addEventListener("keydown", onKey);
      root.current.addEventListener("click", finish);

      return () => {
        clearTimeout(cap);
        window.removeEventListener("keydown", onKey);
        html.style.overflow = "";
      };
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center bg-black font-mono [clip-path:inset(0%_0%_0%_0%)]"
    >
      <div className="starfield absolute inset-0 opacity-70" />
      <p className="relative text-sm text-purple-300">~/harry $ ./launch portfolio</p>
      <div className="relative mt-6 grid h-24 place-items-center">
        {["T-3", "2", "1"].map((beat) => (
          <span key={beat} className="preloader-beat col-start-1 row-start-1 font-sans text-7xl font-bold text-gray-50 opacity-0">
            {beat}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into `src/App.jsx`**: import `Preloader, { shouldShowPreloader }`; add `const [launched, setLaunched] = useState(() => !shouldShowPreloader());`; render `{!launched && <Preloader onDone={() => setLaunched(true)} />}` just before `<Navbar …/>`; change `<Hero />` to `<Hero launched={launched} />`. Leave the `ready`/ScrollSmoother logic untouched.

- [ ] **Step 5: Gate the Hero intro** — in `src/components/Hero.jsx`: signature `export default function Hero({ launched })`; first line of the `useGSAP` callback `if (!launched) return;`; options `{ scope: root, dependencies: [launched] }`. Nothing else changes.

- [ ] **Step 6: Tests + build** — `yarn test && yarn build` → all PASS.

- [ ] **Step 7: Browser check** (production build via `yarn build && yarn preview --port 4173`): write a scratchpad Playwright script that loads the page at 1440×900, screenshots at 300ms, 900ms, 1500ms, 2300ms and 3200ms, then asserts the overlay is gone (`document.querySelector('[class*="z-[60]"]') === null`), the h1 is visible, and `document.documentElement.style.overflow === ""`. Reload in the same context: the overlay must not appear (session). With `reducedMotion: "reduce"`: there's never an overlay. Press Escape at 400ms: the overlay starts wiping immediately. Zero console errors. Read the screenshots.

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat: launch-countdown preloader, hero intro starts on curtain open

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Mission Control in three.js

This is a judgment-heavy task. The interface, integration and acceptance behaviour are fixed; the scene's internals are up to the implementer, within the spec.

**Files:**
- Create: `src/three/missionScene.js`, `src/three/missionScene.test.js`
- Modify: `src/components/MissionControl.jsx`, `src/App.test.jsx` (one new assertion), `package.json`/`yarn.lock` (`yarn add three@^0.186`)

**Interfaces:**
- `src/three/missionScene.js` exports:
  - `supportsWebGL(): boolean`: tries `canvas.getContext("webgl2") || canvas.getContext("webgl")` on a throwaway canvas.
  - `createMissionScene(canvas: HTMLCanvasElement, { mobile: boolean }) → { setProgress(p: number), setPointer(x: number, y: number), start(), stop(), resize(), dispose() }`
    - `p` ∈ [0, 1]: the whole choreography (see spec §3).
    - `x`, `y` ∈ [-0.5, 0.5]: normalized pointer for camera parallax (desktop only; the caller decides).
    - `start()`/`stop()` control the rAF loop; `stop()` also runs while the tab is hidden (the scene listens to `visibilitychange` itself).
    - `resize()` reads `canvas.clientWidth/clientHeight`; the scene also listens to window `resize` itself.
    - `dispose()` is idempotent: it stops the loop, disposes every geometry, material and texture plus the renderer (`renderer.dispose()`, `forceContextLoss()`), and removes listeners.
  - The module has no GSAP or ScrollTrigger imports.
  - Stage anchor progress values are exported as `STAGE_AT = [0.12, 0.3, 0.48, 0.66]` (the rocket reaches stage i at `STAGE_AT[i]`), and `LIFTOFF_AT = 0.75`, so the DOM timeline can sync to them.
- `MissionControl.jsx` keeps its HTML. It adds `<canvas aria-hidden="true" className="mission-canvas pointer-events-none absolute inset-0 h-full w-full" />` as the first child of `.mission-panel`, plus a `has3d` state. When `has3d` is true, the 2D fallback (`.mission-glow` and the `.mission-rocket` astronaut) is hidden via `opacity-0` classes, and the card backgrounds become slightly translucent so the scene shows through. Text stays readable: keep or strengthen the scrim behind the copy and cards if the screenshots show poor contrast.

- [ ] **Step 1: Add three** — `yarn add three@^0.186`.

- [ ] **Step 2: Write failing tests**
  - `src/three/missionScene.test.js`:

```js
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
```

  - Append to `src/App.test.jsx`:

```jsx
it("keeps mission control readable without WebGL", () => {
  const { container } = render(<App />);
  const mission = container.querySelector("#mission");
  expect(mission.querySelectorAll(".mission-stage")).toHaveLength(4);
  expect(within(mission).getByText("✓ deployed. all systems nominal.")).toBeInTheDocument();
  expect(mission.querySelector(".mission-rocket")).not.toBeNull(); // 2D fallback present
});
```

- [ ] **Step 3: Run to verify failure** — `yarn test` → missionScene test FAILs (module missing). (The App test may already pass; that's fine, it's a guard.)

- [ ] **Step 4: Implement `src/three/missionScene.js`** per spec §3, the interface above, and the three.js skills. Minimum content:
  - `WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: "high-performance" })`; `setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2))`; `outputColorSpace = SRGBColorSpace`; ACES tone mapping.
  - A PerspectiveCamera framing the track; the track is left to right on desktop and top to bottom on mobile.
  - Stars: `Points` with `BufferGeometry` (2500 / 700) and a small custom `ShaderMaterial` with a `uWarp` uniform that stretches and brightens along view depth at liftoff (or a parallel `LineSegments` streak layer faded in by warp). Additive blending, depthWrite false.
  - Track: `CatmullRomCurve3` through 4 anchors → `TubeGeometry`; reveal with `geometry.setDrawRange(0, Math.floor(indexCount * reveal))`, where `reveal` follows the rocket. Emissive indigo→violet. Small glowing node spheres at the anchors, which brighten once passed.
  - Rocket: a `Group` of primitives (`CylinderGeometry` body, `ConeGeometry` nose, 3 or 4 fins from `BoxGeometry` or `ExtrudeGeometry`, a `TorusGeometry`/`CircleGeometry` window), `MeshStandardMaterial` in the palette, and a flame cone with additive `MeshBasicMaterial` (`#ff5023`→`#ff9811`) whose scale flickers per frame. Key `DirectionalLight` plus indigo and purple rim `PointLight`s plus a low `AmbientLight`.
  - `setProgress(p)` stores a target; each frame eases the current value toward the target (small lerp), so scrubbing feels smooth:
    - Before `LIFTOFF_AT`: position = `curve.getPointAt(map(p, 0, LIFTOFF_AT))`, and the orientation follows the tangent.
    - From `LIFTOFF_AT` to 0.95: the rocket pitches up and accelerates upward and out of frame, with a camera shake that decays and an expanding, fading shockwave ring (`RingGeometry`), and `uWarp` peaks.
    - From 0.95 to 1: `uWarp` → 0, a calm drift, and the rocket is gone.
  - Pointer: the camera eases up to ±3° toward `setPointer`.
  - Performance: reuse geometries and materials; no per-frame allocations; dispose everything.

- [ ] **Step 5: Integrate in `src/components/MissionControl.jsx`**. Keep the existing panel clip-path entrance, pin and timeline semantics. Add the following inside the existing `mm.add({ desktop, mobile }, (ctx) => { … })` (after the timeline is built):

```jsx
// at top: import { gsap, ScrollTrigger, useGSAP, MOTION } from "../lib/gsap";
//         const canvasRef = useRef(); const sceneRef = useRef(null); const [has3d, setHas3d] = useState(false);

let disposed = false;
const state = { p: 0 };
ScrollTrigger.create({
  trigger: root.current,
  start: "top bottom+=100%", // about one viewport before the section arrives
  once: true,
  onEnter: () => {
    import("../three/missionScene").then(({ createMissionScene, supportsWebGL }) => {
      if (disposed || !supportsWebGL() || !canvasRef.current) return;
      sceneRef.current = createMissionScene(canvasRef.current, { mobile: !desktop });
      sceneRef.current.setProgress(state.p);
      setHas3d(true);
    });
  },
});
ScrollTrigger.create({
  trigger: root.current,
  start: "top bottom",
  end: "bottom top",
  onToggle: (self) => (self.isActive ? sceneRef.current?.start() : sceneRef.current?.stop()),
});
const onPointer = (e) => sceneRef.current?.setPointer(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
if (desktop) window.addEventListener("pointermove", onPointer);

return () => {
  disposed = true;
  window.removeEventListener("pointermove", onPointer);
  sceneRef.current?.dispose();
  sceneRef.current = null;
  setHas3d(false);
};
```

  Feed progress from the main timeline's ScrollTrigger: add `onUpdate: (self) => { state.p = self.progress; sceneRef.current?.setProgress(self.progress); }` to both the desktop and mobile `scrollTrigger` configs of `tl` (declare `disposed`/`state` before building `tl`).

  Re-sequence the stage-card tweens so card i finishes lighting when timeline progress reaches `STAGE_AT[i]`, and the status line, glow and 2D-rocket tweens start at `LIFTOFF_AT`. Build the timeline with an explicit total duration of 1 and absolute positions, e.g. `tl.from(stage, {…, duration: 0.06}, STAGE_AT[i] - 0.06)`, plus `.to({}, { duration: 0 }, 1)` at the end, so progress maps one-to-one. Import `STAGE_AT`/`LIFTOFF_AT` from the scene module statically? **No**: that would pull three into the main chunk. Instead, move the two constants to `src/data/content.js` as `missionTiming = { stageAt: [0.12, 0.3, 0.48, 0.66], liftoffAt: 0.75 }`, and have `missionScene.js` re-export them from there (the scene test still imports them from the scene module).

- [ ] **Step 6: Tests + build** — `yarn test && yarn build` → all PASS. The build must show a separate chunk containing three (e.g. `missionScene-*.js`), and the main `index-*.js` must not grow by more than ~5KB gz versus before this task. Report both sizes.

- [ ] **Step 7: Browser verification** (production build, `yarn preview --port 4173`; sessionStorage `launched=1` set via `addInitScript` so the preloader doesn't interfere):
  - Desktop 1440×900, motion allowed: scroll to Mission and wait for the scene; assert `canvas.mission-canvas` is non-blank (sample `toDataURL()` or screenshot pixel variance in the canvas rect). Take ~16 frames across the pinned span. Read them: the rocket rides the track, cards light in sync as it passes, liftoff with warp streaks, and a calm settled end with the status line. Zero console errors and no WebGL warnings.
  - Mobile 390×844: vertical track, readable cards, no horizontal scroll, zero errors.
  - Reduced motion: no canvas rendered or no WebGL context created (check that no `webglcontextcreationerror`/context exists), and the static final state shows.
  - Performance sanity: in desktop Chrome, log `renderer.info` (expose `window.__missionSceneInfo` only when `import.meta.env.DEV`) or check that FPS stays smooth (`requestAnimationFrame` deltas over 2s mostly ≤ 20ms). Confirm the loop stops when scrolled away (rAF count stops increasing).
  - Lighthouse mobile again, since three loads lazily: the score must stay ≥ the post-Task-1 score minus 3.
  - Fix and re-shoot until clean.

- [ ] **Step 8: Commit**

```bash
git add -A src package.json yarn.lock
git commit -m "feat: three.js launch sequence for mission control

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
