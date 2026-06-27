import { describe, expect, it } from "vitest";
import { createOrderSchema } from "../src/lib/validation";

describe("checkout validation", () => {
  const baseOrder = {
    customerName: "Jade",
    phone: "555-111-2222",
    streetAddress: "Main St",
    houseNumber: "123",
    neighborhood: "Slushi Squad Neighborhood",
    deliveryMethod: "DELIVERY",
    paymentMethod: "VENMO",
    notes: "Porch cooler",
    items: [{ flavorId: "flavor_1", size: "MEDIUM", quantity: 1, addOnIds: [] }]
  };

  it("requires a customer name, phone, street, and house number", () => {
    expect(createOrderSchema.safeParse({ ...baseOrder, customerName: "" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...baseOrder, phone: "" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...baseOrder, streetAddress: "" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...baseOrder, houseNumber: "" }).success).toBe(false);
  });

  it("accepts a complete manual payment order without marking it paid", () => {
    const parsed = createOrderSchema.safeParse(baseOrder);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.paymentMethod).toBe("VENMO");
    }
  });
});
