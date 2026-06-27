import type { OrderStatus, PaymentStatus } from "./types";

export const orderStatuses: OrderStatus[] = [
  "NEW",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETE",
  "CANCELLED"
];

export function formatOrderStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statusTone(status: string) {
  switch (status) {
    case "NEW":
      return "bg-bubble/20 text-grape border-bubble/40";
    case "PREPARING":
      return "bg-purple-100 text-grape border-purple-200";
    case "READY":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "OUT_FOR_DELIVERY":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "COMPLETE":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "CANCELLED":
      return "bg-pink-100 text-pink-700 border-pink-200";
    default:
      return "bg-purple-50 text-grape border-purple-100";
  }
}

export function paymentTone(status: PaymentStatus | string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "FAILED":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "REFUNDED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-purple-50 text-grape border-purple-100";
  }
}

export function nextOperationalStatus(status: OrderStatus | string, deliveryMethod: string) {
  if (status === "NEW") return "PREPARING";
  if (status === "PREPARING") return "READY";
  if (status === "READY") return deliveryMethod === "DELIVERY" ? "OUT_FOR_DELIVERY" : "COMPLETE";
  if (status === "OUT_FOR_DELIVERY") return "COMPLETE";
  return null;
}

export function canCompleteOrder(input: { status: string; paymentStatus: string; containsAdultBooster?: boolean; idVerificationStatus?: string }) {
  if (input.paymentStatus !== "PAID") {
    return { ok: false as const, reason: "Collect or confirm payment before completing this order." };
  }

  if (input.containsAdultBooster && input.idVerificationStatus !== "VERIFIED") {
    return { ok: false as const, reason: "ID must be verified before completing this order." };
  }

  return { ok: true as const };
}
