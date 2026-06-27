"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { adultDisclaimer } from "@/lib/adult-boosters";
import { calculateTotals, formatMoney } from "@/lib/money";
import { getPaymentInstruction } from "@/lib/payment-copy";
import { neighborhoodOnlyMessage } from "@/lib/neighborhood";
import type { DeliveryMethod, PaymentMethod, PublicAddOn, PublicFlavor, Size } from "@/lib/types";

type Props = {
  flavors: PublicFlavor[];
  addOns: PublicAddOn[];
  adultBoostersEnabled: boolean;
  venmoHandle: string;
  cashAppHandle: string;
};

const steps = [
  "Welcome",
  "Flavor",
  "Size",
  "Extras",
  "Address",
  "Delivery",
  "Payment",
  "Review"
];

const sizes: { value: Size; label: string; helper: string }[] = [
  { value: "SMALL", label: "Small", helper: "Tiny but mighty" },
  { value: "MEDIUM", label: "Medium", helper: "Neighborhood favorite" },
  { value: "LARGE", label: "Large", helper: "Big chill energy" }
];

const payments: { value: PaymentMethod; label: string; helper: string }[] = [
  { value: "APPLE_PAY_CARD", label: "Apple Pay / Card", helper: "Secure Stripe checkout" },
  { value: "VENMO", label: "Venmo", helper: "Manual payment after ordering" },
  { value: "CASH_APP", label: "Cash App", helper: "Manual payment after ordering" },
  { value: "CASH", label: "Cash", helper: "Pay at pickup or delivery" }
];

export function OrderFlow({ flavors, addOns, adultBoostersEnabled, venmoHandle, cashAppHandle }: Props) {
  const [step, setStep] = useState(0);
  const [flavorId, setFlavorId] = useState(flavors[0]?.id ?? "");
  const [size, setSize] = useState<Size>("MEDIUM");
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("APPLE_PAY_CARD");
  const [notes, setNotes] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [savedOrderId, setSavedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flavor = flavors.find((item) => item.id === flavorId);
  const chosenAddOns = addOns.filter((addOn) => addOnIds.includes(addOn.id));
  const hasAdultBooster = chosenAddOns.some((addOn) => addOn.type === "ADULT_BOOSTER");
  const paymentInstruction = getPaymentInstruction(paymentMethod, { venmoHandle, cashAppHandle });
  const unitPrice = useMemo(() => {
    if (!flavor) return 0;
    const base =
      size === "SMALL" ? flavor.priceSmall : size === "MEDIUM" ? flavor.priceMedium : flavor.priceLarge;
    return base + chosenAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  }, [chosenAddOns, flavor, size]);
  const totals = calculateTotals(Math.round(unitPrice * 100) / 100);

  function validateCurrentStep(currentStep = step) {
    if (currentStep === 1 && !flavorId) {
      return "Pick a slushy flavor before we swirl ahead.";
    }

    if (currentStep === 4) {
      if (!customerName.trim()) return "Add a name so we know who gets the cup.";
      if (!phone.trim()) return "Add a phone number for order updates.";
      if (!streetAddress.trim() || !houseNumber.trim()) {
        return "Pop in your street and house number so we can check the neighborhood.";
      }
    }

    if (currentStep === 7 && hasAdultBooster && !ageConfirmed) {
      return "Adult add-ons require 21+ confirmation before checkout.";
    }

    return "";
  }

  function next() {
    const message = validateCurrentStep();
    setError(message);
    if (message) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitOrder() {
    const message = validateCurrentStep(7);
    setError(message);
    if (message) return;

    setSavedOrderId("");
    setIsSubmitting(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        phone,
        streetAddress,
        houseNumber,
        neighborhood: "Slushi Squad Neighborhood",
        deliveryMethod,
        paymentMethod,
        notes,
        ageConfirmed,
        items: [{ flavorId, size, quantity: 1, addOnIds }]
      })
    });

    const data = await response.json().catch(() => ({ error: "Order could not be submitted." }));
    if (!response.ok) {
      setError(data.error ?? neighborhoodOnlyMessage);
      setIsSubmitting(false);
      return;
    }

    if (paymentMethod === "APPLE_PAY_CARD") {
      const checkout = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId })
      });
      const checkoutData = await checkout.json().catch(() => ({ error: "Stripe checkout could not start." }));
      if (checkout.ok && checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }

      setSavedOrderId(data.orderId);
      setError(checkoutData.error ?? "Your order was saved, but card checkout could not start. Choose a manual payment or open the confirmation page.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = `/order/${data.orderId}`;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-12">
      <div className="mb-5 rounded-[2rem] bg-white/90 p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-black text-grape">Step {step + 1} of {steps.length}</span>
          <span className="text-sm font-bold text-ink/70">{steps[step]}</span>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`h-2 rounded-full ${index <= step ? "bg-berry" : "bg-purple-100"}`}
              aria-label={label}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-soft sm:p-7">
        {step === 0 && (
          <div className="space-y-5 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-bubble/20 text-berry">
              <Sparkles size={42} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-ink">Slushi Squad</h1>
              <p className="mt-2 text-lg font-bold text-grape">Cold cups. Big dreams. Made in the neighborhood.</p>
            </div>
            <p className="text-ink/75">
              Build your frosty cup, pick pickup or neighborhood delivery, and we’ll keep you posted.
            </p>
          </div>
        )}

        {step === 1 && (
          <ChoiceGrid>
            {flavors.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFlavorId(item.id)}
                className={`focus-ring rounded-3xl border-2 p-4 text-left ${
                  flavorId === item.id ? "border-berry bg-berry/10" : "border-purple-100 bg-white"
                }`}
              >
                <span className="mb-3 block h-10 w-10 rounded-full" style={{ background: item.color }} />
                <span className="block text-lg font-black">{item.name}</span>
                <span className="block text-sm text-ink/65">{item.description}</span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {step === 2 && (
          <ChoiceGrid>
            {sizes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSize(item.value)}
                className={`focus-ring rounded-3xl border-2 p-5 text-left ${
                  size === item.value ? "border-bubble bg-bubble/10" : "border-purple-100 bg-white"
                }`}
              >
                <span className="block text-xl font-black">{item.label}</span>
                <span className="block text-sm text-ink/65">{item.helper}</span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {adultBoostersEnabled && <p className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{adultDisclaimer}</p>}
            <ChoiceGrid>
              {addOns.map((addOn) => (
                <button
                  key={addOn.id}
                  type="button"
                  onClick={() =>
                    setAddOnIds((current) =>
                      current.includes(addOn.id) ? current.filter((id) => id !== addOn.id) : [...current, addOn.id]
                    )
                  }
                  className={`focus-ring rounded-3xl border-2 p-4 text-left ${
                    addOnIds.includes(addOn.id) ? "border-grape bg-grape/10" : "border-purple-100 bg-white"
                  }`}
                >
                  <span className="block text-lg font-black">{addOn.name}</span>
                  <span className="block text-sm text-ink/65">{formatMoney(addOn.price)}</span>
                </button>
              ))}
            </ChoiceGrid>
            {hasAdultBooster && (
              <label className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} />
                I confirm I am 21+ and understand valid ID verification and adult admin approval are required.
              </label>
            )}
          </div>
        )}

        {step === 4 && (
          <FormGrid>
            <Input label="Your name" value={customerName} onChange={setCustomerName} />
            <Input label="Phone number" value={phone} onChange={setPhone} type="tel" />
            <Input label="Street name" value={streetAddress} onChange={setStreetAddress} placeholder="Main St" />
            <Input label="House number" value={houseNumber} onChange={setHouseNumber} placeholder="123" />
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-black text-grape">Order notes</span>
              <textarea
                className="focus-ring min-h-24 w-full rounded-2xl border-2 border-purple-100 px-4 py-3"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Gate code, porch cooler, extra smiles..."
              />
            </label>
          </FormGrid>
        )}

        {step === 5 && (
          <ChoiceGrid>
            {(["DELIVERY", "PICKUP"] as DeliveryMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setDeliveryMethod(method)}
                className={`focus-ring rounded-3xl border-2 p-5 text-left ${
                  deliveryMethod === method ? "border-berry bg-berry/10" : "border-purple-100 bg-white"
                }`}
              >
                <span className="block text-xl font-black">{method === "DELIVERY" ? "Neighborhood delivery" : "Pickup"}</span>
                <span className="block text-sm text-ink/65">
                  {method === "DELIVERY" ? "Only on approved nearby streets" : "Swing by when it’s ready"}
                </span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {step === 6 && (
          <ChoiceGrid>
            {payments.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPaymentMethod(item.value)}
                className={`focus-ring rounded-3xl border-2 p-5 text-left ${
                  paymentMethod === item.value ? "border-bubble bg-bubble/10" : "border-purple-100 bg-white"
                }`}
              >
                <span className="block text-lg font-black">{item.label}</span>
                <span className="block text-sm text-ink/65">{item.helper}</span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black">Review your cup</h2>
            <SummaryRow label="Flavor" value={flavor?.name ?? "Pick a flavor"} />
            <SummaryRow label="Size" value={size.toLowerCase()} />
            <SummaryRow label="Extras" value={chosenAddOns.map((addOn) => addOn.name).join(", ") || "None"} />
            <SummaryRow label="Address" value={`${houseNumber} ${streetAddress}`} />
            <SummaryRow label="How" value={deliveryMethod === "DELIVERY" ? "Neighborhood delivery" : "Pickup"} />
            <SummaryRow label="Payment" value={payments.find((item) => item.value === paymentMethod)?.label ?? ""} />
            <div className="rounded-3xl bg-purple-50 p-4">
              <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
              <SummaryRow label="Tax" value={formatMoney(totals.tax)} />
              <SummaryRow label="Estimated total" value={formatMoney(totals.total)} />
            </div>
            <div className="rounded-2xl bg-bubble/10 p-3 text-sm font-bold text-grape">
              <p className="font-black text-ink">{paymentInstruction.title}</p>
              <p>{paymentInstruction.message}</p>
              <p>{paymentInstruction.nextStep}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-pink-50 p-3 text-sm font-bold text-pink-700">
            <p>{error}</p>
            {savedOrderId && (
              <a className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-grape" href={`/order/${savedOrderId}`}>
                Open saved order
              </a>
            )}
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-3 font-black text-grape disabled:opacity-40"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-berry px-5 py-3 font-black text-white shadow-soft"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitOrder}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-grape px-5 py-3 font-black text-white shadow-soft disabled:opacity-60"
            >
              <Check size={18} />
              Submit
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-grape">{label}</span>
      <input
        className="focus-ring w-full rounded-2xl border-2 border-purple-100 px-4 py-3"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-purple-100 py-2 last:border-b-0">
      <span className="font-black text-grape">{label}</span>
      <span className="text-right font-bold capitalize text-ink">{value}</span>
    </div>
  );
}
