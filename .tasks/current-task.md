Goal
Upgrade the portfolio to React 19 + Vite 8 and add a Vitest harness (Task 1 of docs/superpowers/plans/2026-10-27-awwwards-redesign.md).

Acceptance Criteria

- express, cors, nodemailer, @types/react, @types/react-dom removed
- react/react-dom ^19.3, vite ^8, @vitejs/plugin-react ^6, tailwindcss ^3.4 (not v4)
- `yarn test` runs Vitest in jsdom with the matchMedia stub; the characterization test passes
- `yarn build` succeeds
- Spec says Vite 8
- Committed on branch `redesign`

Files to touch

- package.json, yarn.lock
- vite.config.js
- src/test/setup.js (new)
- src/App.test.jsx (new)
- docs/superpowers/specs/2026-10-27-awwwards-redesign-design.md

Out of scope

- Any GSAP code, content changes, or component edits (Task 2+)
- Removing @headlessui/react or react-multi-carousel (Task 4)
- Pushing to GitHub
