import React from "react";
import { Tab } from "@headlessui/react";

import prjImg1 from "../assets/80per.svg";

const Projects = () => {
  const projects = [
    {
      title: "Pomodoro Web App",
      value: "pomodoro",
      description: "Design & Development",
      imgUrl: prjImg1,
    },
  ];
  return (
    <section className="">
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
        <Tab.List>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
          <Tab>Tab 3</Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>Content 1</Tab.Panel>
          <Tab.Panel>Content 2</Tab.Panel>
          <Tab.Panel>Content 3</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </section>
  );
};

export default Projects;
