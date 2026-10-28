import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION } from "../lib/gsap";
import astronaut from "../assets/astronaut.svg";
import { pipeline, missionTiming } from "../data/content";

const { stageAt: STAGE_AT, liftoffAt: LIFTOFF_AT } = missionTiming;
// A disposed scene forces its WebGL context lost for good, so every scene needs a canvas never used before.
const spentCanvases = new WeakSet();

export default function MissionControl({ ready }) {
  const root = useRef();
  const canvasRef = useRef();
  const sceneRef = useRef(null);
  const [has3d, setHas3d] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add({ desktop: MOTION.desktop, mobile: MOTION.mobile }, (ctx) => {
        const { desktop } = ctx.conditions;
        let disposed = false;
        const state = { p: 0 };

        // The switch into "ops" mode: the terminal panel opens out of a rounded window.
        if (desktop) {
          gsap.fromTo(
            ".mission-panel",
            { clipPath: "inset(12% 10% round 32px)" },
            { clipPath: "inset(0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true } }
          );
        }

        // The peak: pinned on desktop with the largest scroll span on the page. The timeline lasts
        // exactly 1, so its progress is the scene's progress and the cards light as the rocket arrives.
        // The scene follows the timeline itself (not the raw scroll), so mobile's scrub lag keeps rocket and cards together.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: () => {
            state.p = tl.progress();
            sceneRef.current?.setProgress(state.p);
          },
          scrollTrigger: desktop
            ? { trigger: root.current, start: "top top", end: "+=300%", pin: true, scrub: true } // ScrollSmoother already eases the scroll; scrub:1 on top would lag past the pin release
            : { trigger: root.current, start: "top 25%", end: "bottom 80%", scrub: 1 },
        });
        tl.from(".mission-title", { yPercent: 40, opacity: 0, duration: 0.08 }, 0);
        gsap.utils.toArray(".mission-stage", root.current).forEach((stage, i) => {
          const at = STAGE_AT[i];
          tl.from(stage.querySelector(".mission-bar"), { scaleX: 0, duration: 0.1 }, at - 0.1) // fills as the rocket approaches
            .from(stage, { opacity: 0.25, duration: 0.05 }, at - 0.05)
            .fromTo(stage.querySelector(".mission-log"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.05 }, at - 0.05)
            .from(stage.querySelector(".mission-dot"), { scale: 0, duration: 0.025 }, at - 0.025);
        });
        tl.from(".mission-status", { opacity: 0, y: 20, duration: 0.1 }, LIFTOFF_AT)
          .from(".mission-glow", { opacity: 0, duration: 0.15 }, LIFTOFF_AT)
          .fromTo(".mission-rocket", { yPercent: 0 }, { yPercent: desktop ? -260 : -90, rotation: -8, ease: "power2.in", duration: 0.2 }, LIFTOFF_AT)
          .to({}, { duration: 0 }, 1); // hold the settled end until the pin lets go

        // Mission control in 3D: load three about one viewport early; render only near the viewport.
        const near = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          // the section is its own pin, so "bottom top" would fire at the pin's first viewport; span the pin too
          end: () => (desktop ? `+=${innerHeight * 4 + root.current.offsetHeight}` : "bottom top"),
          onToggle: (self) => (self.isActive ? sceneRef.current?.start() : sceneRef.current?.stop()),
        });
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom+=100%",
          once: true,
          onEnter: () => {
            import("../three/missionScene").then(({ createMissionScene, supportsWebGL }) => {
              if (!supportsWebGL()) return;
              const mount = () => {
                const canvas = canvasRef.current;
                if (disposed || !canvas) return;
                if (spentCanvases.has(canvas)) return requestAnimationFrame(mount); // React is still swapping in a fresh one
                spentCanvases.add(canvas);
                let scene;
                try {
                  scene = createMissionScene(canvas, { mobile: !desktop });
                } catch {
                  return; // no usable GPU context: the 2D version stays
                }
                sceneRef.current = scene;
                scene.setProgress(state.p);
                if (near.isActive) scene.start();
                setHas3d(true);
              };
              mount();
            }).catch(() => {}); // chunk failed to load: the 2D version stays
          },
        });
        const onPointer = (e) => sceneRef.current?.setPointer(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
        if (desktop) window.addEventListener("pointermove", onPointer);

        return () => {
          disposed = true;
          window.removeEventListener("pointermove", onPointer);
          if (sceneRef.current) {
            sceneRef.current.dispose();
            sceneRef.current = null;
            setCanvasKey((k) => k + 1);
          }
          setHas3d(false);
        };
      });
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <section id="mission" ref={root} className="relative bg-black">
      <div className="mission-panel relative min-h-screen overflow-hidden bg-[#05040d] font-mono">
        <canvas key={canvasKey} ref={canvasRef} aria-hidden="true" className="mission-canvas pointer-events-none absolute inset-0 h-full w-full" />
        <div className={`pointer-events-none absolute inset-0 ${has3d ? "opacity-0" : ""}`}>
          <div className="mission-glow absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.35),transparent_60%)]" />
        </div>
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-48 pt-24 text-left md:px-12 md:pb-24">
          <p className="text-sm text-purple-300">~/swisscom $ ./launch --env production</p>
          <h2 className="mission-title mt-4 font-sans text-4xl font-bold text-gray-50 sm:text-6xl">Mission control</h2>
          <p className="mt-4 max-w-2xl font-sans text-lg text-gray-300">
            Today I keep the launch pad running: the pipelines, releases and tooling that get code safely into production.
          </p>
          <ol role="list" className="mt-12 grid gap-4 md:grid-cols-4">
            {pipeline.map((s) => (
              <li
                key={s.stage}
                className={`mission-stage rounded-2xl border border-white/10 p-6 ${has3d ? "bg-[#0a0920]/80" : "bg-white/[0.03]"}`}
              >
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
        <div className={`mission-rocket pointer-events-none absolute -bottom-[5%] right-[6%] w-28 md:w-48 ${has3d ? "opacity-0" : ""}`}>
          <img src={astronaut} alt="" />
        </div>
      </div>
    </section>
  );
}
