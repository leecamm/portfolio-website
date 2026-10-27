import { useState } from "react";
import "./App.css";
import { gsap, ScrollSmoother, useGSAP, MOTION } from "./lib/gsap";

import Navbar from "./components/Navbar";
import Cursor from "./components/Cursor";
import Hero from "./components/Hero";
import About from "./components/About";
import Journey from "./components/Journey";
import MissionControl from "./components/MissionControl";
import Work from "./components/Work";
import Toolbox from "./components/Toolbox";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  // Child effects run before this one, so children create their ScrollTriggers only once `ready`
  // flips, which happens after the smoother exists (GSAP wants the smoother created first).
  const [ready, setReady] = useState(false);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION.desktop, () => {
      ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.2, effects: true });
    });
    setReady(true);
  });

  return (
    <>
      <Navbar ready={ready} />
      <Cursor />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main className="App">
            <Hero />
            <About ready={ready} />
            <Journey ready={ready} />
            <MissionControl ready={ready} />
            <Work ready={ready} />
            <Toolbox ready={ready} />
            <div className="bg-[url('../src/assets/gradient.webp')] bg-cover">
              <Contact ready={ready} />
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
