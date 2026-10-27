import { render, screen, cleanup } from "@testing-library/react";
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
