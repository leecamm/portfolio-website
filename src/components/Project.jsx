import { useState } from "react";
import { Tab } from "@headlessui/react";

import prjImg1 from "../assets/finishmytask.png";
import prjImg2 from "../assets/mypixel.png";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  let [categories] = useState({
    Website: [
      {
        id: 1,
        title: "Pomodoro Web App",
        value: "pomodoro",
        description: "Design & Development",
        imgUrl: prjImg1,
        url: "https://www.behance.net/gallery/154402037/Finish-My-Task-Pomodoro-Web-Application",
      },
      {
        id: 2,
        title: "My Pixel - Social Media Website",
        value: "mypixel",
        description: "Learning Full Stack Development",
        imgUrl: prjImg2,
        url: "https://www.behance.net/gallery/154612969/My-Pixel-A-Pinterest-Clone-Website",
      },
    ],
    "UI/UX": [
      {
        id: 1,
        title: "Is tech making coffee better or worse?",
        date: "Jan 7",
        commentCount: 29,
        shareCount: 16,
      },
      {
        id: 2,
        title: "The most innovative things happening in coffee",
        date: "Mar 19",
        commentCount: 24,
        shareCount: 12,
      },
    ],
    Mobile: [
      {
        id: 1,
        title: "Ask Me Anything: 10 answers to your questions about coffee",
        date: "2d ago",
        commentCount: 9,
        shareCount: 5,
      },
      {
        id: 2,
        title: "The worst advice we've ever heard about coffee",
        date: "4d ago",
        commentCount: 1,
        shareCount: 2,
      },
    ],
  });

  return (
    <div className="w-full max-w-6xl px-5 py-10 sm:px-0 mx-auto">
      <div className="w-3/4 mx-auto">
        <h2 className="text-4xl font-bold py-8">Projects</h2>
        <p className="mb-10">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </div>
      <Tab.Group>
        <Tab.List className="flex space-x-2 md:space-x-24 rounded-full p-1 md:px-36 mb-10">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-full py-2.5 text-sm border-2 font-semibold leading-5 gap-10 text-white",
                  "ring-gray-200 ring-opacity-60",
                  selected
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow"
                    : " hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {Object.values(categories).map((posts, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                "rounded-xl bg-black p-3",
                "ring-white ring-opacity-60 focus:outline-none"
              )}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {posts.map((post) => (
                  <div className="border-2 rounded-xl relative">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={post.id}
                    >
                      <img
                        src={post.imgUrl}
                        className="inset-0 object-cover bg-center z-0 rounded-xl"
                      ></img>
                      <div className="opacity-0 hover:opacity-80 hover:rounded-xl absolute duration-300 inset-0 z-10 flex flex-col justify-center items-center bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500">
                        <h3 className="text-xl text-white font-semibold">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-100">
                          {post.description}
                        </p>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
