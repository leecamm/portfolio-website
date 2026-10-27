import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import { it, expect, afterEach } from "vitest";
import App from "./App";

// vitest globals are off, so RTL does not auto-cleanup between tests.
afterEach(cleanup);

it("renders the hero greeting as the only h1", () => {
  render(<App />);
  const h1s = screen.getAllByRole("heading", { level: 1 });
  expect(h1s).toHaveLength(1);
  expect(h1s[0]).toHaveTextContent("Xin chào! I'm Harry");
});

it("exposes all rotating roles to assistive tech", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "DevOps Engineer, Designer, Developer" })).toBeInTheDocument();
});

it("renders the about statement", () => {
  render(<App />);
  expect(screen.getByText(/people on both ends/)).toBeInTheDocument();
});

it("shows the four journey steps in order", () => {
  const { container } = render(<App />);
  const steps = within(container.querySelector("#journey")).getAllByRole("listitem");
  expect(steps.map((s) => s.querySelector("h3").textContent)).toEqual([
    "ICT & Media Design",
    "Frontend Developer",
    "iOS Developer",
    "DevOps Engineer",
  ]);
});

it("runs the mission control pipeline", () => {
  const { container } = render(<App />);
  const mission = within(container.querySelector("#mission"));
  expect(mission.getByRole("heading", { name: "Mission control" })).toBeInTheDocument();
  for (const stage of ["build", "test", "release", "deploy"]) {
    expect(mission.getByText(stage)).toBeInTheDocument();
  }
});

const SECTIONS = ["home", "about", "journey", "mission", "work", "toolbox", "contact"];

it("renders every section in story order", () => {
  const { container } = render(<App />);
  expect([...container.querySelectorAll("section[id]")].map((s) => s.id)).toEqual(SECTIONS);
});

it("points every nav anchor at a real section", () => {
  const { container } = render(<App />);
  for (const a of container.querySelectorAll('nav a[href^="#"]')) {
    expect(container.querySelector(a.getAttribute("href"))).not.toBeNull();
  }
});

it("shows ops case studies first and switches tabs", () => {
  render(<App />);
  expect(screen.getByRole("tab", { name: "Ops" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Maintaining GitLab CI/CD")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Design & Web" }));
  expect(screen.getByText("Pomodoro Web App")).toBeInTheDocument();
  expect(screen.queryByText("Maintaining GitLab CI/CD")).toBeNull();
});

it("lists each tool once for assistive tech", () => {
  const { container } = render(<App />);
  const visible = within(container.querySelector("#toolbox"))
    .getAllByText("Figma")
    .filter((el) => !el.closest('[aria-hidden="true"]'));
  expect(visible).toHaveLength(1);
});

it("leaves everything visible with motion off", () => {
  const { container } = render(<App />);
  expect(container.querySelectorAll('[style*="opacity: 0"], [style*="visibility: hidden"]')).toHaveLength(0);
  expect(container.textContent).not.toMatch(/coffee/i);
  expect(screen.getByRole("heading", { name: "Let's build something reliable." })).toBeInTheDocument();
});
