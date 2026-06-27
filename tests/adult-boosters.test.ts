import { describe, expect, it } from "vitest";
import { validateAdultBoosterCompliance } from "../src/lib/adult-boosters";

describe("adult booster compliance gate", () => {
  it("blocks adult booster orders when the feature is disabled", () => {
    expect(validateAdultBoosterCompliance({ containsAdultBooster: true, ageConfirmed: true }).ok).toBe(false);
  });

  it("allows normal orders", () => {
    expect(validateAdultBoosterCompliance({ containsAdultBooster: false }).ok).toBe(true);
  });
});
