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
    (context, contextSafe) => {
      const el = root.current;
      const html = document.documentElement;
      const prevOverflow = html.style.overflow;
      html.style.overflow = "hidden"; // ScrollSmoother rides native scroll, so this locks it too
      // Keep Tab and assistive tech out of the hidden page (nav, content) while the curtain is up.
      const behind = [...el.parentElement.children].filter((c) => c !== el && !c.hasAttribute("inert"));
      behind.forEach((c) => c.setAttribute("inert", ""));
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        html.style.overflow = prevOverflow;
        behind.forEach((c) => c.removeAttribute("inert"));
      };

      const count = gsap.timeline();
      gsap.utils.toArray(".preloader-beat", el).forEach((beat) => {
        count
          .fromTo(beat, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power3.out" })
          .to(beat, { opacity: 0, duration: 0.2 }, "+=0.2");
      });

      // `alive` stops a torn-down run (StrictMode's simulated remount, or unmount) from finishing.
      let alive = true;
      let finished = false;
      const finish = contextSafe(() => {
        if (!alive || finished) return;
        finished = true;
        count.progress(1);
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 0.9,
            ease: "expo.inOut",
            onComplete: () => {
              if (!alive) return;
              release();
              try {
                sessionStorage.setItem("launched", "1");
              } catch {
                /* storage blocked: the countdown just plays again next time */
              }
              onDone(); // first, so the hero never stays hidden if the refresh below throws
              try {
                ScrollTrigger.refresh();
              } catch (err) {
                console.debug("preloader: ScrollTrigger.refresh failed", err);
              }
            },
          }
        );
      });

      let minTimer;
      const minWait = new Promise((r) => (minTimer = setTimeout(r, MIN_MS)));
      Promise.all([document.fonts?.ready ?? Promise.resolve(), pageLoaded(), minWait]).then(finish);
      const cap = setTimeout(finish, MAX_MS);
      const onKey = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || !["Escape", "Enter", " "].includes(e.key)) return;
        if (e.key !== "Escape") e.preventDefault(); // Space would scroll, Enter could activate something
        finish();
      };
      window.addEventListener("keydown", onKey);
      el.addEventListener("click", finish);

      return () => {
        alive = false;
        clearTimeout(cap);
        clearTimeout(minTimer);
        window.removeEventListener("keydown", onKey);
        el.removeEventListener("click", finish);
        release();
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
