import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const flavors = [
  {
    name: "Blue Raspberry",
    description: "Bright blue, berry-sweet, and super refreshing.",
    color: "#30b7ff",
    priceSmall: 3,
    priceMedium: 4,
    priceLarge: 5
  },
  {
    name: "Strawberry Lemonade",
    description: "Pink lemonade sparkle with strawberry sunshine.",
    color: "#ff6aa5",
    priceSmall: 3,
    priceMedium: 4,
    priceLarge: 5
  },
  {
    name: "Cotton Candy",
    description: "A carnival cup with fluffy blue-and-pink vibes.",
    color: "#b377ff",
    priceSmall: 3.25,
    priceMedium: 4.25,
    priceLarge: 5.25
  },
  {
    name: "Cherry Blast",
    description: "Bold cherry flavor with a ruby-red pop.",
    color: "#ff3366",
    priceSmall: 3,
    priceMedium: 4,
    priceLarge: 5
  },
  {
    name: "Mango Wave",
    description: "Tropical mango, smooth and sunny.",
    color: "#ffb938",
    priceSmall: 3.25,
    priceMedium: 4.25,
    priceLarge: 5.25
  },
  {
    name: "Watermelon Chill",
    description: "Cool watermelon sweetness for hot sidewalk days.",
    color: "#36d39a",
    priceSmall: 3,
    priceMedium: 4,
    priceLarge: 5
  },
  {
    name: "Purple Grape Pop",
    description: "Grape goodness with a playful purple swirl.",
    color: "#8758ff",
    priceSmall: 3,
    priceMedium: 4,
    priceLarge: 5
  }
];

const addOns = [
  { name: "Rainbow Sprinkles", price: 0.5, type: "TOPPING" as const },
  { name: "Sour Gummies", price: 0.75, type: "TOPPING" as const },
  { name: "Whipped Cream Cloud", price: 0.75, type: "TOPPING" as const },
  { name: "Extra Blue Syrup", price: 0.5, type: "EXTRA_SYRUP" as const },
  { name: "Extra Pink Syrup", price: 0.5, type: "EXTRA_SYRUP" as const },
  {
    name: "Adult Booster Placeholder",
    price: 4,
    type: "ADULT_BOOSTER" as const,
    requiresAgeVerification: true,
    isAvailable: false
  }
];

async function main() {
  for (const flavor of flavors) {
    await prisma.flavor.upsert({
      where: { name: flavor.name },
      create: { ...flavor, isAvailable: true },
      update: flavor
    });
  }

  for (const addOn of addOns) {
    await prisma.addOn.upsert({
      where: { name: addOn.name },
      create: {
        isAvailable: true,
        requiresAgeVerification: false,
        ...addOn
      },
      update: addOn
    });
  }

  await prisma.adminSetting.upsert({
    where: { key: "ALLOWED_STREETS" },
    create: {
      key: "ALLOWED_STREETS",
      value: ["Main Street", "Oak Lane", "Maple Drive", "Sunset Court"]
    },
    update: {}
  });

  await prisma.adminSetting.upsert({
    where: { key: "ENABLE_ADULT_BOOSTERS" },
    create: {
      key: "ENABLE_ADULT_BOOSTERS",
      value: false
    },
    update: { value: false }
  });

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@slushisquad.local" },
    create: {
      email: process.env.ADMIN_EMAIL ?? "admin@slushisquad.local",
      passwordHash: createHash("sha256")
        .update(process.env.ADMIN_PASSWORD ?? "change-me")
        .digest("hex")
    },
    update: {}
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
