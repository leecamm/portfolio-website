import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { gsap, SplitText, useGSAP, MOTION } from "../lib/gsap";
import contactImg from "../assets/contact.svg";

const inputClass =
  "appearance-none block w-full bg-gray-500 text-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 mb-3 leading-tight focus:border-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 placeholder:text-gray-300";

const Contact = ({ ready }) => {
  const root = useRef();
  const form = useRef();
  const [buttonText, setButtonText] = useState("Send");
  const [status, setStatus] = useState("");

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION.any, () => {
        const split = SplitText.create(".contact-title", { type: "words", mask: "words" });
        gsap.from(split.words, { yPercent: 110, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".contact-title", start: "top 85%" }, onComplete: () => split.revert() }); // drop the mask so descenders are not clipped
      });
      mm.add(MOTION.desktop, () => {
        const btn = root.current.querySelector(".magnetic");
        const x = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
        const y = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
        const move = (e) => {
          const r = btn.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.35);
          y((e.clientY - r.top - r.height / 2) * 0.35);
        };
        const leave = () => { x(0); y(0); };
        btn.addEventListener("pointermove", move);
        btn.addEventListener("pointerleave", leave);
        return () => {
          btn.removeEventListener("pointermove", move);
          btn.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root, dependencies: [ready] }
  );

  const sendEmail = (e) => {
    e.preventDefault();
    setButtonText("Sending...");
    setStatus("Sending your message...");
    emailjs.sendForm("service_2uhn9y9", "template_ebuf4pd", form.current, "G-DHKLQCXzx8Z5wO6").then(
      () => {
        alert("Message sent, I'll get back to you shortly");
        setStatus("Message sent. I'll get back to you shortly.");
        setButtonText("Send");
        form.current.reset();
      },
      () => {
        alert("Something went wrong, please try again later");
        setStatus("Something went wrong. Please try again later.");
        setButtonText("Send");
      }
    );
  };

  return (
    <section id="contact" ref={root} className="contact mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-32 md:grid-cols-2 md:px-12">
      <img src={contactImg} alt="" className="hidden w-full md:block" />
      <div className="text-left">
        <h2 className="contact-title text-4xl font-bold text-white sm:text-6xl">Let's build something reliable.</h2>
        <form className="w-full max-w-lg pt-10" ref={form} onSubmit={sendEmail}>
          <div className="-mx-3 mb-6 flex flex-wrap">
            <div className="mb-6 w-full px-3 md:mb-0 md:w-1/2">
              <input className={inputClass} type="text" placeholder="First Name" aria-label="First name" autoComplete="given-name" name="from_firstname" />
            </div>
            <div className="w-full px-3 md:w-1/2">
              <input className={inputClass} type="text" placeholder="Last Name" aria-label="Last name" autoComplete="family-name" name="from_lastname" />
            </div>
          </div>
          <div className="mb-6">
            <input className={inputClass} type="email" required placeholder="Email Address" aria-label="Email address" autoComplete="email" name="from_email" />
          </div>
          <div className="mb-6">
            <textarea className={`${inputClass} h-48 resize-none`} required placeholder="Message" aria-label="Message" name="message" />
          </div>
          <button className="magnetic w-36 rounded-2xl bg-gray-50 p-5 font-bold text-black hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={buttonText === "Sending..."}>
            {buttonText}
          </button>
          <p role="status" aria-live="polite" className="mt-4 min-h-6 text-gray-300">{status}</p>
        </form>
      </div>
    </section>
  );
};

export default Contact;
