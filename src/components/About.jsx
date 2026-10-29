import { useRef } from "react";
import { gsap, SplitText, useGSAP, MOTION } from "../lib/gsap";
import { profile } from "../data/content";

export default function About({ ready }) {
  const root = useRef();

  useGSAP(
    () => {
      if (!ready) return;
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
    { scope: root, dependencies: [ready] }
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
