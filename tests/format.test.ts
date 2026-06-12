import { describe, it, expect } from "vitest";
import { short, shortBlob } from "@/lib/format";

describe("formatting helpers", () => {
  it("shortens a Sui address with an ellipsis and keeps head + tail", () => {
    const out = short("0x0984fb5dc447068bb3184b67f835cb32cd6c13f6", 6);
    expect(out).toBe("0x0984…13f6");
    expect(out).toContain("…");
  });

  it("returns empty string for empty input", () => {
    expect(short("")).toBe("");
    expect(shortBlob("")).toBe("");
  });

  it("truncates a blob id", () => {
    expect(shortBlob("wvFXsUo0wtTFYLgYyU", 8)).toBe("wvFXsUo0…");
  });
});
