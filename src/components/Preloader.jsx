import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION } from "../lib/gsap";

const MAX_MS = 2500; // cap: the countdown (~1.95 s) plays, but a slow font load never holds the page
const FAILSAFE_MS = MAX_MS + 1500; // if GSAP never completes the wipe (rAF suspended), drop the overlay anyway
const REVEAL_AT = 0.6; // start the hero intro while the curtain is still opening

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

// onDone: the hero may start (fires once, ~60% into the wipe). onExit: the curtain is gone, unmount it.
export default function Preloader({ onDone, onExit }) {
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
      let revealed = false;
      let completed = false;
      const reveal = () => {
        if (!alive || revealed) return;
        revealed = true;
        onDone();
      };
      // Runs once, from the wipe's onComplete or from the failsafe.
      const complete = () => {
        if (!alive || completed) return;
        completed = true;
        clearTimeout(failsafe);
        reveal(); // no-op unless the wipe never reached REVEAL_AT
        release();
        try {
          sessionStorage.setItem("launched", "1");
        } catch {
          /* storage blocked: the countdown just plays again next time */
        }
        onExit?.();
        try {
          ScrollTrigger.refresh();
        } catch (err) {
          console.debug("preloader: ScrollTrigger.refresh failed", err);
        }
      };
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
            onUpdate() {
              if (this.progress() >= REVEAL_AT) reveal();
            },
            onComplete: complete,
          }
        );
      });

      // Gate on fonts (the countdown's own glyphs) and the countdown itself; not window.load, which
      // waits on images the hero doesn't need.
      let minTimer;
      const minWait = new Promise((r) => (minTimer = setTimeout(r, count.duration() * 1000)));
      Promise.all([document.fonts?.ready ?? Promise.resolve(), minWait]).then(finish);
      const cap = setTimeout(finish, MAX_MS);
      const failsafe = setTimeout(() => {
        if (!alive || completed) return;
        el.style.display = "none";
        complete();
      }, FAILSAFE_MS);
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
        clearTimeout(failsafe);
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
