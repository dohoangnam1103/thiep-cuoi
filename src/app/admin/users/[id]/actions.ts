"use server";

import { getDemoFontFamily } from "@/lib/demo-font-default";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Payment } from "@/generated/prisma/client";
import { ADMIN_AUDIT_ACTIONS, writeAdminAudit } from "@/lib/admin-audit";
import { verifyAdmin } from "@/lib/admin-dal";
import { adminFinalPriceSchema } from "@/lib/invitation-pricing";
import { cancelPayosPayment } from "@/lib/payment-service";
import { prisma } from "@/lib/prisma";
import { parseAdminTemplateId, SYSTEM_EMAIL } from "@/lib/admin-support-input";

export type CreateInvitationState =
  | { ok: false; errorCode: "invalidTemplate" | "userNotFound" }
  | undefined;

export type PriceMutationErrorCode =
  | "invalidPrice"
  | "userNotFound"
  | "invitationNotFound"
  | "paidPriceLocked"
  | "concurrentChange";

export type PriceMutationState =
  | { ok: true; activation: "trial" | "complimentary"; finalPrice: number | null }
  | { ok: false; errorCode: PriceMutationErrorCode }
  | undefined;

class AdminSupportMutationError extends Error {
  constructor(readonly code: Exclude<PriceMutationErrorCode, "invalidPrice">) {
    super(code);
  }
}

function priceFailure(error: unknown): PriceMutationState {
  if (error instanceof AdminSupportMutationError) {
    return { ok: false, errorCode: error.code };
  }
  throw error;
}

const priceFormSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("set"),
    invitationId: z.string().min(1),
    finalPrice: adminFinalPriceSchema,
  }),
  z.object({
    mode: z.literal("reset"),
    invitationId: z.string().min(1),
  }),
]);

export async function createInvitationForUser(
  targetUserId: string,
  _previous: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  const { adminId, adminEmail } = await verifyAdmin();

  const templateId = parseAdminTemplateId(formData.get("templateId"));
  if (!templateId) {
    return { ok: false, errorCode: "invalidTemplate" };
  }

  let createdInvitationId: string;
  try {
    createdInvitationId = await prisma.$transaction(async (db) => {
      const target = await db.user.findFirst({
        where: { id: targetUserId, NOT: { email: SYSTEM_EMAIL } },
        select: { id: true, email: true },
      });
      if (!target) {
        throw new AdminSupportMutationError("userNotFound");
      }

      const fontFamily = await getDemoFontFamily(db, templateId);
      const invitation = await db.invitation.create({
        data: {
          userId: target.id,
          templateId,
          status: "draft",
          content: { create: { fontFamily } },
        },
        select: { id: true },
      });

      await writeAdminAudit(db, {
        adminId,
        adminEmail,
        targetUserId: target.id,
        targetUserEmail: target.email,
        invitationId: invitation.id,
        action: ADMIN_AUDIT_ACTIONS.invitationCreated,
        details: { templateId },
      });

      return invitation.id;
    });
  } catch (error) {
    if (error instanceof AdminSupportMutationError && error.code === "userNotFound") {
      return { ok: false, errorCode: "userNotFound" };
    }
    throw error;
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  revalidatePath("/dashboard");
  redirect(`/admin/invitations/${createdInvitationId}/edit`);
}

export async function updateInvitationPrice(
  targetUserId: string,
  _previous: PriceMutationState,
  formData: FormData,
): Promise<PriceMutationState> {
  const { adminId, adminEmail } = await verifyAdmin();

  const parsed = priceFormSchema.safeParse({
    mode: formData.get("mode"),
    invitationId: formData.get("invitationId"),
    finalPrice: formData.get("finalPrice"),
  });
  if (!parsed.success) {
    return { ok: false, errorCode: "invalidPrice" };
  }
  const input = parsed.data;

  let result: {
    slug: string | null;
    complimentary: boolean;
    finalPrice: number | null;
    payments: Payment[];
  };
  try {
    result = await prisma.$transaction(async (db) => {
      const target = await db.user.findFirst({
        where: { id: targetUserId, NOT: { email: SYSTEM_EMAIL } },
        select: { id: true, email: true },
      });
      if (!target) {
        throw new AdminSupportMutationError("userNotFound");
      }

      const invitation = await db.invitation.findFirst({
        where: { id: input.invitationId, userId: target.id, isDemo: false },
        select: {
          id: true,
          paid: true,
          updatedAt: true,
          adminPriceOverride: true,
          complimentary: true,
          slug: true,
          payments: {
            where: { status: { in: ["pending", "cancelled"] } },
          },
        },
      });
      if (!invitation) {
        throw new AdminSupportMutationError("invitationNotFound");
      }
      if (invitation.paid) {
        throw new AdminSupportMutationError("paidPriceLocked");
      }

      const reset = input.mode === "reset";
      const finalPrice = reset ? null : input.finalPrice;
      const complimentary = finalPrice === 0;
      const nextState = {
        adminPriceOverride: finalPrice,
        complimentary,
        complimentaryAt: complimentary ? new Date() : null,
      };

      const updated = await db.invitation.updateMany({
        where: {
          id: invitation.id,
          userId: target.id,
          isDemo: false,
          paid: false,
          updatedAt: invitation.updatedAt,
        },
        data: nextState,
      });
      if (updated.count === 0) {
        throw new AdminSupportMutationError("concurrentChange");
      }

      const superseded = await db.payment.updateMany({
        where: {
          invitationId: invitation.id,
          status: { in: ["pending", "cancelled"] },
        },
        data: { status: "superseded" },
      });

      await writeAdminAudit(db, {
        adminId,
        adminEmail,
        targetUserId: target.id,
        targetUserEmail: target.email,
        invitationId: invitation.id,
        action: reset
          ? ADMIN_AUDIT_ACTIONS.priceOverrideCleared
          : ADMIN_AUDIT_ACTIONS.priceOverrideSet,
        details: {
          before: {
            adminPriceOverride: invitation.adminPriceOverride,
            complimentary: invitation.complimentary,
          },
          after: { adminPriceOverride: finalPrice, complimentary },
          supersededPaymentCount: superseded.count,
        },
      });

      if (complimentary !== invitation.complimentary) {
        await writeAdminAudit(db, {
          adminId,
          adminEmail,
          targetUserId: target.id,
          targetUserEmail: target.email,
          invitationId: invitation.id,
          action: complimentary
            ? ADMIN_AUDIT_ACTIONS.complimentaryGranted
            : ADMIN_AUDIT_ACTIONS.complimentaryRevoked,
        });
      }

      return {
        slug: invitation.slug,
        complimentary,
        finalPrice,
        payments: invitation.payments,
      };
    });
  } catch (error) {
    return priceFailure(error);
  }

  await Promise.all(
    result.payments
      .filter((payment) => payment.provider === "payos" && payment.providerOrderCode)
      .map((payment) => cancelPayosPayment(payment, "admin_price_changed")),
  );

  revalidatePath(`/admin/users/${targetUserId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/editor/${input.invitationId}`);
  if (result.slug) {
    revalidatePath(`/thiep/${result.slug}`);
  }

  return {
    ok: true,
    activation: result.complimentary ? "complimentary" : "trial",
    finalPrice: result.finalPrice,
  };
}
