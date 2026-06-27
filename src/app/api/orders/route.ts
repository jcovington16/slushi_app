import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation";
import { getAllowedStreets } from "@/lib/settings";
import { isAllowedStreet, neighborhoodOnlyMessage, normalizeStreetName } from "@/lib/neighborhood";
import { calculateTotals } from "@/lib/money";
import { validateAdultBoosterCompliance } from "@/lib/adult-boosters";
import { rateLimit } from "@/lib/rate-limit";

const sizePriceKey = {
  SMALL: "priceSmall",
  MEDIUM: "priceMedium",
  LARGE: "priceLarge"
} as const;

export async function POST(request: NextRequest) {
  const limited = rateLimit(`orders:${request.headers.get("x-forwarded-for") ?? "local"}`, 12);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many orders too quickly. Please try again in a minute." }, { status: 429 });
  }

  const parsed = createOrderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the order form and try again." }, { status: 400 });
  }

  const input = parsed.data;

  if (!input.streetAddress || !input.houseNumber) {
    return NextResponse.json({ error: "Please enter both your street address and house number." }, { status: 400 });
  }

  const allowedStreets = await getAllowedStreets();
  if (!isAllowedStreet(input.streetAddress, allowedStreets)) {
    return NextResponse.json({ error: neighborhoodOnlyMessage }, { status: 403 });
  }

  const flavors = await prisma.flavor.findMany({
    where: { id: { in: input.items.map((item) => item.flavorId) }, isAvailable: true }
  });
  const addOns = await prisma.addOn.findMany({
    where: { id: { in: input.items.flatMap((item) => item.addOnIds) }, isAvailable: true }
  });

  const flavorMap = new Map(flavors.map((flavor) => [flavor.id, flavor]));
  const addOnMap = new Map(addOns.map((addOn) => [addOn.id, addOn]));
  const containsAdultBooster = addOns.some((addOn) => addOn.type === "ADULT_BOOSTER");
  const adultCheck = validateAdultBoosterCompliance({
    containsAdultBooster,
    ageConfirmed: input.ageConfirmed
  });

  if (!adultCheck.ok) {
    return NextResponse.json({ error: adultCheck.message }, { status: 403 });
  }

  try {
    let subtotal = 0;
    const itemCreates = input.items.map((item) => {
      const flavor = flavorMap.get(item.flavorId);
      if (!flavor) {
        throw new Error("Selected flavor is unavailable. Please pick another flavor.");
      }

      const selectedAddOns = item.addOnIds.map((id) => {
        const addOn = addOnMap.get(id);
        if (!addOn) {
          throw new Error("Selected add-on is unavailable. Please update your extras.");
        }
        return addOn;
      });

      const unitPrice =
        Number(flavor[sizePriceKey[item.size]]) +
        selectedAddOns.reduce((sum, addOn) => sum + Number(addOn.price), 0);

      subtotal += unitPrice * item.quantity;

      return {
        flavorId: item.flavorId,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
        addOns: { connect: selectedAddOns.map((addOn) => ({ id: addOn.id })) }
      };
    });

    const totals = calculateTotals(Math.round(subtotal * 100) / 100);
    const paymentStatus = "PENDING";
    const idVerificationStatus = containsAdultBooster ? "PENDING" : "NOT_REQUIRED";
    const order = await prisma.order.create({
      data: {
        customerName: input.customerName,
        phone: input.phone,
        streetAddress: input.streetAddress,
        houseNumber: input.houseNumber,
        neighborhood: input.neighborhood,
        deliveryMethod: input.deliveryMethod,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        notes: input.notes || null,
        containsAdultBooster,
        ageConfirmed: Boolean(input.ageConfirmed),
        idVerificationStatus,
        customer: {
          create: {
            name: input.customerName,
            phone: input.phone
          }
        },
        address: {
          create: {
            streetAddress: input.streetAddress,
            normalizedStreet: normalizeStreetName(input.streetAddress),
            houseNumber: input.houseNumber,
            neighborhood: input.neighborhood
          }
        },
        items: { create: itemCreates },
        payment: {
          create: {
            method: input.paymentMethod,
            status: paymentStatus,
            amount: totals.total
          }
        }
      },
      include: { payment: true }
    });

    return NextResponse.json({ orderId: order.id, paymentMethod: order.paymentMethod });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order could not be created." },
      { status: 400 }
    );
  }
}
