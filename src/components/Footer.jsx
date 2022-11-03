import React from "react";

import logo from "../assets/Logo.svg";
import linkedin from "../assets/linkedin.svg";
import behance from "../assets/behance.svg";
import github from "../assets/github.svg";

const Footer = () => {
  return (
    <footer>
      <div className="pt-14 pb-8 flex justify-between items-center px-4 md:px-20">
        <img src={logo} className="mr-3 h-14 sm:h-20" alt="Harry LE Logo" />
        <div className="grid grid-rows-3 text-end">
          <div className="flex items-center gap-5 justify-end">
            <a
              href="https://www.linkedin.com/in/duchieule/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={linkedin}
                className="h-10 sm:h-14"
                alt="LinkedIn Logo"
              />
            </a>
            <a
              href="https://www.behance.net/duchieule"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={behance} className="h-10 sm:h-14" alt="Behance Logo" />
            </a>
            <a
              href="https://github.com/leecamm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={github} className="h-8 sm:h-12" alt="GitHub Logo" />
            </a>
          </div>
          <p className="pt-4 text-xs md:text-base">
            Image by{" "}
            <a
              href="https://www.freepik.com/free-vector/cute-astronaut-riding-ufo-with-space-banner-cartoon-vector-icon-illustration-science-technology_23446116.htm#page=4&position=37&from_view=author"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="font-bold">catalyststuff</span>
            </a>{" "}
            on Freepik
          </p>
          <p className="text-sm md:text-base">
            Copyright 2022 by Harry Le. All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
