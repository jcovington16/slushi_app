import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { addOnSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = addOnSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Add-on details are incomplete." }, { status: 400 });
    }

    const addOn = await prisma.addOn.create({ data: parsed.data });
    return NextResponse.json({ addOn });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { id?: string; isAvailable?: boolean; price?: number };
    if (!body.id) {
      return NextResponse.json({ error: "Add-on id is required." }, { status: 400 });
    }

    const addOn = await prisma.addOn.update({
      where: { id: body.id },
      data: {
        isAvailable: body.isAvailable,
        price: body.price
      }
    });

    return NextResponse.json({ addOn });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}
