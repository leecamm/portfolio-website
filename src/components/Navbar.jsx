import { useRef, useState } from "react";
import { gsap, ScrollTrigger, ScrollSmoother, useGSAP, MOTION } from "../lib/gsap";
import logo from "../assets/Logo.svg";
import myCV from "../assets/LeDucHieu_CV-new.pdf";
import { navLinks } from "../data/content";

const Navbar = ({ ready }) => {
  const root = useRef();
  const [open, setOpen] = useState(false);

  useGSAP(() => {
    if (!ready) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION.any, () => {
      const slide = gsap.quickTo(root.current, "yPercent", { duration: 0.4, ease: "power3" });
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => slide(self.direction === 1 && self.scroll() > 120 ? -100 : 0),
      });
    });
  }, { dependencies: [ready] });

  // With ScrollSmoother active, native anchor jumps skip the smoothed content.
  const goTo = (e) => {
    setOpen(false);
    const smoother = ScrollSmoother.get();
    if (!smoother) return;
    e.preventDefault();
    smoother.scrollTo(e.currentTarget.getAttribute("href"), true, "top top");
  };

  return (
    <nav ref={root} className="fixed inset-x-0 top-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-6 py-4 md:px-12">
        <a href="#home" onClick={goTo}>
          <img src={logo} className="h-10 sm:h-12" alt="Harry Le, home" />
        </a>
        <button
          className="p-2 text-gray-200 md:hidden"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <ul
          id="nav-menu"
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-6 py-6 md:flex md:w-auto md:flex-row md:items-center md:gap-10 md:py-0`}
        >
          {navLinks.map((link) => (
            <li key={link.href} className="text-lg text-gray-50 hover:text-gray-200">
              <a href={link.href} onClick={goTo}>{link.label}</a>
            </li>
          ))}
          <li className="text-lg text-gray-50 hover:text-gray-200">
            <a href={myCV} target="_blank" rel="noopener noreferrer">My CV</a>
          </li>
          <li>
            <a
              href="#contact"
              onClick={goTo}
              className="inline-block rounded-full border border-white px-5 py-3 hover:bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              Let's Connect
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
