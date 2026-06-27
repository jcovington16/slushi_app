import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllowedStreets, setAllowedStreets } from "@/lib/settings";
import { normalizeStreetName } from "@/lib/neighborhood";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ streets: await getAllowedStreets() });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const { streets } = (await request.json()) as { streets?: string[] };
    const clean = [...new Set((streets ?? []).map((street) => street.trim()).filter(Boolean))];

    await setAllowedStreets(clean);
    return NextResponse.json({
      streets: clean,
      normalized: clean.map(normalizeStreetName)
    });
  } catch {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
}
