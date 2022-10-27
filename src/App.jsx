import { useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import IntroBanner from "./components/IntroBanner";
import Skills from "./components/Skills";
import Projects from "./components/Projects";

function App() {
  return (
    <div className="App">
      <section className="bg-[url('../src/assets/background.png')] bg-cover">
        <Navbar />
        <IntroBanner />
      </section>
      <Skills />
      <Projects />
    </div>
  );
}

export default App;
