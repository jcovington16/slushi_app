import { BrandHeader } from "@/components/BrandHeader";
import { OrderFlow } from "@/components/OrderFlow";
import { prisma } from "@/lib/prisma";
import { adultBoostersEnabled, visibleAddOns } from "@/lib/adult-boosters";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [flavors, addOns] = await Promise.all([
    prisma.flavor.findMany({ where: { isAvailable: true }, orderBy: { name: "asc" } }),
    prisma.addOn.findMany({ where: { isAvailable: true }, orderBy: { name: "asc" } })
  ]);

  const publicFlavors = flavors.map((flavor) => ({
    id: flavor.id,
    name: flavor.name,
    description: flavor.description,
    color: flavor.color,
    priceSmall: Number(flavor.priceSmall),
    priceMedium: Number(flavor.priceMedium),
    priceLarge: Number(flavor.priceLarge),
    isAvailable: flavor.isAvailable
  }));
  const publicAddOns = visibleAddOns(
    addOns.map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      price: Number(addOn.price),
      type: addOn.type,
      isAvailable: addOn.isAvailable,
      requiresAgeVerification: addOn.requiresAgeVerification
    }))
  );

  return (
    <main>
      <BrandHeader />
      <OrderFlow
        flavors={publicFlavors}
        addOns={publicAddOns}
        adultBoostersEnabled={adultBoostersEnabled()}
        venmoHandle={process.env.VENMO_HANDLE ?? "@SlushiSquad"}
        cashAppHandle={process.env.CASH_APP_HANDLE ?? "$SlushiSquad"}
      />
    </main>
  );
}
