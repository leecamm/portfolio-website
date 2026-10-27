import { render, screen, cleanup, within } from "@testing-library/react";
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

it("has home and about sections", () => {
  const { container } = render(<App />);
  const ids = [...container.querySelectorAll("section[id]")].map((s) => s.id);
  expect(ids).toEqual(expect.arrayContaining(["home", "about"]));
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
