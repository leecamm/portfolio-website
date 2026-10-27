# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Harry Le's portfolio as a GSAP scroll-driven "Design ↔ Ops" site that keeps the existing space identity.

**Architecture:** Same Vite + React + Tailwind app, upgraded. `src/lib/gsap.js` registers plugins once and exports media queries; every component owns its animation through `useGSAP({ scope })` + `gsap.matchMedia()`. All copy lives in `src/data/content.js`. Static markup is always the complete final state; GSAP only animates *from* hidden states, so reduced-motion (and tests) see everything.

**Tech Stack:** React 19, Vite 8, Tailwind 3.4, GSAP 3.15 (ScrollTrigger, ScrollSmoother, SplitText), @gsap/react, Vitest 5 + Testing Library + jsdom, yarn.

Spec: `docs/superpowers/specs/2026-10-27-awwwards-redesign-design.md`

## Global Constraints

- Package manager: **yarn** (`yarn.lock` is committed). Never add `package-lock.json`.
- Versions: `react@^19.3`, `react-dom@^19.3`, `vite@^8`, `@vitejs/plugin-react@^6`, `tailwindcss@^3.4` (NOT v4), `gsap@^3.15`, `@gsap/react@^2.1`, `vitest@^5`.
- No invented numbers in any copy: no percentages, multipliers, or metrics.
- Animate only `transform`, `opacity`, `clip-path` (plus tween `timeScale`).
- Every animation lives inside `gsap.matchMedia()` using `MOTION.desktop`, `MOTION.mobile` or `MOTION.any`. Under `prefers-reduced-motion: reduce` nothing animates and no smoother/pin is created.
- Static markup = final visual state. Never hide content with CSS waiting for JS to reveal it.
- Palette: black base, `background.png`, `gradient.png`, accent `from-indigo-500 to-purple-500`, text gray-50/200/300, Poppins; JetBrains Mono only for Mission Control and small labels.
- Exactly one `<h1>` on the page (Hero).
- Section ids, in order: `home, about, journey, mission, work, toolbox, contact`.
- Work on branch `redesign`. Commit message trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- One task per session: after a task's commit, stop and report.

---

### Task 1: Dependency upgrade + test harness

**Files:**
- Modify: `package.json` (via yarn), `vite.config.js`, `docs/superpowers/specs/2026-10-27-awwwards-redesign-design.md` (Vite 6 → Vite 8)
- Create: `src/test/setup.js`, `src/App.test.jsx`

**Interfaces:**
- Produces: `yarn test` (runs `vitest run`), jsdom env with a `window.matchMedia` stub whose `matches` is always `false` (so every `MOTION` query is off in tests).

- [ ] **Step 1: Remove unused server deps and stale type packages**

```bash
yarn remove express cors nodemailer @types/react @types/react-dom
```

- [ ] **Step 2: Upgrade runtime and build deps**

```bash
yarn add react@^19.3 react-dom@^19.3
yarn add -D vite@^8 @vitejs/plugin-react@^6 tailwindcss@^3.4 postcss@^8 autoprefixer@^10 \
  vitest@^5 jsdom @testing-library/react@^16 @testing-library/jest-dom
```

(`@headlessui/react` and `react-multi-carousel` stay until Task 4 removes the components that use them.)

- [ ] **Step 3: Add the test script**

In `package.json` `"scripts"` add: `"test": "vitest run"`.

- [ ] **Step 4: Configure Vitest** — replace `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
```

- [ ] **Step 5: Create `src/test/setup.js`**

```js
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
```

- [ ] **Step 6: Write the characterization test** — `src/App.test.jsx`:

```jsx
import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import App from "./App";

it("renders the current hero greeting", () => {
  render(<App />);
  expect(screen.getByText("Xin Chào! I'm Harry")).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests and build**

Run: `yarn test && yarn build`
Expected: 1 test PASS; build completes with no errors. If React 19 breaks `react-multi-carousel` or `@headlessui/react` at runtime, note it, since Task 4 deletes both; do not patch them.

- [ ] **Step 8: Update the spec version line**

In the spec, change `React 19, Vite 6, Tailwind 3.4` to `React 19, Vite 8, Tailwind 3.4`.

- [ ] **Step 9: Commit**

```bash
git add package.json yarn.lock vite.config.js src/test/setup.js src/App.test.jsx docs/superpowers/specs
git commit -m "chore: upgrade to React 19 + Vite 8, add Vitest harness

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: GSAP core, content, shell (Navbar, Cursor, smoother), Hero, About

**Files:**
- Create: `src/lib/gsap.js`, `src/data/content.js`, `src/data/content.test.js`, `src/components/Cursor.jsx`, `src/components/Hero.jsx`, `src/components/About.jsx`, `src/assets/ufo.svg`
- Modify: `src/App.jsx`, `src/App.css`, `src/index.css`, `index.html`, `tailwind.config.cjs`, `src/components/Navbar.jsx`, `src/components/Contact.jsx` (h1 → h2 only), `src/App.test.jsx`
- Delete: `src/components/IntroBanner.jsx`

**Interfaces:**
- Produces `src/lib/gsap.js`: named exports `gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP, MOTION` where `MOTION = { desktop, mobile, any }` (media-query strings).
- Produces `src/data/content.js`: named exports `profile, navLinks, journey, pipeline, caseStudies, workTabs, tools` (shapes below). Later tasks import these names exactly.

- [ ] **Step 1: Write failing content tests** — `src/data/content.test.js`:

```js
import { describe, it, expect } from "vitest";
import * as content from "./content";

const { profile, journey, pipeline, caseStudies, workTabs, tools, navLinks } = content;

describe("content", () => {
  it("describes Harry today", () => {
    expect(profile.greeting).toBe("Xin chào! I'm Harry");
    expect(profile.roles).toEqual(["DevOps Engineer", "Designer", "Developer"]);
  });

  it("tells the journey in order", () => {
    expect(journey.map((s) => s.title)).toEqual([
      "ICT & Media Design",
      "Frontend Developer",
      "iOS Developer",
      "DevOps Engineer",
    ]);
  });

  it("runs the four pipeline stages", () => {
    expect(pipeline.map((s) => s.stage)).toEqual(["build", "test", "release", "deploy"]);
  });

  it("has the five ops case studies", () => {
    expect(caseStudies.map((c) => c.title)).toEqual([
      "Maintaining GitLab CI/CD",
      "Release & deployment",
      "Agentic AI work",
      "Front-end refactor",
      "Continuous improvements",
    ]);
  });

  it("gives every work item a title and description", () => {
    for (const item of workTabs.flatMap((t) => t.items)) {
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });

  it("has tools in two rows and nav links", () => {
    expect(tools.build.length).toBeGreaterThan(0);
    expect(tools.ops.length).toBeGreaterThan(0);
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it("contains no placeholder copy or invented metrics", () => {
    const text = JSON.stringify(content);
    expect(text).not.toMatch(/coffee|lorem/i);
    expect(text).not.toMatch(/\d+\s?%|\b\d+x\b/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `yarn test src/data`
Expected: FAIL, cannot resolve `./content`.

- [ ] **Step 3: Create `src/data/content.js`**

```js
import pomodoroImg from "../assets/finishmytask.png";
import myPixelImg from "../assets/mypixel.png";

// Copy is drafted from Harry's LinkedIn. Add real metrics here only when Harry supplies them.
export const profile = {
  greeting: "Xin chào! I'm Harry",
  roles: ["DevOps Engineer", "Designer", "Developer"],
  intro:
    "DevOps Engineer at Swisscom in Rotterdam. I help teams build, ship and run software reliably, with a designer's eye for the people who use it.",
  about:
    "I think about the people on both ends: the developers who rely on the tooling, and the users who rely on the product.",
  bio: "I came to DevOps from UX design and front-end development. Today I work on GitLab CI/CD, releases, monitoring and agentic AI tooling, and I'm growing toward owning systems end to end.",
};

export const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#journey", label: "Journey" },
  { href: "#work", label: "Work" },
  { href: "#toolbox", label: "Toolbox" },
];

export const journey = [
  { year: "2019", title: "ICT & Media Design", place: "Fontys University of Applied Sciences", text: "Bachelor in UX, media design and front-end development." },
  { year: "2021", title: "Frontend Developer", place: "Accenture, Utrecht", text: "Building web front ends with Angular and TypeScript." },
  { year: "2023", title: "iOS Developer", place: "Swisscom, Rotterdam", text: "Native iOS with Swift and ARKit." },
  { year: "2023 – now", title: "DevOps Engineer", place: "Swisscom, Rotterdam", text: "GitLab CI/CD, releases, system health and agentic AI tooling." },
];

export const pipeline = [
  { stage: "build", log: "compiling services · lint passed" },
  { stage: "test", log: "unit and integration suites green" },
  { stage: "release", log: "tagging release · changelog written" },
  { stage: "deploy", log: "rolling out · health checks passing" },
];

export const caseStudies = [
  { title: "Maintaining GitLab CI/CD", description: "Keeping the pipelines teams depend on fast, readable and dependable, so a red build always explains itself.", tags: ["GitLab CI/CD", "YAML"] },
  { title: "Release & deployment", description: "Owning the path from merge to production: versioned releases and repeatable deployments that nobody has to babysit.", tags: ["Releases", "Deployments"] },
  { title: "Agentic AI work", description: "Bringing AI agents into the engineering workflow so routine operational work gets done consistently, with a human in the loop.", tags: ["Agentic AI", "TypeScript"] },
  { title: "Front-end refactor", description: "Refactoring front-end code to be clean, maintainable and easier to operate, without changing what users see.", tags: ["TypeScript", "Refactoring"] },
  { title: "Continuous improvements", description: "Watching system health and turning what monitoring tells us into small, steady improvements.", tags: ["Monitoring", "Observability"] },
];

export const workTabs = [
  { id: "ops", label: "Ops", items: caseStudies },
  {
    id: "design",
    label: "Design & Web",
    items: [
      { title: "Pomodoro Web App", description: "Design and development of a focus timer web app.", image: pomodoroImg, url: "https://www.behance.net/gallery/154402037/Finish-My-Task-Pomodoro-Web-Application" },
      { title: "My Pixel", description: "A Pinterest-style social media site, built while learning full-stack development.", image: myPixelImg, url: "https://www.behance.net/gallery/154612969/My-Pixel-A-Pinterest-Clone-Website" },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    items: [
      { title: "Levart Travel", description: "An iOS travel app written in Swift.", url: "https://github.com/leecamm/levart-travel" },
    ],
  },
];

export const tools = {
  build: ["Figma", "UI/UX", "React", "Angular", "TypeScript", "Tailwind CSS", "Swift", "ARKit", "Unity"],
  ops: ["GitLab CI/CD", "Git", "Releases", "Deployments", "Monitoring", "Agentic AI", "Refactoring"],
};
```

- [ ] **Step 4: Run content tests**

Run: `yarn test src/data`
Expected: 7 PASS.

- [ ] **Step 5: Write failing App tests** — replace `src/App.test.jsx`:

```jsx
import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import App from "./App";

it("renders the hero greeting as the only h1", () => {
  render(<App />);
  const h1s = screen.getAllByRole("heading", { level: 1 });
  expect(h1s).toHaveLength(1);
  expect(h1s[0]).toHaveTextContent("Xin chào! I'm Harry");
});

it("exposes all rotating roles to assistive tech", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "DevOps Engineer, Designer, Developer" })).toBeInTheDocument();
});

it("renders the about statement", () => {
  render(<App />);
  expect(screen.getByText(/people on both ends/)).toBeInTheDocument();
});

it("has home and about sections", () => {
  const { container } = render(<App />);
  const ids = [...container.querySelectorAll("section[id]")].map((s) => s.id);
  expect(ids).toEqual(expect.arrayContaining(["home", "about"]));
});
```

- [ ] **Step 6: Run to verify failure**

Run: `yarn test src/App.test.jsx`
Expected: FAIL (greeting text differs; no `about` section; two h1s because Contact uses h1).

- [ ] **Step 7: Create `src/lib/gsap.js`**

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText);

// Reduced motion matches none of these, so nothing animates and markup stays in its final state.
export const MOTION = {
  desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
  any: "(prefers-reduced-motion: no-preference)",
};

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };
```

- [ ] **Step 8: Fonts, title, remove inline cursor** — edit `index.html`:
  1. Extract the cursor SVG to a file before deleting it:
     ```bash
     sed -n '/<svg/,/<\/svg>/p' index.html > src/assets/ufo.svg
     ```
  2. Delete the whole `<div class="tracker">…</div>` block and the inline `<script>…</script>` that follows it.
  3. Replace the Google Fonts `href` with
     `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Poppins:wght@300;400;700&display=swap`
  4. Replace `<title>` with `<title>Harry Le · DevOps Engineer</title>` and add below it
     `<meta name="description" content="Harry Le, DevOps Engineer at Swisscom. From UX design and front-end to CI/CD, releases and agentic AI." />`

- [ ] **Step 9: Tailwind fonts** — replace `tailwind.config.cjs`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 10: Global CSS** — in `src/index.css` delete the line `scroll-behavior: smooth;` (it fights ScrollSmoother). Replace `src/App.css` with:

```css
:root {
  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #000;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

#root {
  max-width: 100vw;
  margin: 0 auto;
  text-align: center;
}

@keyframes updown {
  0%, 100% { transform: translateY(-15px); }
  50% { transform: translateY(15px); }
}

@media (prefers-reduced-motion: no-preference) {
  .float,
  .contact img {
    animation: updown 3s ease-in-out infinite;
  }
}

/* Far layer of the hero: tiny stars that drift differently from background.png */
.starfield {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 70% 60%, #c7d2fe, transparent),
    radial-gradient(1px 1px at 40% 80%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(2px 2px at 85% 15%, #e9d5ff, transparent);
  background-size: 240px 240px;
}

.tracker {
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  pointer-events: none;
  z-index: 9999;
}
```

- [ ] **Step 11: Create `src/components/Cursor.jsx`**

```jsx
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import ufo from "../assets/ufo.svg";

export default function Cursor() {
  const ref = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      gsap.set(ref.current, { autoAlpha: 1, xPercent: -50, yPercent: -50 });
      const x = gsap.quickTo(ref.current, "x", { duration: 0.6, ease: "power3" });
      const y = gsap.quickTo(ref.current, "y", { duration: 0.6, ease: "power3" });
      const move = (e) => { x(e.clientX); y(e.clientY); };
      window.addEventListener("pointermove", move);
      return () => window.removeEventListener("pointermove", move);
    });
  });

  return (
    <div ref={ref} aria-hidden="true" className="tracker invisible">
      <img src={ufo} alt="" />
    </div>
  );
}
```

- [ ] **Step 12: Replace `src/components/Navbar.jsx`**

```jsx
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, ScrollSmoother, useGSAP, MOTION } from "../lib/gsap";
import logo from "../assets/Logo.svg";
import myCV from "../assets/LeDucHieu_CV-new.pdf";
import { navLinks } from "../data/content";

const Navbar = () => {
  const root = useRef();
  const [open, setOpen] = useState(false);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION.any, () => {
      const slide = gsap.quickTo(root.current, "yPercent", { duration: 0.4, ease: "power3" });
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => slide(self.direction === 1 && self.scroll() > 120 ? -100 : 0),
      });
    });
  });

  // With ScrollSmoother active, native anchor jumps skip the smoothed content.
  const goTo = (e) => {
    setOpen(false);
    const smoother = ScrollSmoother.get();
    if (!smoother) return;
    e.preventDefault();
    smoother.scrollTo(e.currentTarget.getAttribute("href"), true, "top top");
  };

  return (
    <nav ref={root} className="fixed inset-x-0 top-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-6 py-4 md:px-12">
        <a href="#home" onClick={goTo}>
          <img src={logo} className="h-10 sm:h-12" alt="Harry Le, home" />
        </a>
        <button
          className="p-2 text-gray-200 md:hidden"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <ul
          id="nav-menu"
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-6 py-6 md:flex md:w-auto md:flex-row md:items-center md:gap-10 md:py-0`}
        >
          {navLinks.map((link) => (
            <li key={link.href} className="text-lg text-gray-50 hover:text-gray-200">
              <a href={link.href} onClick={goTo}>{link.label}</a>
            </li>
          ))}
          <li className="text-lg text-gray-50 hover:text-gray-200">
            <a href={myCV} target="_blank" rel="noopener noreferrer">My CV</a>
          </li>
          <li>
            <a
              href="#contact"
              onClick={goTo}
              className="inline-block rounded-full border border-white px-5 py-3 hover:bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              Let's Connect
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
```

- [ ] **Step 13: Create `src/components/Hero.jsx`**

```jsx
import { useRef } from "react";
import { gsap, SplitText, useGSAP, MOTION } from "../lib/gsap";
import astronaut from "../assets/astronaut.svg";
import { profile } from "../data/content";

export default function Hero() {
  const root = useRef();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: MOTION.desktop, mobile: MOTION.mobile }, (ctx) => {
        const split = SplitText.create(".hero-title", { type: "chars", mask: "chars" });
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(split.chars, { yPercent: 110, stagger: 0.03, duration: 1.2 })
          .from(".hero-copy", { y: 24, opacity: 0, duration: 1 }, "-=0.8")
          .from(".hero-astronaut", { scale: 0.85, opacity: 0, duration: 1.4 }, "<");

        // Role rotator: each role slides out the top while the next slides in from below.
        const roles = gsap.utils.toArray(".hero-role", root.current);
        gsap.set(roles, { opacity: 1, yPercent: 100 });
        gsap.set(roles[0], { yPercent: 0 });
        const loop = gsap.timeline({ repeat: -1, delay: 1.5 });
        roles.forEach((role, i) => {
          loop
            .to(role, { yPercent: -100, duration: 0.6, ease: "power3.in" }, "+=1.8")
            .fromTo(
              roles[(i + 1) % roles.length],
              { yPercent: 100 },
              { yPercent: 0, duration: 0.6, ease: "power3.out", immediateRender: false },
              "<0.15"
            );
        });

        if (!ctx.conditions.desktop) return;
        // Pointer depth: layers with a larger data-depth move further.
        const layers = gsap.utils.toArray("[data-depth]", root.current).map((el) => ({
          x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
          depth: Number(el.dataset.depth),
        }));
        const onMove = (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          layers.forEach((l) => { l.x(nx * l.depth * 40); l.y(ny * l.depth * 40); });
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root }
  );

  return (
    <section id="home" ref={root} className="relative min-h-screen overflow-hidden bg-black">
      {/* data-speed = ScrollSmoother scroll parallax (desktop only) */}
      <div data-speed="0.5" className="absolute inset-x-0 -top-[10%] h-[120%] bg-[url('../src/assets/background.png')] bg-cover bg-center" />
      <div data-speed="0.3" className="absolute inset-0">
        <div data-depth="-0.5" className="starfield absolute -inset-[10%]" />
      </div>
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-32 md:grid-cols-2 md:px-12">
        <div className="text-left">
          <h1 className="hero-title text-5xl font-bold leading-[1.05] text-gray-50 sm:text-7xl">{profile.greeting}</h1>
          <h2 aria-label={profile.roles.join(", ")} className="mt-4 text-3xl font-bold sm:text-5xl">
            <span aria-hidden="true" className="relative block h-[1.25em] overflow-hidden">
              {profile.roles.map((role, i) => (
                <span
                  key={role}
                  className={`hero-role absolute inset-x-0 top-0 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent ${i ? "opacity-0" : ""}`}
                >
                  {role}
                </span>
              ))}
            </span>
          </h2>
          <p className="hero-copy mt-8 max-w-xl text-lg text-gray-300">{profile.intro}</p>
        </div>
        <div data-speed="1.15">
          <div data-depth="1" className="hero-astronaut">
            <img src={astronaut} alt="Astronaut riding a UFO" className="float mx-auto w-4/5 md:w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 14: Create `src/components/About.jsx`**

```jsx
import { useRef } from "react";
import { gsap, SplitText, useGSAP, MOTION } from "../lib/gsap";
import { profile } from "../data/content";

export default function About() {
  const root = useRef();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        const split = SplitText.create(".about-text", { type: "words" });
        gsap.from(split.words, {
          opacity: 0.15,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: ".about-text", start: "top 80%", end: "bottom 40%", scrub: true },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="bg-black px-6 py-32 md:px-12 md:py-48">
      <div className="mx-auto max-w-5xl text-left">
        <h2 className="font-mono text-sm uppercase tracking-[0.3em] text-gray-300">About</h2>
        <p className="about-text mt-8 text-3xl font-bold leading-tight text-gray-50 sm:text-5xl md:text-6xl">{profile.about}</p>
        <p className="mt-10 max-w-2xl text-lg text-gray-300">{profile.bio}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 15: Contact heading level** — in `src/components/Contact.jsx` change the `<h1 …>` / `</h1>` around `Get In Touch` to `<h2 …>` / `</h2>` (classes unchanged).

- [ ] **Step 16: Replace `src/App.jsx`** and delete `IntroBanner.jsx`

```jsx
import "./App.css";
import { gsap, ScrollSmoother, useGSAP, MOTION } from "./lib/gsap";

import Navbar from "./components/Navbar";
import Cursor from "./components/Cursor";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Project from "./components/Project";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION.desktop, () => {
      ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.2, effects: true });
    });
  });

  return (
    <>
      <Navbar />
      <Cursor />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main className="App">
            <Hero />
            <About />
            <Skills />
            <Project />
            <div className="bg-[url('../src/assets/gradient.png')] bg-cover">
              <Contact />
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
```

```bash
git rm src/components/IntroBanner.jsx
```

- [ ] **Step 17: Run all tests and build**

Run: `yarn test && yarn build`
Expected: all PASS, build OK.

- [ ] **Step 18: Manual check** — `yarn dev`, open http://localhost:5173 at desktop width: title chars rise in, roles rotate, astronaut follows the pointer, background drifts slower than the page, nav hides on scroll down and reappears on scroll up, UFO cursor follows. Toggle macOS "Reduce motion": everything static and visible.

- [ ] **Step 19: Commit**

```bash
git add -A src index.html tailwind.config.cjs
git commit -m "feat: GSAP core, content data, smooth shell, hero and about

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Journey + Mission Control

**Files:**
- Create: `src/components/Journey.jsx`, `src/components/MissionControl.jsx`
- Modify: `src/App.jsx` (insert after `<About />`), `src/App.test.jsx`

**Interfaces:**
- Consumes: `gsap, useGSAP, MOTION` from `src/lib/gsap.js`; `journey`, `pipeline` from `src/data/content.js` (`journey[i] = { year, title, place, text }`, `pipeline[i] = { stage, log }`).

- [ ] **Step 1: Write failing tests** — append to `src/App.test.jsx`:

```jsx
import { within } from "@testing-library/react";

it("shows the four journey steps in order", () => {
  const { container } = render(<App />);
  const steps = within(container.querySelector("#journey")).getAllByRole("listitem");
  expect(steps.map((s) => s.querySelector("h3").textContent)).toEqual([
    "ICT & Media Design",
    "Frontend Developer",
    "iOS Developer",
    "DevOps Engineer",
  ]);
});

it("runs the mission control pipeline", () => {
  const { container } = render(<App />);
  const mission = within(container.querySelector("#mission"));
  expect(mission.getByRole("heading", { name: "Mission control" })).toBeInTheDocument();
  for (const stage of ["build", "test", "release", "deploy"]) {
    expect(mission.getByText(stage)).toBeInTheDocument();
  }
});
```

(Move the `within` import to the top-level import line from `@testing-library/react`.)

- [ ] **Step 2: Run to verify failure**

Run: `yarn test src/App.test.jsx`
Expected: FAIL, `#journey` is null.

- [ ] **Step 3: Create `src/components/Journey.jsx`**

```jsx
import { useRef } from "react";
import { gsap, useGSAP, MOTION } from "../lib/gsap";
import astronaut from "../assets/astronaut.svg";
import { journey } from "../data/content";

export default function Journey() {
  const root = useRef();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: pin the section and scroll the track sideways.
      mm.add(MOTION.desktop, () => {
        const track = root.current.querySelector(".journey-track");
        const distance = () => track.scrollWidth - window.innerWidth;
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => "+=" + distance(),
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(track, { x: () => -distance() }, 0)
          .from(".journey-line", { scaleX: 0 }, 0)
          .to(".journey-astronaut", { x: () => window.innerWidth * 0.7, y: -60, rotation: 25 }, 0);
      });

      // Mobile: vertical timeline, cards rise in.
      mm.add(MOTION.mobile, () => {
        gsap.utils.toArray(".journey-card", root.current).forEach((card) => {
          gsap.from(card, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="journey" ref={root} className="relative overflow-hidden bg-gradient-to-b from-[#1e1b4b] to-black md:h-screen">
      <h2 className="px-6 pt-24 text-left text-4xl font-bold sm:text-5xl md:absolute md:left-12 md:top-24 md:p-0">The journey</h2>
      <img src={astronaut} alt="" className="journey-astronaut pointer-events-none absolute left-0 top-1/4 hidden w-40 md:block" />
      <ol className="journey-track flex flex-col gap-6 px-6 py-16 md:h-full md:w-max md:flex-row md:items-center md:gap-16 md:px-[20vw] md:py-0">
        {journey.map((step) => (
          <li key={step.title} className="journey-card rounded-3xl border border-white/10 bg-white/5 p-8 text-left md:w-[28rem]">
            <p className="font-mono text-sm text-purple-300">{step.year}</p>
            <h3 className="mt-3 text-2xl font-bold text-gray-50">{step.title}</h3>
            <p className="mt-1 text-gray-300">{step.place}</p>
            <p className="mt-4 text-gray-200">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="journey-line absolute bottom-16 left-12 right-12 hidden h-px origin-left bg-gradient-to-r from-indigo-500 to-purple-500 md:block" />
    </section>
  );
}
```

- [ ] **Step 4: Create `src/components/MissionControl.jsx`**

```jsx
import { useRef } from "react";
import { gsap, useGSAP, MOTION } from "../lib/gsap";
import astronaut from "../assets/astronaut.svg";
import { pipeline } from "../data/content";

export default function MissionControl() {
  const root = useRef();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: MOTION.desktop, mobile: MOTION.mobile }, (ctx) => {
        const { desktop } = ctx.conditions;

        // The switch into "ops" mode: the terminal panel opens out of a rounded window.
        if (desktop) {
          gsap.fromTo(
            ".mission-panel",
            { clipPath: "inset(12% 10% round 32px)" },
            { clipPath: "inset(0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true } }
          );
        }

        // The peak: pinned on desktop with the largest scroll span on the page.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: desktop
            ? { trigger: root.current, start: "top top", end: "+=300%", pin: true, scrub: 1 }
            : { trigger: root.current, start: "top 70%", end: "bottom 80%", scrub: 1 },
        });
        tl.from(".mission-title", { yPercent: 40, opacity: 0, duration: 0.5 });
        gsap.utils.toArray(".mission-stage", root.current).forEach((stage) => {
          tl.from(stage, { opacity: 0.25, duration: 0.3 })
            .from(stage.querySelector(".mission-dot"), { scale: 0, duration: 0.2 }, "<")
            .fromTo(stage.querySelector(".mission-log"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5 })
            .from(stage.querySelector(".mission-bar"), { scaleX: 0, duration: 0.6 }, "<");
        });
        tl.from(".mission-status", { opacity: 0, y: 20, duration: 0.3 })
          .from(".mission-glow", { opacity: 0, duration: 0.6 })
          .fromTo(".mission-rocket", { yPercent: 0 }, { yPercent: -260, rotation: -8, ease: "power2.in", duration: 1 }, "<");
      });
    },
    { scope: root }
  );

  return (
    <section id="mission" ref={root} className="relative bg-black">
      <div className="mission-panel relative min-h-screen overflow-hidden bg-[#05040d] font-mono">
        <div className="mission-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.35),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24 text-left md:px-12">
          <p className="text-sm text-purple-300">~/swisscom $ ./launch --env production</p>
          <h2 className="mission-title mt-4 font-sans text-4xl font-bold text-gray-50 sm:text-6xl">Mission control</h2>
          <p className="mt-4 max-w-2xl font-sans text-lg text-gray-300">
            Today I keep the launch pad running: the pipelines, releases and tooling that get code safely into production.
          </p>
          <ol className="mt-12 grid gap-4 md:grid-cols-4">
            {pipeline.map((s) => (
              <li key={s.stage} className="mission-stage rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3">
                  <span className="mission-dot h-3 w-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <span className="text-lg text-gray-50">{s.stage}</span>
                </div>
                <p className="mission-log mt-4 text-sm text-gray-300">{s.log}</p>
                <div className="mt-6 h-1 overflow-hidden rounded bg-white/10">
                  <div className="mission-bar h-full origin-left bg-gradient-to-r from-indigo-500 to-purple-500" />
                </div>
              </li>
            ))}
          </ol>
          <p className="mission-status mt-10 text-lg text-gray-50">✓ deployed. all systems nominal.</p>
        </div>
        <div className="mission-rocket pointer-events-none absolute -bottom-[5%] right-[6%] w-28 md:w-48">
          <img src={astronaut} alt="" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire into `src/App.jsx`** — add imports and render order:

```jsx
import Journey from "./components/Journey";
import MissionControl from "./components/MissionControl";
// …
<Hero />
<About />
<Journey />
<MissionControl />
<Skills />
```

- [ ] **Step 6: Run tests and build**

Run: `yarn test && yarn build`
Expected: all PASS.

- [ ] **Step 7: Manual check** — `yarn dev` desktop: Journey pins and slides sideways with the astronaut crossing and the line drawing; Mission panel opens from a rounded window, then pins; stages light up one by one with logs revealing left to right; status appears, glow rises, astronaut lifts off. Resize to 390px: Journey is a vertical list, Mission isn't pinned and plays as you scroll through it. Reduced motion: both fully visible.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: journey track and mission control launch sequence

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Work, Toolbox, Contact, Footer + cleanup

**Files:**
- Create: `src/components/Work.jsx`, `src/components/Toolbox.jsx`
- Modify: `src/components/Contact.jsx`, `src/components/Footer.jsx`, `src/App.jsx`, `src/App.test.jsx`
- Delete: `src/components/Project.jsx`, `src/components/Skills.jsx`, `src/assets/75per.svg`, `src/assets/80per.svg`, `src/assets/90per.svg`, `src/assets/95per.svg`, `src/assets/react.svg`; deps `@headlessui/react`, `react-multi-carousel`

**Interfaces:**
- Consumes: `workTabs` (`{ id, label, items: [{ title, description, tags?, image?, url? }] }`), `tools` (`{ build: string[], ops: string[] }`), `navLinks` from content; `gsap, SplitText, ScrollTrigger, useGSAP, MOTION` from lib.

- [ ] **Step 1: Write failing tests** — append to `src/App.test.jsx` (add `fireEvent` to the `@testing-library/react` import):

```jsx
const SECTIONS = ["home", "about", "journey", "mission", "work", "toolbox", "contact"];

it("renders every section in story order", () => {
  const { container } = render(<App />);
  expect([...container.querySelectorAll("section[id]")].map((s) => s.id)).toEqual(SECTIONS);
});

it("points every nav anchor at a real section", () => {
  const { container } = render(<App />);
  for (const a of container.querySelectorAll('nav a[href^="#"]')) {
    expect(container.querySelector(a.getAttribute("href"))).not.toBeNull();
  }
});

it("shows ops case studies first and switches tabs", () => {
  render(<App />);
  expect(screen.getByRole("tab", { name: "Ops" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Maintaining GitLab CI/CD")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Design & Web" }));
  expect(screen.getByText("Pomodoro Web App")).toBeInTheDocument();
  expect(screen.queryByText("Maintaining GitLab CI/CD")).toBeNull();
});

it("lists each tool once for assistive tech", () => {
  const { container } = render(<App />);
  const visible = within(container.querySelector("#toolbox"))
    .getAllByText("Figma")
    .filter((el) => !el.closest('[aria-hidden="true"]'));
  expect(visible).toHaveLength(1);
});

it("leaves everything visible with motion off", () => {
  const { container } = render(<App />);
  expect(container.querySelectorAll('[style*="opacity: 0"], [style*="visibility: hidden"]')).toHaveLength(0);
  expect(container.textContent).not.toMatch(/coffee/i);
  expect(screen.getByRole("heading", { name: "Let's build something reliable." })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `yarn test src/App.test.jsx`
Expected: FAIL: the `work` and `toolbox` sections and the Work tabs are missing, and the contact heading still says "Get In Touch".

- [ ] **Step 3: Create `src/components/Work.jsx`**

```jsx
import { useRef, useState } from "react";
import { gsap, useGSAP, MOTION } from "../lib/gsap";
import { workTabs } from "../data/content";

export default function Work() {
  const root = useRef();
  const [active, setActive] = useState(workTabs[0].id);
  const tab = workTabs.find((t) => t.id === active);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        gsap.fromTo(
          ".work-card",
          { clipPath: "inset(100% 0% 0% 0%)", y: 40 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".work-grid", start: "top 80%" } }
        );
      });
      mm.add(MOTION.desktop, () => {
        const offs = gsap.utils.toArray(".work-card", root.current).map((card) => {
          gsap.set(card, { transformPerspective: 800 });
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
          const move = (e) => {
            const r = card.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 10);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          };
          const leave = () => { rx(0); ry(0); };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          return () => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          };
        });
        return () => offs.forEach((off) => off());
      });
    },
    { scope: root, dependencies: [active], revertOnUpdate: true }
  );

  return (
    <section id="work" ref={root} className="bg-black px-6 py-32 md:px-12">
      <div className="mx-auto max-w-7xl text-left">
        <h2 className="text-4xl font-bold text-gray-50 sm:text-6xl">Selected work</h2>
        <div role="tablist" aria-label="Work categories" className="mt-10 flex flex-wrap gap-3">
          {workTabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === active}
              aria-controls="work-panel"
              onClick={() => setActive(t.id)}
              className={`rounded-full border px-5 py-3 text-lg transition-colors ${
                t.id === active
                  ? "border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  : "border-white/30 text-gray-200 hover:border-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ul id="work-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="work-grid mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tab.items.map((item) => {
            const body = (
              <>
                {item.image && <img src={item.image} alt="" className="aspect-video w-full rounded-2xl object-cover" />}
                <h3 className="mt-6 text-2xl font-bold text-gray-50">{item.title}</h3>
                <p className="mt-3 text-gray-300">{item.description}</p>
                {item.tags && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <li key={t} className="rounded-full border border-white/15 px-3 py-1 font-mono text-xs text-purple-200">{t}</li>
                    ))}
                  </ul>
                )}
              </>
            );
            return (
              <li key={item.title} className="work-card rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">{body}</a> : body}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/components/Toolbox.jsx`**

```jsx
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION } from "../lib/gsap";
import { tools } from "../data/content";

export default function Toolbox() {
  const root = useRef();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        // Each row holds two copies of its list; sliding by -50% loops seamlessly.
        const tweens = gsap.utils.toArray(".marquee-row", root.current).map((row, i) =>
          gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 30, ease: "none", repeat: -1 })
        );
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 4);
            tweens.forEach((t) => {
              t.timeScale(boost);
              gsap.to(t, { timeScale: 1, duration: 1, ease: "power2.out", overwrite: true });
            });
          },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="toolbox" ref={root} className="overflow-hidden bg-black py-32">
      <h2 className="mx-auto max-w-7xl px-6 text-left text-4xl font-bold text-gray-50 sm:text-6xl md:px-12">Toolbox</h2>
      {[tools.build, tools.ops].map((list, row) => (
        <div key={row} className="mt-12 overflow-hidden">
          <div className="marquee-row flex w-max motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:gap-y-4 motion-reduce:px-6">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1 || undefined} className={`flex ${copy ? "motion-reduce:hidden" : "motion-reduce:flex-wrap"}`}>
                {list.map((tool) => (
                  <span key={tool} className="flex items-center whitespace-nowrap text-4xl font-bold sm:text-7xl">
                    <span className={row ? "font-mono text-transparent [-webkit-text-stroke:1px_#a5b4fc]" : "text-gray-50"}>{tool}</span>
                    <span aria-hidden="true" className="mx-6 text-purple-400">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Replace `src/components/Contact.jsx`** (EmailJS IDs unchanged)

```jsx
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { gsap, SplitText, useGSAP, MOTION } from "../lib/gsap";
import contactImg from "../assets/contact.svg";

const inputClass =
  "appearance-none block w-full bg-gray-500 text-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 mb-3 leading-tight focus:outline-none focus:border-purple-400 placeholder:text-gray-300";

const Contact = () => {
  const root = useRef();
  const form = useRef();
  const [buttonText, setButtonText] = useState("Send");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        const split = SplitText.create(".contact-title", { type: "words", mask: "words" });
        gsap.from(split.words, { yPercent: 110, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".contact-title", start: "top 85%" } });
      });
      mm.add(MOTION.desktop, () => {
        const btn = root.current.querySelector(".magnetic");
        const x = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
        const y = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
        const move = (e) => {
          const r = btn.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.35);
          y((e.clientY - r.top - r.height / 2) * 0.35);
        };
        const leave = () => { x(0); y(0); };
        btn.addEventListener("pointermove", move);
        btn.addEventListener("pointerleave", leave);
        return () => {
          btn.removeEventListener("pointermove", move);
          btn.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root }
  );

  const sendEmail = (e) => {
    e.preventDefault();
    setButtonText("Sending...");
    emailjs.sendForm("service_2uhn9y9", "template_ebuf4pd", form.current, "G-DHKLQCXzx8Z5wO6").then(
      () => {
        alert("Message sent, We'll contact you shortly");
        setButtonText("Send");
        form.current.reset();
      },
      () => {
        alert("Something went wrong, please try again later");
        setButtonText("Send");
      }
    );
  };

  return (
    <section id="contact" ref={root} className="contact mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-32 md:grid-cols-2 md:px-12">
      <img src={contactImg} alt="" className="hidden w-full md:block" />
      <div className="text-left">
        <h2 className="contact-title text-4xl font-bold text-white sm:text-6xl">Let's build something reliable.</h2>
        <form className="w-full max-w-lg pt-10" ref={form} onSubmit={sendEmail}>
          <div className="-mx-3 mb-6 flex flex-wrap">
            <div className="mb-6 w-full px-3 md:mb-0 md:w-1/2">
              <input className={inputClass} type="text" placeholder="First Name" aria-label="First name" name="from_firstname" />
            </div>
            <div className="w-full px-3 md:w-1/2">
              <input className={inputClass} type="text" placeholder="Last Name" aria-label="Last name" name="from_lastname" />
            </div>
          </div>
          <div className="mb-6">
            <input className={inputClass} type="email" required placeholder="Email Address" aria-label="Email address" name="from_email" />
          </div>
          <div className="mb-6">
            <textarea className={`${inputClass} h-48 resize-none`} required placeholder="Message" aria-label="Message" name="message" />
          </div>
          <button className="magnetic w-36 rounded-2xl bg-gray-50 p-5 font-bold text-black hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white" type="submit">
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
```

- [ ] **Step 6: Footer year** — in `src/components/Footer.jsx` replace `Copyright 2022 by Harry Le. All Rights Reserved` with `Copyright {new Date().getFullYear()} by Harry Le. All Rights Reserved`.

- [ ] **Step 7: Final `src/App.jsx` sections** — remove the `Skills` and `Project` imports, import `Work` and `Toolbox`, and render:

```jsx
<Hero />
<About />
<Journey />
<MissionControl />
<Work />
<Toolbox />
<div className="bg-[url('../src/assets/gradient.png')] bg-cover">
  <Contact />
  <Footer />
</div>
```

- [ ] **Step 8: Delete old components, assets and deps**

```bash
git rm src/components/Project.jsx src/components/Skills.jsx \
  src/assets/75per.svg src/assets/80per.svg src/assets/90per.svg src/assets/95per.svg src/assets/react.svg
grep -rn "react.svg\|per.svg\|headlessui\|multi-carousel" src index.html || echo "no references"
yarn remove @headlessui/react react-multi-carousel
```

Expected: `no references`.

- [ ] **Step 9: Run tests and build**

Run: `yarn test && yarn build`
Expected: all PASS.

- [ ] **Step 10: Manual check** — desktop: cards wipe up on enter, tilt under the pointer, re-wipe on tab switch; marquees run opposite ways and surge when you flick the wheel; contact words rise; Send button is magnetic. Submit an empty form: browser blocks it (required fields). Reduced motion: marquees become wrapped static lists without duplicates.

- [ ] **Step 11: Commit**

```bash
git add -A src package.json yarn.lock
git commit -m "feat: work tabs, toolbox marquee, contact; remove legacy sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Visual verification + polish

**Files:**
- Modify: only files where defects are found.
- Create (scratchpad, not committed): `shots.mjs`

**Interfaces:**
- Consumes: the built site from `yarn build && yarn preview` (http://localhost:4173).

- [ ] **Step 1: Install a throwaway screenshot runner in the scratchpad** (keeps it out of the project's deps)

```bash
cd "$SCRATCH" && npm init -y >/dev/null && npm i playwright-core
```

(`$SCRATCH` = the session scratchpad directory.)

- [ ] **Step 2: Create `$SCRATCH/shots.mjs`**

```js
import { chromium } from "playwright-core";
import fs from "node:fs";

const [url, out, w, h, reduced] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: reduced ? "reduce" : "no-preference" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let i = 0; i <= 24; i++) {
  await page.mouse.wheel(0, 0);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round((max * i) / 24));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${String(i).padStart(2, "0")}.png` });
}
console.log(JSON.stringify({ frames: 25, errors }, null, 2));
await browser.close();
```

- [ ] **Step 3: Shoot three passes**

```bash
yarn build && (yarn preview --port 4173 &) && sleep 2
node "$SCRATCH/shots.mjs" http://localhost:4173 "$SCRATCH/desktop" 1440 900
node "$SCRATCH/shots.mjs" http://localhost:4173 "$SCRATCH/mobile" 390 844
node "$SCRATCH/shots.mjs" http://localhost:4173 "$SCRATCH/reduced" 1440 900 reduce
```

Expected: `errors: []` for each pass.

- [ ] **Step 4: Inspect every frame** with the Read tool. Check for: text over busy background with poor contrast; dead scroll (consecutive identical frames outside an intentional pin); Journey last card fully reachable; Mission Control is visibly the biggest change; nothing clipped or overflowing at 390px; reduced pass shows all content with no blank regions.

- [ ] **Step 5: Fix each defect found**, re-run `yarn test` and the affected shot pass until clean. Record each fix in the commit body.

- [ ] **Step 6: Keyboard pass** — `yarn dev`, Tab through the page: focus is visible on nav links, tabs, cards and form fields, and order follows reading order. Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400` to any interactive element lacking a visible focus ring.

- [ ] **Step 7: Commit**

```bash
git add -A src index.html
git commit -m "fix: polish from visual verification pass

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Report** what was verified (frames, viewports, errors) and what was not (real iPhone Safari, real email send).
