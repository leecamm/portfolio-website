import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

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
    <section className="px-4 py-10 w-full flex justify-center items-center md:px-8 bg-gray-900">
      <div className=" w-5/6 items-center justify-center mx-auto bg-black p-10 rounded-3xl">
        <div className="w-3/4 mx-auto">
          <h2 className="text-4xl font-bold pb-5">Skills</h2>
          <p className="mb-10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>
        <Carousel responsive={responsive} infinite={true}>
          <div className="">
            <img
              className="mx-auto"
              src="https://img.icons8.com/color/96/000000/react-native.png"
              alt="react"
            />
            <h5 className="">Web Development</h5>
          </div>
          <div className="mx-auto">
            <img
              className="mx-auto"
              src="https://img.icons8.com/color/96/000000/react-native.png"
              alt="react"
            />
            <h5>Web Development</h5>
          </div>
          <div className="mx-auto">
            <img
              className="mx-auto"
              src="https://img.icons8.com/color/96/000000/react-native.png"
              alt="react"
            />
            <h5>Web Development</h5>
          </div>
          <div className="mx-auto">
            <img
              className="mx-auto"
              src="https://img.icons8.com/color/96/000000/react-native.png"
              alt="react"
            />
            <h5>Web Development</h5>
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default Skills;
