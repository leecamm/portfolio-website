import "@testing-library/jest-dom/vitest";

// ponytail: every media query is false in tests, so GSAP's matchMedia branches never run
// and we assert against the static (reduced-motion) markup.
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
