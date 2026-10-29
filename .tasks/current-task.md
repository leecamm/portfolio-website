Goal
Launch sequence: performance pass, launch-countdown preloader, three.js Mission Control (docs/superpowers/plans/2026-10-28-launch-sequence.md, Tasks 1-3).

Acceptance Criteria

- Heavy images converted to webp; every image asset <= 300KB (budget test); Lighthouse before/after recorded
- Preloader: countdown, real-readiness wait (1.6s min, 4s cap), skip on click/Esc, once per session, none under reduced motion; hero intro starts on curtain open
- Mission Control: three.js rocket rides the pipeline track, liftoff with warp, lazy-loaded chunk, HTML fallback when no WebGL or reduced motion
- `yarn test` and `yarn build` pass; verified in real Chrome (desktop, 390px, reduced motion)
- Committed on branch `redesign`

Files to touch

- See plan per task

Out of scope

- Case-study pages, page transitions, sound, R3F, GLB models, bloom
- Pushing to GitHub
