import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  streetAddress: z.string().min(2).max(120),
  houseNumber: z.string().min(1).max(20),
  neighborhood: z.string().min(2).max(80).default("Slushi Squad Neighborhood"),
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
  paymentMethod: z.enum(["APPLE_PAY_CARD", "VENMO", "CASH_APP", "CASH"]),
  notes: z.string().max(500).optional().or(z.literal("")),
  ageConfirmed: z.boolean().optional(),
  items: z
    .array(
      z.object({
        flavorId: z.string().min(1),
        size: z.enum(["SMALL", "MEDIUM", "LARGE"]),
        quantity: z.number().int().min(1).max(12),
        addOnIds: z.array(z.string()).default([])
      })
    )
    .min(1)
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const flavorSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2).max(200),
  color: z.string().min(3).max(40),
  priceSmall: z.number().min(0),
  priceMedium: z.number().min(0),
  priceLarge: z.number().min(0),
  isAvailable: z.boolean()
});

export const addOnSchema = z.object({
  name: z.string().min(2).max(80),
  price: z.number().min(0),
  type: z.enum(["TOPPING", "EXTRA_SYRUP", "ADULT_BOOSTER"]),
  isAvailable: z.boolean(),
  requiresAgeVerification: z.boolean()
});
