import { describe, it, expect } from "vitest";
import { classify } from "@/lib/server/classify";

describe("sensitivity classification", () => {
  it("flags a peanut allergy as health-sensitive", () => {
    const r = classify("I have a severe peanut allergy");
    expect(r.sensitive).toBe(true);
    expect(r.label).toBe("health");
  });

  it("flags dietary restrictions (vegan) as health", () => {
    expect(classify("I am vegan").sensitive).toBe(true);
  });

  it("flags credentials", () => {
    expect(classify("my password is hunter2").sensitive).toBe(true);
    expect(classify("here is my api key sk-123").label).toBe("credential");
  });

  it("flags financial info", () => {
    expect(classify("my bank account number is 12345").sensitive).toBe(true);
  });

  it("does NOT flag an ordinary location fact", () => {
    expect(classify("I am based in Lisbon").sensitive).toBe(false);
  });

  it("does NOT flag a benign preference", () => {
    expect(classify("I prefer morning meetings").sensitive).toBe(false);
  });
});
