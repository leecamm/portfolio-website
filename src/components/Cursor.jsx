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
