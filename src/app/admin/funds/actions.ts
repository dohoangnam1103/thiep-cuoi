"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifySuperAdmin } from "@/lib/admin-dal";
import { vietnamDayKey, vietnamStartOfDay } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

const MAX_WITHDRAWAL_VND = 2_000_000_000;
const MAX_ALLOCATIONS = 50;

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_WITHDRAWAL_VND));
const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null);

function isValidVietnamDateInput(value: string): boolean {
  const parsed = vietnamStartOfDay(value);
  return parsed !== null && vietnamDayKey(parsed) === value;
}

const allocationSchema = z.object({
  recipient: z.string().trim().min(1).max(120),
  amount: moneySchema,
  note: optionalText(300),
});

const withdrawalSchema = z.object({
  requestKey: z.string().trim().min(16).max(80).regex(/^[A-Za-z0-9_-]+$/),
  amount: moneySchema,
  withdrawnAt: z.string().trim().refine(isValidVietnamDateInput),
  purpose: z.string().trim().min(3).max(240),
  bankReference: z.string().trim().min(3).max(120).transform((value) => value.toUpperCase()),
  note: optionalText(1_000),
  allocations: z.array(allocationSchema).min(1).max(MAX_ALLOCATIONS),
}).superRefine((value, context) => {
  const allocated = value.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  if (!Number.isSafeInteger(allocated) || allocated !== value.amount) {
    context.addIssue({
      code: "custom",
      path: ["allocations"],
      message: "allocationMismatch",
    });
  }
});

type WithdrawalInput = z.infer<typeof withdrawalSchema>;

function withdrawalPayloadHash(input: WithdrawalInput): string {
  const payload = {
    amount: input.amount,
    withdrawnAt: input.withdrawnAt,
    purpose: input.purpose,
    bankReference: input.bankReference,
    note: input.note,
    allocations: input.allocations,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

const voidSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type RecordWithdrawalError =
  | "invalidData"
  | "allocationMismatch"
  | "amountTooLarge"
  | "futureDate"
  | "duplicateReference"
  | "requestConflict";
export type RecordWithdrawalState =
  | { ok: true }
  | { ok: false; errorCode: RecordWithdrawalError }
  | undefined;

export type VoidWithdrawalState =
  | { ok: true }
  | { ok: false; errorCode: "invalidReason" | "notFound" }
  | undefined;

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function readAllocations(formData: FormData) {
  const recipients = formData.getAll("allocationRecipient");
  const amounts = formData.getAll("allocationAmount");
  const notes = formData.getAll("allocationNote");
  const count = Math.max(recipients.length, amounts.length, notes.length);

  return Array.from({ length: count }, (_, index) => ({
    recipient: text(recipients[index] ?? null),
    amount: text(amounts[index] ?? null),
    note: text(notes[index] ?? null),
  }));
}

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function recordProjectFundWithdrawal(
  _previous: RecordWithdrawalState,
  formData: FormData,
): Promise<RecordWithdrawalState> {
  const { adminId, adminEmail } = await verifySuperAdmin();
  const parsed = withdrawalSchema.safeParse({
    requestKey: text(formData.get("requestKey")),
    amount: text(formData.get("amount")),
    withdrawnAt: text(formData.get("withdrawnAt")),
    purpose: text(formData.get("purpose")),
    bankReference: text(formData.get("bankReference")),
    note: text(formData.get("note")),
    allocations: readAllocations(formData),
  });

  if (!parsed.success) {
    const allocationMismatch = parsed.error.issues.some(
      (issue) => issue.path[0] === "allocations" && issue.message === "allocationMismatch",
    );
    if (allocationMismatch) return { ok: false, errorCode: "allocationMismatch" };

    const amountTooLarge = parsed.error.issues.some(
      (issue) => issue.code === "too_big" && issue.path.at(-1) === "amount",
    );
    return { ok: false, errorCode: amountTooLarge ? "amountTooLarge" : "invalidData" };
  }

  if (parsed.data.withdrawnAt > vietnamDayKey(new Date())) {
    return { ok: false, errorCode: "futureDate" };
  }
  const withdrawnAt = vietnamStartOfDay(parsed.data.withdrawnAt);
  if (!withdrawnAt) return { ok: false, errorCode: "invalidData" };
  const payloadHash = withdrawalPayloadHash(parsed.data);

  try {
    await prisma.projectFundWithdrawal.create({
      data: {
        requestKey: parsed.data.requestKey,
        payloadHash,
        amount: parsed.data.amount,
        withdrawnAt,
        purpose: parsed.data.purpose,
        bankReference: parsed.data.bankReference,
        note: parsed.data.note,
        createdByAdminId: adminId,
        createdByAdminEmail: adminEmail,
        allocations: {
          create: parsed.data.allocations.map((allocation, sortOrder) => ({
            recipient: allocation.recipient,
            amount: allocation.amount,
            note: allocation.note,
            sortOrder,
          })),
        },
      },
    });
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error;
    const [existingRequest, existingReference] = await Promise.all([
      prisma.projectFundWithdrawal.findUnique({
        where: { requestKey: parsed.data.requestKey },
        select: { payloadHash: true },
      }),
      prisma.projectFundWithdrawal.findUnique({
        where: { bankReference: parsed.data.bankReference },
        select: { id: true },
      }),
    ]);

    // Cùng request key chỉ là retry an toàn khi payload giống hệt. Không được
    // đóng form như đã lưu nếu trình duyệt gửi lại key với dữ liệu khác.
    if (existingRequest) {
      if (existingRequest.payloadHash !== payloadHash) {
        return { ok: false, errorCode: "requestConflict" };
      }
      revalidatePath("/admin/funds");
      return { ok: true };
    }
    // Mã sao kê là định danh nghiệp vụ: mở form mới vẫn không thể trừ cùng một
    // giao dịch ngân hàng lần thứ hai.
    if (existingReference) {
      return { ok: false, errorCode: "duplicateReference" };
    }
    throw error;
  }

  revalidatePath("/admin/funds");
  return { ok: true };
}

export async function voidProjectFundWithdrawal(
  withdrawalId: string,
  _previous: VoidWithdrawalState,
  formData: FormData,
): Promise<VoidWithdrawalState> {
  const { adminId, adminEmail } = await verifySuperAdmin();
  const parsed = voidSchema.safeParse({ reason: text(formData.get("reason")) });
  if (!parsed.success) return { ok: false, errorCode: "invalidReason" };

  try {
    const result = await prisma.$transaction(async (db) => {
      const withdrawal = await db.projectFundWithdrawal.findUnique({
        where: { id: withdrawalId },
        select: { id: true, void: { select: { id: true } } },
      });
      if (!withdrawal) return "notFound" as const;
      if (withdrawal.void) return "alreadyVoided" as const;

      await db.projectFundWithdrawalVoid.create({
        data: {
          withdrawalId,
          reason: parsed.data.reason,
          createdByAdminId: adminId,
          createdByAdminEmail: adminEmail,
        },
      });
      return "voided" as const;
    });

    if (result === "notFound") return { ok: false, errorCode: "notFound" };
  } catch (error) {
    // Hai tab cùng hủy một row: unique withdrawalId biến lần thứ hai thành một
    // retry an toàn, thay vì tạo hai dấu hủy hoặc báo lỗi khó hiểu cho admin.
    if (!isUniqueConstraint(error)) throw error;
    const existingVoid = await prisma.projectFundWithdrawalVoid.findUnique({
      where: { withdrawalId },
      select: { id: true },
    });
    if (!existingVoid) throw error;
  }

  revalidatePath("/admin/funds");
  return { ok: true };
}
