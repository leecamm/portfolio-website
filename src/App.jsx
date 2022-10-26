import { useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import IntroBanner from "./components/IntroBanner";
import Skills from "./components/Skills";

function App() {
  return (
    <div className="App">
      <section className="bg-[url('../src/assets/background.png')] bg-cover">
        <Navbar />
        <IntroBanner />
      </section>
      <Skills />
    </div>
  );
}

export default App;
