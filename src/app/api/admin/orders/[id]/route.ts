import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { validateAdultBoosterCompliance } from "@/lib/adult-boosters";

const statuses = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETE", "CANCELLED"] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: (typeof statuses)[number];
      idVerificationStatus?: "NOT_REQUIRED" | "REQUIRED" | "PENDING" | "VERIFIED" | "REJECTED";
      adultAdminApproved?: boolean;
    };

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const nextStatus = body.status ?? order.status;
    if (!statuses.includes(nextStatus)) {
      return NextResponse.json({ error: "Unknown order status." }, { status: 400 });
    }

    const adultCheck = validateAdultBoosterCompliance({
      containsAdultBooster: order.containsAdultBooster,
      ageConfirmed: order.ageConfirmed,
      idVerificationStatus: body.idVerificationStatus ?? order.idVerificationStatus,
      adultAdminApproved: body.adultAdminApproved ?? order.adultAdminApproved,
      nextStatus: body.status
    });

    if (!adultCheck.ok) {
      return NextResponse.json({ error: adultCheck.message }, { status: 403 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: nextStatus,
        idVerificationStatus: body.idVerificationStatus,
        adultAdminApproved: body.adultAdminApproved
      }
    });

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}
