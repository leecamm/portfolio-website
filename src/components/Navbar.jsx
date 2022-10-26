import React from "react";
import { useState, useEffect } from "react";
import logo from "../assets/Logo.svg";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [navbar, setNavbar] = useState(false);

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
    // <nav
    //   className={
    //     scrolled ? "scrolled" : "w-full px-2 sm:px-4 py-5 sm:py-10 rounded"
    //   }
    // >
    //   <div className="container flex flex-wrap justify-between items-center mx-auto">
    //     <a href="#home" className="flex items-center">
    //       <img
    //         src={logo}
    //         className="mr-3 pl-5 h-10 sm:h-14"
    //         alt="Harry LE Logo"
    //       />
    //     </a>
    //     <div className="md:hidden">
    //       <button
    //         className="p-2 text-gray-700 rounded-md outline-none focus:border-gray-400 focus:border"
    //         onClick={() => setNavbar(!navbar)}
    //       >
    //         {navbar ? (
    //           <svg
    //             xmlns="http://www.w3.org/2000/svg"
    //             className="w-6 h-6"
    //             viewBox="0 0 20 20"
    //             fill="currentColor"
    //           >
    //             <path
    //               fillRule="evenodd"
    //               d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
    //               clipRule="evenodd"
    //             />
    //           </svg>
    //         ) : (
    //           <svg
    //             xmlns="http://www.w3.org/2000/svg"
    //             className="w-6 h-6"
    //             fill="none"
    //             viewBox="0 0 24 24"
    //             stroke="currentColor"
    //             strokeWidth={2}
    //           >
    //             <path
    //               strokeLinecap="round"
    //               strokeLinejoin="round"
    //               d="M4 6h16M4 12h16M4 18h16"
    //             />
    //           </svg>
    //         )}
    //       </button>
    //     </div>
    //     <div
    //       className={`flex-1 justify-self-center pb-3 mt-8 md:block md:pb-0 md:mt-0 ${
    //         navbar ? "block" : "hidden"
    //       }`}
    //     >
    //       <ul className="flex flex-col p-4 mt-4 rounded-lg  md:flex-row md:space-x-20 md:mt-0 md:text-sm md:font-medium md:border-0 ">
    //         <li>
    //           <a
    //             href="#home"
    //             className="block py-2 pr-4 pl-3 text-white rounded md:bg-transparent md:p-0 hover:text-gray-200 text-lg"
    //             aria-current="page"
    //           >
    //             Home
    //           </a>
    //         </li>
    //         <li>
    //           <a
    //             href="#skills"
    //             className="block text-lg py-2 pr-4 pl-3 text-white rounded hover:text-gray-200 md:hover:bg-transparent md:border-0 md:hover:text-gray-200 md:p-0 "
    //           >
    //             Skills
    //           </a>
    //         </li>
    //         <li>
    //           <a
    //             href="#projects"
    //             className="block text-lg py-2 pl-3 text-white rounded hover:text-gray-200 md:hover:bg-transparent md:border-0 md:hover:text-gray-200 md:p-0"
    //           >
    //             Projects
    //           </a>
    //         </li>
    //       </ul>
    //       <button className="text-md px-5 py-3 border border-white rounded-full hover:bg-gradient-to-r from-indigo-500 to-purple-500">
    //         Let's Connect
    //       </button>
    //     </div>
    //   </div>
    // </nav>
    <nav className={scrolled ? "scrolled" : "w-full px-2 sm:px-4 py-5 rounded"}>
      <div className="justify-between px-4 mx-auto lg:max-w-7xl md:flex md:items-center md:px-8">
        <div>
          <div className="flex items-center justify-between py-3 md:py-5 md:block">
            <a href="#home" className="flex items-center">
              <img
                src={logo}
                className="mr-3 h-10 sm:h-14"
                alt="Harry LE Logo"
              />
            </a>
            <div className="md:hidden">
              <button
                className="p-2 text-gray-200 rounded-md outline-none"
                onClick={() => setNavbar(!navbar)}
              >
                {navbar ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <div>
          <div
            className={`justify-self-center pb-3 mt-5 md:block md:pb-0 md:mt-0 ${
              navbar ? "block" : "hidden"
            }`}
          >
            <ul className="items-center justify-center space-y-8 md:flex md:space-x-6 md:space-y-0 gap-10">
              <li className="text-gray-50 hover:text-gray-200 text-lg">
                <a href="#home">Home</a>
              </li>
              <li className="text-gray-50 hover:text-gray-200 text-lg">
                <a href="#skills">Skills</a>
              </li>
              <li className="text-gray-50 hover:text-gray-200 text-lg">
                <a href="#projects">Projects</a>
              </li>
              <button className="text-md px-5 py-3 border border-white rounded-full hover:bg-gradient-to-r from-indigo-500 to-purple-500">
                Let's Connect
              </button>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
