import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getPaymentInstruction } from "@/lib/payment-copy";
import type { PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderConfirmation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { flavor: true, addOns: true } }
    }
  });

  if (!order) {
    return (
      <main>
        <BrandHeader />
        <section className="mx-auto max-w-xl px-4 py-10">
          <div className="rounded-[2rem] bg-white p-6 text-center shadow-soft">
            <h1 className="text-2xl font-black">Order not found</h1>
            <Link className="mt-4 inline-block rounded-full bg-berry px-5 py-3 font-black text-white" href="/">
              Start a new order
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const paymentInstruction = getPaymentInstruction(order.paymentMethod as PaymentMethod, {
    venmoHandle: process.env.VENMO_HANDLE ?? "@SlushiSquad",
    cashAppHandle: process.env.CASH_APP_HANDLE ?? "$SlushiSquad"
  });

  return (
    <main>
      <BrandHeader />
      <section className="mx-auto max-w-2xl px-4 pb-12">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <p className="text-sm font-black uppercase tracking-wider text-berry">Order confirmed</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Cup #{order.id.slice(-6).toUpperCase()}</h1>
          <p className="mt-2 text-lg font-bold text-grape">Status: {order.status.replaceAll("_", " ").toLowerCase()}</p>

          <div className="mt-6 grid gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-3xl bg-purple-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-black">{item.flavor.name}</span>
                  <span className="font-bold">{item.size.toLowerCase()}</span>
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {item.addOns.map((addOn) => addOn.name).join(", ") || "No extras"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-bubble/10 p-4">
            <p className="font-black">{paymentInstruction.title}</p>
            <p className="font-bold text-ink/75">Payment status: {order.paymentStatus.toLowerCase()}</p>
            <p className="mt-2 text-sm font-bold text-grape">{paymentInstruction.message}</p>
            <p className="mt-1 text-sm font-bold text-ink/70">{paymentInstruction.nextStep}</p>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-3xl bg-berry/10 p-4">
            <span className="font-black">Total</span>
            <span className="text-xl font-black">{formatMoney(Number(order.total))}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
