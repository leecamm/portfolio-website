import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION } from "../lib/gsap";
import { tools } from "../data/content";

export default function Toolbox({ ready }) {
  const root = useRef();

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        // Each row holds two copies of its list; sliding by -50% loops seamlessly.
        const tweens = gsap.utils.toArray(".marquee-row", root.current).map((row, i) =>
          gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 30, ease: "none", repeat: -1 })
        );
        // One reusable quickTo per row eases timeScale back to 1, so a scroll tick never allocates a tween.
        const settle = tweens.map((t) => gsap.quickTo(t, "timeScale", { duration: 1, ease: "power2.out" }));
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 4);
            tweens.forEach((t, i) => {
              const speed = Math.max(boost, t.timeScale());
              t.timeScale(speed);
              settle[i](1, speed); // explicit start: quickTo would otherwise tween from the value it first saw
            });
          },
        });
      });
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <section id="toolbox" ref={root} className="overflow-hidden bg-black py-32">
      <h2 className="mx-auto max-w-7xl px-6 text-left text-4xl font-bold text-gray-50 sm:text-6xl md:px-12">Toolbox</h2>
      {[tools.build, tools.ops].map((list, row) => (
        <div key={row} className="mt-12 overflow-hidden">
          <div className="marquee-row flex w-max motion-reduce:mx-auto motion-reduce:w-auto motion-reduce:max-w-7xl motion-reduce:flex-wrap motion-reduce:gap-y-4 motion-reduce:px-6 md:motion-reduce:px-12">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1 || undefined} className={`flex ${copy ? "motion-reduce:hidden" : "motion-reduce:flex-wrap motion-reduce:gap-y-4"}`}>
                {list.map((tool) => (
                  <span key={tool} className="flex items-center whitespace-nowrap text-4xl font-bold sm:text-7xl">
                    <span className={row ? "text-transparent [-webkit-text-stroke:1px_#a5b4fc]" : "text-gray-50"}>{tool}</span>
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
