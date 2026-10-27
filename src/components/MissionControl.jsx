import { useRef } from "react";
import { gsap, useGSAP, MOTION } from "../lib/gsap";
import astronaut from "../assets/astronaut.svg";
import { pipeline } from "../data/content";

export default function MissionControl({ ready }) {
  const root = useRef();

  useGSAP(
    () => {
      if (!ready) return;
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
            ? { trigger: root.current, start: "top top", end: "+=300%", pin: true, scrub: true } // ScrollSmoother already eases the scroll; scrub:1 on top would lag past the pin release
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
          .fromTo(".mission-rocket", { yPercent: 0 }, { yPercent: desktop ? -260 : -90, rotation: -8, ease: "power2.in", duration: 1 }, "<")
          .to({}, { duration: 0.4 }); // short hold so liftoff finishes before the pin lets go
      });
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <section id="mission" ref={root} className="relative bg-black">
      <div className="mission-panel relative min-h-screen overflow-hidden bg-[#05040d] font-mono">
        <div className="mission-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.35),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-48 pt-24 text-left md:px-12 md:pb-24">
          <p className="text-sm text-purple-300">~/swisscom $ ./launch --env production</p>
          <h2 className="mission-title mt-4 font-sans text-4xl font-bold text-gray-50 sm:text-6xl">Mission control</h2>
          <p className="mt-4 max-w-2xl font-sans text-lg text-gray-300">
            Today I keep the launch pad running: the pipelines, releases and tooling that get code safely into production.
          </p>
          <ol role="list" className="mt-12 grid gap-4 md:grid-cols-4">
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
