import React from "react";
import { useState, useEffect } from "react";
import logo from "../assets/Logo.svg";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={
        scrolled ? "scrolled" : "w-full px-2 sm:px-4 py-5 sm:py-10 rounded"
      }
    >
      <div className="container flex flex-wrap justify-between items-center mx-auto">
        <a href="#home" className="flex items-center">
          <img src={logo} className="mr-3 h-6 sm:h-14" alt="Harry LE Logo" />
        </a>
        <button
          data-collapse-toggle="navbar-default"
          type="button"
          className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-default"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-6 h-6"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
        <div className="w-full flex md:flex md:w-auto md:space-x-20">
          <ul className="flex flex-col p-4 mt-4 rounded-lg  md:flex-row md:space-x-20 md:mt-0 md:text-sm md:font-medium md:border-0 ">
            <li>
              <a
                href="#home"
                className="block py-2 pr-4 pl-3 text-white rounded md:bg-transparent md:p-0 hover:text-gray-200 text-lg"
                aria-current="page"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#skills"
                className="block text-lg py-2 pr-4 pl-3 text-white rounded hover:text-gray-200 md:hover:bg-transparent md:border-0 md:hover:text-gray-200 md:p-0 "
              >
                Skills
              </a>
            </li>
            <li>
              <a
                href="#projects"
                className="block text-lg py-2 pl-3 text-white rounded hover:text-gray-200 md:hover:bg-transparent md:border-0 md:hover:text-gray-200 md:p-0"
              >
                Projects
              </a>
            </li>
          </ul>
          <button className="text-md px-5 py-3 border border-white rounded-full hover:bg-gradient-to-r from-indigo-500 to-purple-500">
            Let's Connect
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
