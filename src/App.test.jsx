import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import App from "./App";

it("renders the current hero greeting", () => {
  render(<App />);
  expect(screen.getByText("Xin Chào! I'm Harry")).toBeInTheDocument();
});
