import type { PaymentMethod } from "./types";

export type PaymentInstruction = {
  title: string;
  message: string;
  nextStep: string;
};

export function getPaymentInstruction(
  paymentMethod: PaymentMethod,
  handles: { venmoHandle: string; cashAppHandle: string }
): PaymentInstruction {
  switch (paymentMethod) {
    case "VENMO":
      return {
        title: "Venmo payment needed",
        message: `Send your order total to ${handles.venmoHandle}.`,
        nextStep: "Your order is saved as pending until an admin confirms the Venmo payment."
      };
    case "CASH_APP":
      return {
        title: "Cash App payment needed",
        message: `Send your order total to ${handles.cashAppHandle}.`,
        nextStep: "Your order is saved as pending until an admin confirms the Cash App payment."
      };
    case "CASH":
      return {
        title: "Cash payment selected",
        message: "Have cash ready at pickup or delivery.",
        nextStep: "Your order is saved as pending until an admin collects and marks it paid."
      };
    case "APPLE_PAY_CARD":
      return {
        title: "Secure card checkout",
        message: "Apple Pay and card payments are handled by Stripe.",
        nextStep: "Your order is paid only after Stripe confirms checkout."
      };
  }
}
