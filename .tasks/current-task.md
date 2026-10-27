Goal
Polish pass and full visual verification of the redesigned portfolio (Task 5 of docs/superpowers/plans/2026-10-27-awwwards-redesign.md).

Acceptance Criteria

- Hero greeting no longer breaks mid-word; UFO cursor doesn't show in the corner before first pointer move
- Deferred minors from Tasks 2-4 triaged: fix the cheap, valuable ones; list the rest as known
- Screenshot passes at 1440x900, 390x844, and reduced-motion with zero console errors; every frame inspected
- Keyboard pass: visible focus on nav, tabs, cards, form fields
- `yarn test` and `yarn build` pass
- Committed on branch `redesign`

Files to touch

- Only files where defects are found (src/components/*, src/App.css, src/App.test.jsx)

Out of scope

- New features, copy changes, new sections
- Pushing to GitHub
