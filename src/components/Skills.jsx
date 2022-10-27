import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import meter75 from "../assets/75per.svg";
import meter80 from "../assets/80per.svg";
import meter90 from "../assets/90per.svg";
import meter95 from "../assets/95per.svg";

const Skills = () => {
  const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };
  return (
    <section className="px-4 py-10 w-full flex justify-center items-center md:px-8 bg-[url('../src/assets/gradient.png')] bg-cover">
      <div className=" w-5/6 items-center justify-center mx-auto bg-black p-10 rounded-3xl lg:-mt-16 xl:-mt-24">
        <div className="w-3/4 mx-auto">
          <h2 className="text-4xl font-bold pb-5">Skills</h2>
          <p className="mb-10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>
        <Carousel
          responsive={responsive}
          infinite={true}
          autoPlay={true}
          autoPlaySpeed={3000}
        >
          <div className="">
            <img className="mx-auto w-1/2 h-1/2" src={meter95} alt="react" />
            <h5 className="pt-5 font-semibold">HTML5/CSS3</h5>
          </div>
          <div className="mx-auto">
            <img className="mx-auto w-1/2 h-1/2" src={meter90} alt="react" />
            <h5 className="pt-5 font-semibold">ReactJS</h5>
          </div>
          <div className="mx-auto">
            <img className="mx-auto w-1/2 h-1/2" src={meter90} alt="react" />
            <h5 className="pt-5 font-semibold">TailwindCSS</h5>
          </div>
          <div className="mx-auto">
            <img className="mx-auto w-1/2 h-1/2" src={meter90} alt="react" />
            <h5 className="pt-5 font-semibold">JavaScript</h5>
          </div>
          <div className="mx-auto">
            <img className="mx-auto w-1/2 h-1/2" src={meter90} alt="react" />
            <h5 className="pt-5 font-semibold">UI/UX</h5>
          </div>
          <div className="">
            <img className="mx-auto w-1/2 h-1/2" src={meter95} alt="react" />
            <h5 className="pt-5 font-semibold">Git</h5>
          </div>
          <div className="">
            <img className="mx-auto w-1/2 h-1/2" src={meter95} alt="react" />
            <h5 className="pt-5 font-semibold">Figma</h5>
          </div>
          <div className="mx-auto">
            <img className="mx-auto w-1/2 h-1/2" src={meter80} alt="react" />
            <h5 className="pt-5 font-semibold">Unity</h5>
          </div>
          <div className="mx-auto">
            <img className="mx-auto w-1/2 h-1/2" src={meter75} alt="react" />
            <h5 className="pt-5 font-semibold">Swift/SwiftUI</h5>
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default Skills;
