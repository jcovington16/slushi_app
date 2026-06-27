export type Size = "SMALL" | "MEDIUM" | "LARGE";
export type DeliveryMethod = "PICKUP" | "DELIVERY";
export type OrderStatus =
  | "NEW"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETE"
  | "CANCELLED";
export type PaymentMethod = "APPLE_PAY_CARD" | "VENMO" | "CASH_APP" | "CASH";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type AddOnType = "TOPPING" | "EXTRA_SYRUP" | "ADULT_BOOSTER";

export type PublicFlavor = {
  id: string;
  name: string;
  description: string;
  color: string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
  isAvailable: boolean;
};

export type PublicAddOn = {
  id: string;
  name: string;
  price: number;
  type: AddOnType;
  isAvailable: boolean;
  requiresAgeVerification: boolean;
};

export type OrderItemInput = {
  flavorId: string;
  size: Size;
  quantity: number;
  addOnIds: string[];
};

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  streetAddress: string;
  houseNumber: string;
  neighborhood: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: OrderItemInput[];
  ageConfirmed?: boolean;
};
