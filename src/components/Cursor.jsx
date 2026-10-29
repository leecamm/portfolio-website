import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import ufo from "../assets/ufo.svg";

export default function Cursor() {
  const ref = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      gsap.set(ref.current, { xPercent: -50, yPercent: -50 });
      const x = gsap.quickTo(ref.current, "x", { duration: 0.6, ease: "power3" });
      const y = gsap.quickTo(ref.current, "y", { duration: 0.6, ease: "power3" });
      let shown = false;
      const move = (e) => {
        // Stay hidden until the first pointer move, and start there instead of flying in from the corner.
        if (!shown) {
          shown = true;
          gsap.set(ref.current, { x: e.clientX, y: e.clientY, autoAlpha: 1 });
        }
        x(e.clientX);
        y(e.clientY);
      };
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
