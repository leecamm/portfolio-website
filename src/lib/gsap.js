import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText);

// Reduced motion matches none of these, so nothing animates and markup stays in its final state.
export const MOTION = {
  desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
  any: "(prefers-reduced-motion: no-preference)",
};

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };
