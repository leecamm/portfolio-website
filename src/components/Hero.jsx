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
        const split = SplitText.create(".hero-title", { type: "words, chars", mask: "chars" });
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(split.chars, { yPercent: 110, stagger: 0.03, duration: 1.2, onComplete: () => split.revert() }) // the mask clips descenders ("y"), so drop it once the reveal is done
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
                  className={`hero-role absolute inset-x-0 top-0 h-full leading-[1.25em] bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent ${i ? "opacity-0" : ""}`}
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
