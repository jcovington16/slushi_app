CREATE TYPE "Role" AS ENUM ('ADMIN');
CREATE TYPE "Size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('APPLE_PAY_CARD', 'VENMO', 'CASH_APP', 'CASH');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "AddOnType" AS ENUM ('TOPPING', 'EXTRA_SYRUP', 'ADULT_BOOSTER');
CREATE TYPE "IdVerificationStatus" AS ENUM ('NOT_REQUIRED', 'REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Address" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "streetAddress" TEXT NOT NULL,
  "normalizedStreet" TEXT NOT NULL,
  "houseNumber" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Flavor" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "priceSmall" DECIMAL(10,2) NOT NULL,
  "priceMedium" DECIMAL(10,2) NOT NULL,
  "priceLarge" DECIMAL(10,2) NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Flavor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AddOn" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "type" "AddOnType" NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "requiresAgeVerification" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "addressId" TEXT,
  "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "streetAddress" TEXT NOT NULL,
  "houseNumber" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "deliveryMethod" "DeliveryMethod" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "containsAdultBooster" BOOLEAN NOT NULL DEFAULT false,
  "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "idVerificationStatus" "IdVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  "adultAdminApproved" BOOLEAN NOT NULL DEFAULT false,
  "stripeSessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "flavorId" TEXT NOT NULL,
  "size" "Size" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,2) NOT NULL,
  "stripeSessionId" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_OrderItemAddOns" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Address_normalizedStreet_idx" ON "Address"("normalizedStreet");
CREATE UNIQUE INDEX "Flavor_name_key" ON "Flavor"("name");
CREATE UNIQUE INDEX "AddOn_name_key" ON "AddOn"("name");
CREATE INDEX "AddOn_type_idx" ON "AddOn"("type");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");
CREATE UNIQUE INDEX "_OrderItemAddOns_AB_unique" ON "_OrderItemAddOns"("A", "B");
CREATE INDEX "_OrderItemAddOns_B_index" ON "_OrderItemAddOns"("B");

ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_flavorId_fkey" FOREIGN KEY ("flavorId") REFERENCES "Flavor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_OrderItemAddOns" ADD CONSTRAINT "_OrderItemAddOns_A_fkey" FOREIGN KEY ("A") REFERENCES "AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_OrderItemAddOns" ADD CONSTRAINT "_OrderItemAddOns_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
