import React from "react";
import headerImg from "../assets/astronaut.svg";

const IntroBanner = () => {
  return (
    <section className="grid grid-cols-2 gap-2" id="home">
      <div className="block justify-start text-left">
        <h1 className=" font-bold">
          {`Xin Chao! I'm Harry`} <span>Front-end Developer</span>
        </h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum
        </p>
      </div>
      <img src={headerImg} alt="Header Image" className="w-full h-5/6" />
    </section>
  );
};

export default IntroBanner;
