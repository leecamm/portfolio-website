import pomodoroImg from "../assets/finishmytask.webp";
import myPixelImg from "../assets/mypixel.webp";

// Copy is drafted from Harry's LinkedIn. Add real metrics here only when Harry supplies them.
export const profile = {
  greeting: "Xin chào! I'm Harry",
  roles: ["DevOps Engineer", "Designer", "Developer"],
  intro:
    "DevOps Engineer at Swisscom in Rotterdam. I help teams build, ship and run software reliably, with a designer's eye for the people who use it.",
  about:
    "I think about the people on both ends: the developers who rely on the tooling, and the users who rely on the product.",
  bio: "I came to DevOps from UX design and front-end development. Today I work on GitLab CI/CD, releases, monitoring and agentic AI tooling, and I'm growing toward owning systems end to end.",
};

export const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#journey", label: "Journey" },
  { href: "#work", label: "Work" },
  { href: "#toolbox", label: "Toolbox" },
];

export const journey = [
  { year: "2019", title: "ICT & Media Design", place: "Fontys University of Applied Sciences", text: "Bachelor in UX, media design and front-end development." },
  { year: "2021", title: "Frontend Developer", place: "Accenture, Utrecht", text: "Building web front ends with Angular and TypeScript." },
  { year: "2023", title: "iOS Developer", place: "Swisscom, Rotterdam", text: "Native iOS with Swift and ARKit." },
  { year: "2023 – now", title: "DevOps Engineer", place: "Swisscom, Rotterdam", text: "GitLab CI/CD, releases, system health and agentic AI tooling." },
];

export const pipeline = [
  { stage: "build", log: "compiling services · lint passed" },
  { stage: "test", log: "unit and integration suites green" },
  { stage: "release", log: "tagging release · changelog written" },
  { stage: "deploy", log: "rolling out · health checks passing" },
];

export const caseStudies = [
  { title: "Maintaining GitLab CI/CD", description: "Keeping the pipelines teams depend on fast, readable and dependable, so a red build always explains itself.", tags: ["GitLab CI/CD", "YAML"] },
  { title: "Release & deployment", description: "Owning the path from merge to production: versioned releases and repeatable deployments that nobody has to babysit.", tags: ["Releases", "Deployments"] },
  { title: "Agentic AI work", description: "Bringing AI agents into the engineering workflow so routine operational work gets done consistently, with a human in the loop.", tags: ["Agentic AI", "TypeScript"] },
  { title: "Front-end refactor", description: "Refactoring front-end code to be clean, maintainable and easier to operate, without changing what users see.", tags: ["TypeScript", "Refactoring"] },
  { title: "Continuous improvements", description: "Watching system health and turning what monitoring tells us into small, steady improvements.", tags: ["Monitoring", "Observability"] },
];

export const workTabs = [
  { id: "ops", label: "Ops", items: caseStudies },
  {
    id: "design",
    label: "Design & Web",
    items: [
      { title: "Pomodoro Web App", description: "Design and development of a focus timer web app.", image: pomodoroImg, url: "https://www.behance.net/gallery/154402037/Finish-My-Task-Pomodoro-Web-Application" },
      { title: "My Pixel", description: "A Pinterest-style social media site, built while learning full-stack development.", image: myPixelImg, url: "https://www.behance.net/gallery/154612969/My-Pixel-A-Pinterest-Clone-Website" },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    items: [
      { title: "Levart Travel", description: "An iOS travel app written in Swift.", url: "https://github.com/leecamm/levart-travel" },
    ],
  },
];

export const tools = {
  build: ["Figma", "UI/UX", "React", "Angular", "TypeScript", "Tailwind CSS", "Swift", "ARKit", "Unity"],
  ops: ["GitLab CI/CD", "Git", "Releases", "Deployments", "Monitoring", "Agentic AI", "Refactoring"],
};
