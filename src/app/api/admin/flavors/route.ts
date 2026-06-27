import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { flavorSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = flavorSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Flavor details are incomplete." }, { status: 400 });
    }

    const flavor = await prisma.flavor.create({ data: parsed.data });
    return NextResponse.json({ flavor });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { id?: string; isAvailable?: boolean; prices?: Record<string, number> };
    if (!body.id) {
      return NextResponse.json({ error: "Flavor id is required." }, { status: 400 });
    }

    const flavor = await prisma.flavor.update({
      where: { id: body.id },
      data: {
        isAvailable: body.isAvailable,
        priceSmall: body.prices?.priceSmall,
        priceMedium: body.prices?.priceMedium,
        priceLarge: body.prices?.priceLarge
      }
    });

    return NextResponse.json({ flavor });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}
