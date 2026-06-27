import { describe, expect, it } from "vitest";
import { getPaymentInstruction } from "../src/lib/payment-copy";

describe("payment instructions", () => {
  const handles = { venmoHandle: "@SlushiSquad", cashAppHandle: "$SlushiSquad" };

  it("keeps Venmo manual payments pending for admin review", () => {
    const copy = getPaymentInstruction("VENMO", handles);
    expect(copy.message).toContain("@SlushiSquad");
    expect(copy.nextStep).toContain("pending");
    expect(copy.nextStep).toContain("admin confirms");
  });

  it("keeps cash payments pending until collected", () => {
    const copy = getPaymentInstruction("CASH", handles);
    expect(copy.nextStep).toContain("marks it paid");
  });
});
