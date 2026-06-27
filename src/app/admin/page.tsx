import { BrandHeader } from "@/components/BrandHeader";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getAllowedStreets } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    return (
      <main>
        <BrandHeader />
        <AdminLogin />
      </main>
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [orders, flavors, addOns, allowedStreets] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { flavor: true } } }
    }),
    prisma.flavor.findMany({ orderBy: { name: "asc" } }),
    prisma.addOn.findMany({ orderBy: { name: "asc" } }),
    getAllowedStreets()
  ]);

  const dailySales = orders
    .filter((order) => order.createdAt >= startOfDay && order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const flavorCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      flavorCounts.set(item.flavor.name, (flavorCounts.get(item.flavor.name) ?? 0) + item.quantity);
    }
  }

  const popularFlavors = [...flavorCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <main>
      <BrandHeader />
      <AdminDashboard
        orders={orders.map((order) => ({
          id: order.id,
          customerName: order.customerName,
          phone: order.phone,
          streetAddress: order.streetAddress,
          houseNumber: order.houseNumber,
          deliveryMethod: order.deliveryMethod,
          notes: order.notes,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          total: Number(order.total),
          containsAdultBooster: order.containsAdultBooster,
          idVerificationStatus: order.idVerificationStatus,
          adultAdminApproved: order.adultAdminApproved,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            flavor: { name: item.flavor.name },
            size: item.size,
            quantity: item.quantity
          }))
        }))}
        flavors={flavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          priceSmall: Number(flavor.priceSmall),
          priceMedium: Number(flavor.priceMedium),
          priceLarge: Number(flavor.priceLarge),
          isAvailable: flavor.isAvailable
        }))}
        addOns={addOns.map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          price: Number(addOn.price),
          type: addOn.type,
          isAvailable: addOn.isAvailable
        }))}
        allowedStreets={allowedStreets}
        dailySales={dailySales}
        popularFlavors={popularFlavors}
        unpaidCount={orders.filter((order) => order.paymentStatus === "PENDING").length}
      />
    </main>
  );
}
