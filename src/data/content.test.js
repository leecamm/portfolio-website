import { describe, it, expect } from "vitest";
import * as content from "./content";

const { profile, journey, pipeline, caseStudies, workTabs, tools, navLinks } = content;

describe("content", () => {
  it("describes Harry today", () => {
    expect(profile.greeting).toBe("Xin chào! I'm Harry");
    expect(profile.roles).toEqual(["DevOps Engineer", "Designer", "Developer"]);
  });

  it("tells the journey in order", () => {
    expect(journey.map((s) => s.title)).toEqual([
      "ICT & Media Design",
      "Frontend Developer",
      "iOS Developer",
      "DevOps Engineer",
    ]);
  });

  it("runs the four pipeline stages", () => {
    expect(pipeline.map((s) => s.stage)).toEqual(["build", "test", "release", "deploy"]);
  });

  it("has the five ops case studies", () => {
    expect(caseStudies.map((c) => c.title)).toEqual([
      "Maintaining GitLab CI/CD",
      "Release & deployment",
      "Agentic AI work",
      "Front-end refactor",
      "Continuous improvements",
    ]);
  });

  it("gives every work item a title and description", () => {
    for (const item of workTabs.flatMap((t) => t.items)) {
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });

  it("has tools in two rows and nav links", () => {
    expect(tools.build.length).toBeGreaterThan(0);
    expect(tools.ops.length).toBeGreaterThan(0);
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it("contains no placeholder copy or invented metrics", () => {
    const text = JSON.stringify(content);
    expect(text).not.toMatch(/coffee|lorem/i);
    expect(text).not.toMatch(/\d+\s?%|\b\d+x\b/);
  });
});
