import { useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import IntroBanner from "./components/IntroBanner";

function App() {
  return (
    <div className="App">
      <section className="bg-[url('../src/assets/background.png')] bg-cover">
        <Navbar />
        <IntroBanner />
      </section>
    </div>
  );
}

export default App;
