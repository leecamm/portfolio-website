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
    () => {
      const html = document.documentElement;
      html.style.overflow = "hidden"; // ScrollSmoother rides native scroll, so this locks it too

      const count = gsap.timeline();
      gsap.utils.toArray(".preloader-beat", root.current).forEach((beat) => {
        count
          .fromTo(beat, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power3.out" })
          .to(beat, { opacity: 0, duration: 0.2 }, "+=0.2");
      });

      let finished = false;
      const finish = () => {
        if (finished || !root.current) return;
        finished = true;
        count.progress(1);
        gsap.to(root.current, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.9,
          ease: "expo.inOut",
          onComplete: () => {
            html.style.overflow = "";
            try {
              sessionStorage.setItem("launched", "1");
            } catch {
              /* storage blocked: the countdown just plays again next time */
            }
            ScrollTrigger.refresh();
            onDone();
          },
        });
      };

      Promise.all([document.fonts?.ready ?? Promise.resolve(), pageLoaded(), new Promise((r) => setTimeout(r, MIN_MS))]).then(finish);
      const cap = setTimeout(finish, MAX_MS);
      const onKey = (e) => ["Escape", "Enter", " "].includes(e.key) && finish();
      window.addEventListener("keydown", onKey);
      root.current.addEventListener("click", finish);

      return () => {
        clearTimeout(cap);
        window.removeEventListener("keydown", onKey);
        html.style.overflow = "";
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
