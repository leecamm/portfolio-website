Goal
Work (tabbed cards), Toolbox (marquees) and a new Contact, then delete the legacy sections and deps (Task 4 of docs/superpowers/plans/2026-10-27-awwwards-redesign.md).

Acceptance Criteria

- All 7 sections render in order: home, about, journey, mission, work, toolbox, contact
- Work tabs switch between Ops / Design & Web / Mobile; Toolbox lists each tool once for assistive tech
- Project.jsx, Skills.jsx, percentage SVGs, react.svg and deps @headlessui/react, react-multi-carousel removed
- New ScrollTriggers wait for `ready` (created after ScrollSmoother), like Navbar/About/Journey/Mission
- `yarn test` and `yarn build` pass; verified in a real browser at desktop, 390px mobile, reduced-motion
- Committed on branch `redesign`

Files to touch

- src/components/Work.jsx, Toolbox.jsx (new); Contact.jsx, Footer.jsx
- src/App.jsx, src/App.test.jsx
- delete legacy components/assets; package.json, yarn.lock

Out of scope

- Hero title wrap fix, cursor flash, a11y polish (Task 5)
- Pushing to GitHub
