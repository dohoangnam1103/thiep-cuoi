import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  resolveEffectiveInvitationPrice,
  resolveSystemInvitationPrice,
} from "@/lib/invitation-pricing";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_PRICE, DEFAULT_REPEAT_CUSTOMER_PRICE } from "@/lib/payment";

const APP_CONFIG_ID = "default";

export type PaymentPrices = {
  productPrice: number;
  repeatCustomerPrice: number;
};

type PaymentPriceClient = Pick<
  Prisma.TransactionClient,
  "appConfig" | "invitation" | "payment"
>;

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

export async function getPriceForInvitation(
  db: PaymentPriceClient,
  userId: string,
  invitationId: string,
): Promise<number> {
  const [config, invitation, paidCount] = await Promise.all([
    db.appConfig.findUnique({
      where: { id: APP_CONFIG_ID },
      select: { productPrice: true, repeatCustomerPrice: true },
    }),
    db.invitation.findFirst({
      where: { id: invitationId, userId },
      select: { adminPriceOverride: true },
    }),
    db.payment.count({
      where: {
        status: "paid",
        invitationId: { not: invitationId },
        invitation: { userId },
      },
    }),
  ]);
  if (!invitation) throw new Error("Không tìm thấy thiệp");

  const productPrice = config?.productPrice ?? DEFAULT_PRODUCT_PRICE;
  const repeatCustomerPrice =
    config?.repeatCustomerPrice ?? DEFAULT_REPEAT_CUSTOMER_PRICE;
  const systemPrice = resolveSystemInvitationPrice(
    productPrice,
    repeatCustomerPrice,
    paidCount,
  );
  return resolveEffectiveInvitationPrice(
    invitation.adminPriceOverride,
    systemPrice,
  );
}

export async function getPriceForUser(
  userId: string,
  currentInvitationId: string,
): Promise<number> {
  return getPriceForInvitation(prisma, userId, currentInvitationId);
}

export async function updatePaymentPrices({ productPrice, repeatCustomerPrice }: PaymentPrices): Promise<void> {
  await prisma.appConfig.upsert({
    where: { id: APP_CONFIG_ID },
    create: { id: APP_CONFIG_ID, productPrice, repeatCustomerPrice },
    update: { productPrice, repeatCustomerPrice },
  });
}
