import "./App.css";
import { gsap, ScrollSmoother, useGSAP, MOTION } from "./lib/gsap";

import Navbar from "./components/Navbar";
import Cursor from "./components/Cursor";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Project from "./components/Project";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION.desktop, () => {
      ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.2, effects: true });
    });
  });

  return (
    <>
      <Navbar />
      <Cursor />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main className="App">
            <Hero />
            <About />
            <Skills />
            <Project />
            <div className="bg-[url('../src/assets/gradient.png')] bg-cover">
              <Contact />
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
