import React, { useState, useEffect } from "react";

import headerImg from "../assets/astronaut.svg";

const IntroBanner = () => {
  const [loopNum, setLoopNum] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const toRotate = ["Front-end Developer", "UI/UX Designer", "iOS Developer"];
  const [text, setText] = useState("");
  const [delta, setDelta] = useState(300 - Math.random() * 100);
  const period = 1500;

  useEffect(() => {
    let ticker = setInterval(() => {
      tick();
    }, delta);

    return () => {
      clearInterval(ticker);
    };
  }, [text]);

  const tick = () => {
    let i = loopNum % toRotate.length;
    let fullText = toRotate[i];
    let updatedText = isDeleting
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    setText(updatedText);

    if (isDeleting) {
      setDelta((prevDelta) => prevDelta / 2);
    }
    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setDelta(period);
    } else if (isDeleting && updatedText === "") {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setDelta(500);
    }
  };

  return (
    <>
      <section
        className="banner grid grid-cols-1 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-6 lg:gap-10 rounded items-center justify-center "
        id="home"
      >
        <div className="block justify-start text-left col-span-5 mb-5 p-5 md:pl-36 md:-mt-10">
          <h1 className="font-bold text-4xl sm:text-5xl py-5">
            {`Xin Chào! I'm Harry`}
          </h1>
          <h2 className="font-bold text-4xl sm:text-5xl pb-4">
            <span className="leading-tight">🧑🏼‍💻 {text}</span>
          </h2>
          <p className="pt-5">
            I am an Front-end Developer and Designer with ambition, who can
            carry out complex projects with thoroughness and accuracy. Willing
            to come up with new ideas and learn new knowledge. Skilled in
            Front-end Development, Mobile, and UI/UX Design.
          </p>
        </div>
        <img
          src={headerImg}
          alt="Header Image"
          className="w-full h-3/4 md:col-start-5 md:col-span-4 lg:col-start-6 lg:col-span-5"
        />
      </section>
      <div className="w-56 md:pb-10 xl:pb-20 items-center justify-center pb-5 mx-auto">
        <p>Scroll down to explore</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 mx-auto mt-4 animate-bounce"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>
    </>
  );
};

export default IntroBanner;
