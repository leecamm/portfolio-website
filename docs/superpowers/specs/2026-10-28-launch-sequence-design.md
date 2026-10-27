# Launch sequence: 3D Mission Control, preloader, performance

Date: 2026-10-28 · Branch: `redesign` · Builds on `2026-10-27-awwwards-redesign-design.md`

## Goal

Raise the site's creativity and polish scores: make Mission Control a real 3D signature moment,
add a launch-countdown preloader, and cut page weight so the first load stays fast.

## 1. Performance (do first)

- `src/assets/gradient.png` (8.8MB, 1440×3168) → `gradient.webp`, quality ~80, same size. Visually
  identical. Update the one Tailwind `bg-[url(...)]` reference.
- `mypixel.png` (5.6MB) and `finishmytask.png` (4.3MB), about 3000px wide → `.webp` at 1200px wide.
  Update `content.js` imports.
- Work card images: `loading="lazy"`, `decoding="async"`, explicit `width`/`height` (no layout shift).
- Tool: `cwebp` (installed via Homebrew). Originals are deleted from the repo (git history keeps them).
- Budget test: every image in `src/assets` (png/jpg/webp/svg) is ≤ 300KB. The CV PDF is exempt.
- The three.js scene (section 3) loads as a separate chunk via dynamic `import()`, so it adds nothing
  to the initial bundle.
- Measure: Lighthouse (mobile + desktop) against `yarn preview`, before and after. Target: mobile
  Performance ≥ 90, CLS < 0.1. Report LCP, CLS, TBT, and the JS bundle sizes.

## 2. Preloader

- A full-screen black overlay (`z-[60]`, above the nav) reusing the existing `.starfield` CSS layer.
  It shows a mono line `~/harry $ ./launch portfolio` and a countdown `T-3`, `2`, `1` (each beat
  scales and fades), then a curtain wipe (`clip-path` inset from the top) reveals the hero.
- It waits for real readiness, not a fake percentage: `document.fonts.ready` and window `load`.
  Minimum 1.6s so the countdown completes; maximum 4s cap so a slow network never hangs.
- Click, Escape, Enter or Space skips straight to the curtain wipe.
- Once per browser session: `sessionStorage["launched"] = "1"`, wrapped in try/catch; if storage
  fails, show it.
- While it is up: page scroll is locked (ScrollSmoother paused on desktop, `overflow: hidden` on
  `<html>` otherwise).
- The hero intro (title chars, copy, astronaut) starts when the curtain opens, not on mount.
  App holds a `launched` boolean; Hero receives it and builds its intro only once it is true.
- Not shown under `prefers-reduced-motion: reduce`, nor in tests (jsdom matchMedia is false).
  In both cases `launched` is true immediately.
- Accessibility: the overlay is `aria-hidden="true"`; the page content stays in the DOM underneath.
- Page transitions are out of scope: the site is a single page. They belong with future
  case-study pages.

## 3. Mission Control in 3D

The HTML stays the source of truth (heading, copy, four stage cards, status line). A WebGL canvas
sits behind it, inside the pinned panel.

Scene (plain `three`, no React Three Fiber, no GLB assets):
- **Stars:** `THREE.Points`, about 2500 on desktop and 700 on mobile, in a deep field. Slow drift;
  at liftoff they stretch into warp streaks (shader-based or LineSegments). Palette: white, indigo
  (`#a5b4fc`), violet (`#e9d5ff`).
- **Pipeline track:** a `CatmullRomCurve3` through four anchor points, one per stage. It is drawn as
  a thin glowing tube revealed progressively (draw range) as progress increases, with a small node
  marker at each stage.
- **Rocket:** low-poly, built from primitives (body cylinder, nose cone, fins, window). Colours are
  indigo/violet body and white trim; an ember flame (`#ff5023` → `#ff9811`, the cursor UFO's colours)
  uses an additive material with flicker. Lit by a key light and indigo/purple rim lights.
- **Choreography,** driven by one `progress` value (0 to 1) from the existing scrubbed, pinned
  ScrollTrigger timeline:
  - 0 to 0.75: the rocket rides the track (`getPointAt`, oriented to the tangent). As it passes
    each stage anchor, the matching HTML stage card lights up (existing dot/log/bar animation, now
    sequenced to the rocket).
  - 0.75 to 0.95: liftoff. The rocket pitches up, accelerates up and out of frame, the camera
    shakes slightly, a shockwave ring expands from the launch point, and the stars warp.
  - 0.95 to 1: stars settle back to a calm drift and "✓ deployed. all systems nominal." holds.
    The section ends at rest.
- Pointer parallax on desktop: the camera eases a few degrees toward the pointer.
- Mobile: vertical track, fewer stars, `devicePixelRatio` capped at 1.5 (2 on desktop), no pin;
  progress is scrubbed through the section as today.
- Rendering only while the section is near the viewport (ScrollTrigger `onToggle` or an
  IntersectionObserver) and the tab is visible. On unmount, dispose all geometries, materials and
  the renderer, and remove listeners.
- Loading: `import("../three/missionScene")` when the section comes within about one viewport of
  view. Until it loads, or if WebGL is unavailable, the current HTML/CSS version shows (with its
  astronaut and glow), so nothing is ever blank.
- Reduced motion: no WebGL at all. The current static final state shows.
- Accessibility: the canvas is `aria-hidden="true"`; all meaning stays in the HTML.

Module boundary: `src/three/missionScene.js` exports
`createMissionScene(canvas, { mobile }) → { setProgress(p), setPointer(x, y), start(), stop(), resize(), dispose() }`.
`MissionControl.jsx` owns the scroll timeline and calls the scene API. The scene owns no scroll
logic.

New dependency: `three@^0.186` only.

## Testing

- Unit (Vitest/jsdom):
  - the image budget test
  - the preloader renders nothing and `launched` is immediately true when motion is off
  - Mission still renders four stages in order and the status line
  - Mission renders a canvas only when motion is allowed (none in jsdom)
- Scene module: a small test that `createMissionScene` is a function and `dispose` is idempotent,
  if three can be constructed without a GL context. Otherwise this is covered by browser checks.
- Browser (Playwright + Chrome, production build):
  - desktop, 390px mobile and reduced-motion passes with zero console errors and no horizontal scroll
  - frames inspected through the preloader, the rocket riding the track, liftoff/warp and the
    settled end
  - the WebGL canvas actually renders (non-blank pixels) on desktop
- Lighthouse before and after.

## Out of scope

- Case-study pages and page transitions.
- Sound, React Three Fiber, GLB models, post-processing bloom (a later option).
- Pushing to GitHub.
