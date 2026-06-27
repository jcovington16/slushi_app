import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const reset = process.argv.includes("--reset");
const demoTag = "[DEMO]";

const demoOrders = [
  {
    customerName: "Avery Demo",
    phone: "555-0101",
    streetAddress: "Main St",
    houseNumber: "101",
    deliveryMethod: "DELIVERY" as const,
    paymentMethod: "VENMO" as const,
    paymentStatus: "PENDING" as const,
    status: "NEW" as const,
    flavorName: "Blue Raspberry",
    size: "MEDIUM" as const,
    notes: "First demo order. Practice marking payment paid, then preparing."
  },
  {
    customerName: "Mia Demo",
    phone: "555-0102",
    streetAddress: "Oak Lane",
    houseNumber: "22",
    deliveryMethod: "PICKUP" as const,
    paymentMethod: "CASH" as const,
    paymentStatus: "PAID" as const,
    status: "READY" as const,
    flavorName: "Strawberry Lemonade",
    size: "LARGE" as const,
    notes: "Pickup demo order. Practice marking complete."
  },
  {
    customerName: "Jordan Demo",
    phone: "555-0103",
    streetAddress: "Maple Drive",
    houseNumber: "8",
    deliveryMethod: "DELIVERY" as const,
    paymentMethod: "CASH_APP" as const,
    paymentStatus: "PAID" as const,
    status: "OUT_FOR_DELIVERY" as const,
    flavorName: "Cotton Candy",
    size: "SMALL" as const,
    notes: "Delivery demo order. Practice completing delivery."
  },
  {
    customerName: "Sam Demo",
    phone: "555-0104",
    streetAddress: "Sunset Court",
    houseNumber: "44",
    deliveryMethod: "DELIVERY" as const,
    paymentMethod: "VENMO" as const,
    paymentStatus: "PENDING" as const,
    status: "PREPARING" as const,
    flavorName: "Mango Wave",
    size: "MEDIUM" as const,
    notes: "Payment pending demo. Practice not completing until paid."
  }
];

const sizePriceKey = {
  SMALL: "priceSmall",
  MEDIUM: "priceMedium",
  LARGE: "priceLarge"
} as const;

function totals(subtotal: number) {
  const tax = Math.round(subtotal * 0.0825 * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

async function deleteDemoOrders() {
  const orders = await prisma.order.findMany({ where: { notes: { startsWith: demoTag } }, select: { id: true } });
  await prisma.order.deleteMany({ where: { id: { in: orders.map((order) => order.id) } } });
  return orders.length;
}

async function main() {
  if (reset) {
    const deleted = await deleteDemoOrders();
    console.log(`Deleted ${deleted} demo orders.`);
    return;
  }

  await deleteDemoOrders();

  const sprinkle = await prisma.addOn.findFirst({ where: { name: "Rainbow Sprinkles" } });

  for (const demo of demoOrders) {
    const flavor = await prisma.flavor.findUniqueOrThrow({ where: { name: demo.flavorName } });
    const addOns = sprinkle && demo.customerName === "Avery Demo" ? [sprinkle] : [];
    const unitPrice = Number(flavor[sizePriceKey[demo.size]]) + addOns.reduce((sum, addOn) => sum + Number(addOn.price), 0);
    const orderTotals = totals(unitPrice);

    await prisma.order.create({
      data: {
        customerName: demo.customerName,
        phone: demo.phone,
        streetAddress: demo.streetAddress,
        houseNumber: demo.houseNumber,
        neighborhood: "Slushi Squad Neighborhood",
        deliveryMethod: demo.deliveryMethod,
        status: demo.status,
        subtotal: orderTotals.subtotal,
        tax: orderTotals.tax,
        total: orderTotals.total,
        paymentMethod: demo.paymentMethod,
        paymentStatus: demo.paymentStatus,
        notes: `${demoTag} ${demo.notes}`,
        customer: { create: { name: demo.customerName, phone: demo.phone } },
        address: {
          create: {
            streetAddress: demo.streetAddress,
            normalizedStreet: demo.streetAddress.toLowerCase().replace(" st", " street"),
            houseNumber: demo.houseNumber,
            neighborhood: "Slushi Squad Neighborhood"
          }
        },
        items: {
          create: {
            flavorId: flavor.id,
            size: demo.size,
            quantity: 1,
            unitPrice,
            addOns: { connect: addOns.map((addOn) => ({ id: addOn.id })) }
          }
        },
        payment: {
          create: {
            method: demo.paymentMethod,
            status: demo.paymentStatus,
            amount: orderTotals.total,
            paidAt: demo.paymentStatus === "PAID" ? new Date() : null
          }
        }
      }
    });
  }

  console.log(`Seeded ${demoOrders.length} demo orders.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
