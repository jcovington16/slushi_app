import { describe, expect, it } from "vitest";
import { canCompleteOrder, formatOrderStatus, nextOperationalStatus } from "../src/lib/order-status";

describe("admin order status helpers", () => {
  it("formats readable order status labels", () => {
    expect(formatOrderStatus("OUT_FOR_DELIVERY")).toBe("Out For Delivery");
  });

  it("moves delivery orders through the correct next steps", () => {
    expect(nextOperationalStatus("NEW", "DELIVERY")).toBe("PREPARING");
    expect(nextOperationalStatus("PREPARING", "DELIVERY")).toBe("READY");
    expect(nextOperationalStatus("READY", "DELIVERY")).toBe("OUT_FOR_DELIVERY");
    expect(nextOperationalStatus("OUT_FOR_DELIVERY", "DELIVERY")).toBe("COMPLETE");
  });

  it("moves pickup orders from ready directly to complete", () => {
    expect(nextOperationalStatus("READY", "PICKUP")).toBe("COMPLETE");
  });

  it("does not allow completion before payment is confirmed", () => {
    const result = canCompleteOrder({ status: "READY", paymentStatus: "PENDING" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("payment");
  });

  it("allows completion when payment is paid", () => {
    expect(canCompleteOrder({ status: "READY", paymentStatus: "PAID" }).ok).toBe(true);
  });
});
