import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import emailjs from "@emailjs/browser";
import App from "./App";
import { tools } from "./data/content";
import { ScrollTrigger } from "./lib/gsap";

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
  const anchors = [...container.querySelectorAll('nav a[href^="#"]')];
  expect(anchors.length).toBeGreaterThan(0);
  for (const a of anchors) {
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
  const toolbox = within(container.querySelector("#toolbox"));
  for (const tool of [...tools.build, ...tools.ops]) {
    const visible = toolbox.getAllByText(tool).filter((el) => !el.closest('[aria-hidden="true"]'));
    expect(visible, tool).toHaveLength(1);
  }
});

it("leaves everything visible with motion off", () => {
  const { container } = render(<App />);
  expect(container.querySelectorAll('[style*="opacity: 0"], [style*="visibility: hidden"]')).toHaveLength(0);
  expect(container.querySelectorAll('[style*="inset(100%"]')).toHaveLength(0);
  expect(container.textContent).not.toMatch(/coffee/i);
  expect(screen.getByRole("heading", { name: "Let's build something reliable." })).toBeInTheDocument();
});

it("keeps the work cards in a real list inside the tabpanel", () => {
  render(<App />);
  const panel = screen.getByRole("tabpanel");
  expect(panel).toHaveAttribute("tabindex", "0");
  const grid = within(panel).getAllByRole("list")[0];
  expect(grid.parentElement).toBe(panel);
  expect(grid.querySelectorAll(":scope > li")).toHaveLength(5);
});

it("moves tab focus and selection with the arrow keys (roving tabindex)", () => {
  render(<App />);
  const [ops, design] = screen.getAllByRole("tab");
  expect(ops).toHaveAttribute("tabindex", "0");
  expect(design).toHaveAttribute("tabindex", "-1");
  fireEvent.keyDown(ops, { key: "ArrowRight" });
  expect(design).toHaveAttribute("aria-selected", "true");
  expect(design).toHaveAttribute("tabindex", "0");
  expect(design).toHaveFocus();
  fireEvent.keyDown(design, { key: "Home" });
  expect(ops).toHaveAttribute("aria-selected", "true");
});

it("disables the contact submit button while sending", () => {
  const send = vi.spyOn(emailjs, "sendForm").mockReturnValue(new Promise(() => {}));
  render(<App />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "a@b.co" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "hi" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(send).toHaveBeenCalledWith("service_2uhn9y9", "template_ebuf4pd", expect.any(HTMLFormElement), "G-DHKLQCXzx8Z5wO6");
  expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Sending");
  send.mockRestore();
});

it("refreshes every scroll trigger when the work tab changes the page height", async () => {
  const refresh = vi.spyOn(ScrollTrigger, "refresh");
  render(<App />);
  await act(async () => {}); // let the smoother-ready flag flip and settle
  refresh.mockClear();
  fireEvent.click(screen.getByRole("tab", { name: "Mobile" }));
  expect(refresh).toHaveBeenCalled();
  refresh.mockRestore();
});
