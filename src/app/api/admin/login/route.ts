import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { setAdminSession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const parsed = adminLoginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid admin email and password." }, { status: 400 });
  }

  const limited = rateLimit(`login:${parsed.data.email}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many login attempts. Please wait a minute." }, { status: 429 });
  }

  if (parsed.data.email !== (process.env.ADMIN_EMAIL ?? "admin@slushisquad.local") || !verifyPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Invalid admin login." }, { status: 401 });
  }

  await setAdminSession(parsed.data.email);
  return NextResponse.json({ ok: true });
}
