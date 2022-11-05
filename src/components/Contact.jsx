import React, { useState, useRef } from "react";
import emailjs from "@emailjs/browser";

import contactImg from "../assets/contact.svg";

const Contact = () => {
  const formInitialDetails = {
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  };

  const form = useRef();

  const [buttonText, setButtonText] = useState("Send");

  const sendEmail = (e) => {
    e.preventDefault();
    setButtonText("Sending...");
    emailjs
      .sendForm(
        "service_2uhn9y9",
        "template_ebuf4pd",
        form.current,
        "G-DHKLQCXzx8Z5wO6"
      )
      .then(
        (result) => {
          console.log(result.text);
          alert("Message sent, We'll contact you shortly");
          setButtonText("Send");
          form.current.reset();
        },
        (error) => {
          console.log(error.text);
          alert("Something went wrong, please try again later");
        }
      );
  };

  return (
    <section
      className="contact grid grid-cols-1 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-6 lg:gap-10 rounded items-center justify-center"
      id="contact"
    >
      <img
        src={contactImg}
        alt="Contact Image"
        className="hidden md:block w-full h-3/4 md:col-start-1 md:col-span-4 lg:col-span-5"
      />
      <div className="block justify-start text-left col-span-5 md:col-start-6 mb-5 p-5 pl-10 mx-auto md:mx-0">
        <h1 className="font-bold text-4xl sm:text-5xl py-5 text-white">
          {`Get In Touch`}
        </h1>
        <form className="w-full max-w-lg pt-5" ref={form} onSubmit={sendEmail}>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <input
                className="appearance-none block w-full bg-gray-500 text-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 mb-3 leading-tight focus:outline-none placeholder:text-gray-300"
                id="grid-first-name"
                type="text"
                placeholder="First Name"
                name="from_firstname"
              />
            </div>
            <div className="w-full md:w-1/2 px-3">
              <input
                className="appearance-none block w-full bg-gray-500 text-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 mb-3 leading-tight focus:outline-none placeholder:text-gray-300"
                id="grid-last-name"
                type="text"
                placeholder="Last Name"
                name="from_lastname"
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <input
                className="appearance-none block w-full bg-gray-500 text-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 mb-3 leading-tight focus:outline-none placeholder:text-gray-300"
                id="email"
                type="email"
                placeholder="Email Address"
                name="from_email"
              />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <textarea
                className="no-resize appearance-none block w-full bg-gray-500 text-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 mb-3 leading-tight focus:outline-none placeholder:text-gray-300 h-48"
                id="message"
                placeholder="Message"
                name="message"
              ></textarea>
            </div>
          </div>
          <div className="md:flex md:items-center">
            <div className="md:w-1/3">
              <button
                className="bg-gray-50 hover:bg-gray-100 focus:shadow-outline focus:outline-none text-black font-bold p-5 w-36 rounded-2xl"
                type="submit"
                value="Send"
              >
                {buttonText}
              </button>
            </div>
          </div>
          {/* {status.message && (
            <p className={status.success === false ? "danger" : "success"}>
              {status.message}
            </p>
          )} */}
        </form>
      </div>
    </section>
  );
};

export default Contact;
