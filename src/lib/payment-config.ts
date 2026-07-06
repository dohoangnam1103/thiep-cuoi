import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_PRICE, DEFAULT_REPEAT_CUSTOMER_PRICE } from "@/lib/payment";

const APP_CONFIG_ID = "default";

export type PaymentPrices = {
  productPrice: number;
  repeatCustomerPrice: number;
};

export async function getPaymentPrices(): Promise<PaymentPrices> {
  const config = await prisma.appConfig.findUnique({
    where: { id: APP_CONFIG_ID },
    select: { productPrice: true, repeatCustomerPrice: true },
  });

  return {
    productPrice: config?.productPrice ?? DEFAULT_PRODUCT_PRICE,
    repeatCustomerPrice: config?.repeatCustomerPrice ?? DEFAULT_REPEAT_CUSTOMER_PRICE,
  };
}

export async function getProductPrice(): Promise<number> {
  const { productPrice } = await getPaymentPrices();
  return productPrice;
}

export async function getPriceForUser(userId: string, currentInvitationId: string): Promise<number> {
  const [{ productPrice, repeatCustomerPrice }, paidCount] = await Promise.all([
    getPaymentPrices(),
    prisma.payment.count({
      where: {
        status: "paid",
        invitationId: { not: currentInvitationId },
        invitation: { userId },
      },
    }),
  ]);

  return paidCount > 0 ? repeatCustomerPrice : productPrice;
}

export async function updatePaymentPrices({ productPrice, repeatCustomerPrice }: PaymentPrices): Promise<void> {
  await prisma.appConfig.upsert({
    where: { id: APP_CONFIG_ID },
    create: { id: APP_CONFIG_ID, productPrice, repeatCustomerPrice },
    update: { productPrice, repeatCustomerPrice },
  });
}
