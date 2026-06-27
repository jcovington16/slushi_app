import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.paymentMethod === "APPLE_PAY_CARD") {
      return NextResponse.json({ error: "Card payments should be reconciled through Stripe." }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: "PAID",
        payment: {
          update: {
            status: "PAID",
            paidAt: new Date()
          }
        }
      }
    });

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}
