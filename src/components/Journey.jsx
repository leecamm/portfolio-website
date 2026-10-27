import { useRef } from "react";
import { gsap, useGSAP, MOTION } from "../lib/gsap";
import astronaut from "../assets/astronaut.svg";
import { journey } from "../data/content";

export default function Journey({ ready }) {
  const root = useRef();

  useGSAP(
    () => {
      if (!ready) return;
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
    { scope: root, dependencies: [ready] }
  );

  return (
    <section id="journey" ref={root} className="relative overflow-hidden bg-gradient-to-b from-[#1e1b4b] to-black md:h-screen md:motion-reduce:h-auto">
      <h2 className="px-6 pt-24 text-left text-4xl font-bold sm:text-5xl md:absolute md:left-12 md:top-24 md:p-0 md:motion-reduce:static md:motion-reduce:px-12 md:motion-reduce:pt-24">The journey</h2>
      <img src={astronaut} alt="" className="journey-astronaut pointer-events-none absolute left-0 top-1/4 hidden w-40 md:block md:motion-reduce:hidden" />
      <ol className="journey-track flex flex-col gap-6 px-6 py-16 md:h-full md:w-max md:flex-row md:items-center md:gap-16 md:px-[20vw] md:py-0 md:motion-reduce:h-auto md:motion-reduce:w-auto md:motion-reduce:flex-wrap md:motion-reduce:items-stretch md:motion-reduce:gap-6 md:motion-reduce:px-12 md:motion-reduce:py-16">
        {journey.map((step) => (
          <li key={step.title} className="journey-card rounded-3xl border border-white/10 bg-white/5 p-8 text-left md:w-[28rem]">
            <p className="font-mono text-sm text-purple-300">{step.year}</p>
            <h3 className="mt-3 text-2xl font-bold text-gray-50">{step.title}</h3>
            <p className="mt-1 text-gray-300">{step.place}</p>
            <p className="mt-4 text-gray-200">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="journey-line absolute bottom-16 left-12 right-12 hidden h-px origin-left bg-gradient-to-r from-indigo-500 to-purple-500 md:block md:motion-reduce:hidden" />
    </section>
  );
}
