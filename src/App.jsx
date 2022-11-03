import { useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import IntroBanner from "./components/IntroBanner";
import Skills from "./components/Skills";
import Project from "./components/Project";
import Contact from "./components/Contact";

function App() {
  return (
    <div className="App">
      <section className="bg-[url('../src/assets/background.png')] bg-cover">
        <Navbar />
        <IntroBanner />
      </section>
      <Skills />
      <Project />
      <section className="bg-[url('../src/assets/gradient.png')] bg-cover">
        <Contact />
      </section>
    </div>
  );
}

export default App;
