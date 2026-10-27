Goal
GSAP core, content data, smooth-scroll shell (Navbar, Cursor), Hero and About (Task 2 of docs/superpowers/plans/2026-10-27-awwwards-redesign.md).

Acceptance Criteria

- src/lib/gsap.js registers ScrollTrigger, ScrollSmoother, SplitText, useGSAP and exports MOTION
- src/data/content.js holds all copy; content tests pass (no placeholder copy, no invented metrics)
- Hero (only h1), About, new Navbar and Cursor render; IntroBanner deleted
- Reduced motion / jsdom: all content visible, nothing hidden
- `yarn test` and `yarn build` pass
- Committed on branch `redesign`

Files to touch

- src/lib/gsap.js, src/data/content.js, src/data/content.test.js (new)
- src/components/Cursor.jsx, Hero.jsx, About.jsx (new); Navbar.jsx, Contact.jsx (h1 to h2 only)
- src/App.jsx, src/App.css, src/index.css, src/App.test.jsx, index.html, tailwind.config.cjs
- src/assets/ufo.svg (new); delete src/components/IntroBanner.jsx

Out of scope

- Journey, Mission Control, Work, Toolbox (Tasks 3-4)
- Removing Skills/Project/Footer or old deps (Task 4)
- Pushing to GitHub
