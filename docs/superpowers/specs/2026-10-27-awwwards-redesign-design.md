# Portfolio redesign: "Design ↔ Ops"

Date: 2026-10-27 · Branch: `redesign`

## Goal

Turn the 2022 portfolio into a scroll-driven, Awwwards-grade site for Harry (Duc Hieu) Le,
DevOps Engineer at Swisscom. Keep the existing visual identity and add GSAP motion. The scroll
tells the career story: design-led space theme first, then a switch into a "mission control"
terminal look for the DevOps work.

## Content source

LinkedIn export (Oct 2026):

- DevOps Engineer, Swisscom Rotterdam (Sep 2023 to present): GitLab CI/CD, monitoring system
  health, refactoring for maintainability, TypeScript, agentic AI development.
- iOS Developer, Swisscom Rotterdam (Feb 2023 to Sep 2023): Swift, ARKit.
- Frontend Developer, Accenture Utrecht (Oct 2021 to Mar 2022): Angular, TypeScript.
- BASc ICT & Media Design, Fontys (2019 to 2023).
- Languages: Vietnamese (native), English (full professional), Dutch (elementary).

No invented numbers anywhere. Case studies are written as qualitative descriptions; metrics are
added only when Harry supplies them.

## Visual identity (kept)

- Black base, `background.png` (indigo/violet space waves with stars), `gradient.png` (indigo to
  plum to ember dusk).
- Accent gradient `indigo-500 → purple-500`; text in gray-50/200/300; Poppins.
- Floating astronaut (`astronaut.svg`), custom cursor (`.tracker`).
- New: a monospace face for the Mission Control act only (JetBrains Mono, Google Fonts).

## Scroll journey

| # | Act | Behaviour | Backdrop |
|---|---|---|---|
| 1 | Hero | "Xin chào! I'm Harry" SplitText char reveal. Role rotates "DevOps Engineer / Designer / Developer". Layered depth: stars, waves, astronaut move at different rates on scroll and pointer. | `background.png` |
| 2 | About | The LinkedIn "people on both ends" sentence; words brighten as the reader scrolls (scrubbed opacity). | black |
| 3 | Journey | Pinned horizontal track: Fontys 2019 → Accenture 2021 → Swisscom iOS 2023 → Swisscom DevOps 2023 to now. Astronaut travels along it. Mobile: vertical timeline, no pin. | space fading to dark |
| 4 | Mission Control (peak) | Pinned, largest scroll span on the page. Terminal styling. Pipeline stages `build → test → release → deploy` light up in sequence with typed log lines, ending in a liftoff. | near-black, monospace |
| 5 | Work | Tabs: Ops (5 case studies), Design & Web (Pomodoro, My Pixel), Mobile (Levart Travel). Clip-path reveal, pointer tilt. | black |
| 6 | Toolbox | Two opposite-direction marquees (design/front-end tools, ops tools); speed follows scroll velocity. | black |
| 7 | Contact | Dusk gradient, "Let's build something reliable.", magnetic button, existing EmailJS form, footer. | `gradient.png` |

Global: ScrollSmoother, custom cursor, navbar hides on scroll down and returns on scroll up.

Ops case studies (titles fixed, copy qualitative):
1. Maintaining GitLab CI/CD
2. Release & deployment
3. Agentic AI work
4. Front-end refactor
5. Continuous improvements

Removed: skill percentage circles (`75per/80per/90per/95per.svg`), "Scroll down to explore" cue
and bouncing arrow, placeholder "coffee" project entries.

## Architecture

- Stack: React 19, Vite 6, Tailwind 3.4 (stay on v3 so existing classes keep working).
- Add `gsap`, `@gsap/react`. Plugins used: ScrollTrigger, ScrollSmoother, SplitText (free since
  GSAP 3.13).
- Remove unused `express`, `cors`, `nodemailer`, and `react-multi-carousel` (only used by
  `Skills.jsx`, which is replaced).
- scroll-craft (audited, safe) is used as design guidance only (pacing, single peak,
  reduced-motion, mobile composition). Its engine is not used.

```
src/
  lib/gsap.js          register plugins once, export gsap
  data/content.js      all copy: bio, journey, case studies, projects, tools
  components/
    Navbar.jsx  Hero.jsx  About.jsx  Journey.jsx  MissionControl.jsx
    Work.jsx  Toolbox.jsx  Contact.jsx  Footer.jsx  Cursor.jsx
  App.jsx              ScrollSmoother wrapper + section order
```

Animation rules:
- Each component owns its timeline through `useGSAP({ scope })`; cleanup is automatic.
- `gsap.matchMedia()` splits desktop (`min-width: 768px`), mobile, and `prefers-reduced-motion`.
- Reduced motion: no smoothing, no pinning, no scrub; all content visible in its final state.
- Animate only `transform`, `opacity`, `clip-path`.

## Testing

Vitest + Testing Library + jsdom.
- `content.test.js`: every case study and project has a title and description; no placeholder
  copy ("coffee") remains; nothing matching a percentage or metric pattern is present in case
  studies.
- `App.test.jsx`: all seven sections render with their headings; every nav link targets an
  existing section id; with reduced motion mocked, content renders without hidden styles.
- Visual check: screenshots at 1440×900, 390×844, and reduced-motion.

## Delivery (one commit and session each)

1. Dependency upgrade + test setup
2. Content data + Hero + About
3. Journey + Mission Control
4. Work + Toolbox + Contact
5. Polish + screenshot verification

## Out of scope

- Backend or server code, CMS, i18n, blog.
- WebGL/3D.
- Hosting/deploy changes for harryle.dev.
