import type { PublicAddOn } from "./types";

export const adultDisclaimer =
  "Adult add-ons are only available where legally permitted and require valid ID verification.";

export function adultBoostersEnabled() {
  return process.env.ENABLE_ADULT_BOOSTERS === "true";
}

export function visibleAddOns(addOns: PublicAddOn[]) {
  if (adultBoostersEnabled()) {
    return addOns;
  }

  return addOns.filter((addOn) => addOn.type !== "ADULT_BOOSTER");
}

export function validateAdultBoosterCompliance(input: {
  containsAdultBooster: boolean;
  ageConfirmed?: boolean;
  idVerificationStatus?: string;
  adultAdminApproved?: boolean;
  nextStatus?: string;
}) {
  if (!input.containsAdultBooster) {
    return { ok: true as const };
  }

  if (!adultBoostersEnabled()) {
    return {
      ok: false as const,
      message: "Adult booster add-ons are currently disabled."
    };
  }

  if (!input.ageConfirmed) {
    return {
      ok: false as const,
      message: "Adult booster orders require a 21+ age confirmation."
    };
  }

  if (input.nextStatus === "COMPLETE" && input.idVerificationStatus !== "VERIFIED") {
    return {
      ok: false as const,
      message: "ID verification must be complete before this order can be completed."
    };
  }

  if (!input.adultAdminApproved && input.nextStatus && input.nextStatus !== "CANCELLED") {
    return {
      ok: false as const,
      message: "An adult admin must manually approve this adult booster order first."
    };
  }

  return { ok: true as const };
}
