export type PaymentViewState =
  | "disabled"
  | "unpaid"
  | "pending"
  | "paid"
  | "expired"
  | "failed";

export type Site2PaymentMode = "disabled" | "sandbox" | "live";

export type Site2OrderView = {
  state: Exclude<PaymentViewState, "disabled">;
  code: string;
  amount: number;
};

export type Site2Checkout = {
  providerOrderCode: string;
  checkoutUrl: string | null;
  qrCode: string | null;
};

export type Site2CheckoutProvider = {
  createCheckout(input: {
    code: string;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<Site2Checkout>;
};

export type Site2WebhookData = {
  orderCode: string;
  amount: number;
  status: "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";
};

export type Site2WebhookEvent = {
  data: Site2WebhookData;
  signature: string;
};
