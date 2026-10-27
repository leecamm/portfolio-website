import { useRef, useState } from "react";
import { gsap, useGSAP, MOTION } from "../lib/gsap";
import { workTabs } from "../data/content";

export default function Work({ ready }) {
  const root = useRef();
  const [active, setActive] = useState(workTabs[0].id);
  const tab = workTabs.find((t) => t.id === active);

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        gsap.fromTo(
          ".work-card",
          { clipPath: "inset(100% 0% 0% 0%)", y: 40 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".work-grid", start: "top 80%" } }
        );
      });
      mm.add(MOTION.desktop, () => {
        const offs = gsap.utils.toArray(".work-card", root.current).map((card) => {
          gsap.set(card, { transformPerspective: 800 });
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
          const move = (e) => {
            const r = card.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 10);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          };
          const leave = () => { rx(0); ry(0); };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          return () => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          };
        });
        return () => offs.forEach((off) => off());
      });
    },
    { scope: root, dependencies: [active, ready], revertOnUpdate: true }
  );

  return (
    <section id="work" ref={root} className="bg-black px-6 py-32 md:px-12">
      <div className="mx-auto max-w-7xl text-left">
        <h2 className="text-4xl font-bold text-gray-50 sm:text-6xl">Selected work</h2>
        <div role="tablist" aria-label="Work categories" className="mt-10 flex flex-wrap gap-3">
          {workTabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === active}
              aria-controls="work-panel"
              onClick={() => setActive(t.id)}
              className={`rounded-full border px-5 py-3 text-lg transition-colors ${
                t.id === active
                  ? "border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  : "border-white/30 text-gray-200 hover:border-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          id="work-panel"
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          tabIndex={0}
          className="mt-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
        >
        <ul role="list" className="work-grid grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tab.items.map((item) => {
            const body = (
              <>
                {item.image && <img src={item.image} alt="" className="aspect-video w-full rounded-2xl object-cover" />}
                <h3 className="mt-6 text-2xl font-bold text-gray-50">{item.title}</h3>
                <p className="mt-3 text-gray-300">{item.description}</p>
                {item.tags && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <li key={t} className="rounded-full border border-white/15 px-3 py-1 font-mono text-xs text-purple-200">{t}</li>
                    ))}
                  </ul>
                )}
              </>
            );
            return (
              <li key={item.title} className="work-card rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">{body}</a> : body}
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    </section>
  );
}
