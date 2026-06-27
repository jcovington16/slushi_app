import { describe, expect, it } from "vitest";
import { isAllowedStreet, normalizeStreetName } from "../src/lib/neighborhood";

describe("neighborhood street validation", () => {
  it("normalizes common street suffixes and casing", () => {
    expect(normalizeStreetName("Main St")).toBe("main street");
    expect(normalizeStreetName("main street")).toBe("main street");
    expect(normalizeStreetName("MAIN STREET.")).toBe("main street");
  });

  it("allows normalized street matches", () => {
    expect(isAllowedStreet("Main St", ["Main Street"])).toBe(true);
    expect(isAllowedStreet("oak ln", ["Oak Lane"])).toBe(true);
  });

  it("blocks streets outside the configured neighborhood", () => {
    expect(isAllowedStreet("Faraway Avenue", ["Main Street", "Oak Lane"])).toBe(false);
  });
});
