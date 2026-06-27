import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";

export async function POST(request: NextRequest) {
  const { orderId } = (await request.json()) as { orderId?: string };
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.containsAdultBooster) {
    return NextResponse.json(
      { error: "Adult booster payments require compliance confirmation before processing." },
      { status: 403 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: toCents(Number(order.total)),
          product_data: { name: `Slushi Squad order ${order.id}` }
        }
      }
    ],
    success_url: `${appUrl}/order/${order.id}?paid=card`,
    cancel_url: `${appUrl}/order/${order.id}?payment=cancelled`,
    metadata: { orderId: order.id }
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeSessionId: session.id,
      payment: { update: { stripeSessionId: session.id } }
    }
  });

  return NextResponse.json({ url: session.url });
}
