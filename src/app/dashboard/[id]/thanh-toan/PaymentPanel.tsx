"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { trackEvent } from "@/lib/analytics";
import { BANK, buildVietQrUrl } from "@/lib/payment";
import {
  applyVoucherToPayment,
  type PaymentInfo,
  type VoucherErrorCode,
} from "./actions";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PaymentPanel({ initial }: { initial: PaymentInfo }) {
  const router = useRouter();
  const t = useTranslations("paymentActivation");
  const [payment, setPayment] = useState(initial);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState<VoucherErrorCode | null>(null);
  const [applying, setApplying] = useState(false);
  const [paid, setPaid] = useState(initial.status === "paid");
  const [expired, setExpired] = useState(() => Date.now() >= new Date(initial.expiresAt).getTime());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const qrUrl = payment.provider === "payos"
    ? `/api/payment/${payment.code}/qr`
    : buildVietQrUrl({ amount: payment.amount, code: payment.code });
  const expiresAtMs = new Date(payment.expiresAt).getTime();

  useEffect(() => {
    if (initial.status !== "paid") {
      trackEvent("begin_checkout", { currency: "VND", value: initial.amount });
    }
  }, [initial.amount, initial.status]);

  useEffect(() => {
    if (paid || expired) return;
    const timeout = setTimeout(() => setExpired(true), Math.max(0, expiresAtMs - Date.now()));
    return () => clearTimeout(timeout);
  }, [expired, expiresAtMs, paid]);

  useEffect(() => {
    if (paid || expired) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/${payment.code}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status === "paid") {
          trackEvent("purchase", {
            transaction_id: payment.code,
            currency: "VND",
            value: payment.amount,
            coupon: payment.voucherCode || undefined,
          });
          setPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
          router.push("/dashboard");
          router.refresh();
        }
        if (data.status === "expired") {
          setExpired(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore transient errors, keep polling
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [expired, paid, payment.amount, payment.code, payment.voucherCode, router]);

  async function onApplyVoucher() {
    setApplying(true);
    setVoucherError(null);
    const previousAmount = payment.amount;
    const result = await applyVoucherToPayment(payment.paymentId, voucherInput);
    setApplying(false);
    if (result.ok) {
      trackEvent("apply_voucher", {
        currency: "VND",
        discount: Math.max(0, previousAmount - result.payment.amount),
      });
      setPayment(result.payment);
      setExpired(false);
      setVoucherInput("");
      if (result.payment.status === "paid") {
        setPaid(true);
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      setVoucherError(result.errorCode);
    }
  }

  if (paid) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Thanh toán thành công</h2>
        <p className="mt-2 text-muted-foreground">Đang chuyển về danh sách thiệp…</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center shadow">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Mã thanh toán đã hết hạn</h2>
        <p className="mt-2 text-muted-foreground">
          Mỗi mã thanh toán chỉ có hiệu lực đến {formatDateTime(new Date(initial.expiresAt))}.
          Tải lại trang để lấy mã chuyển khoản mới.
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-5 rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          Lấy mã mới
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid items-start gap-6 sm:grid-cols-[1fr_1.1fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow">
        <img
          src={qrUrl}
          alt="Mã QR chuyển khoản VietQR"
          className="mx-auto w-full max-w-[280px] rounded-xl"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow">
        <p className="text-sm text-muted-foreground">Số tiền cần thanh toán</p>
        <p className="mt-1 font-heading text-3xl font-bold text-foreground">{formatVnd(payment.amount)}</p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ngân hàng</dt>
            <dd className="font-medium text-foreground">MB Bank</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Số tài khoản</dt>
            <dd className="font-medium text-foreground">{payment.bankAccount || BANK.account}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Chủ tài khoản</dt>
            <dd className="font-medium text-foreground">{payment.bankAccountName || BANK.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Nội dung CK</dt>
            <dd className="font-mono font-semibold text-foreground">{payment.code}</dd>
          </div>
        </dl>

        <p className="mt-4 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
          Chuyển khoản đúng số tiền và nội dung. Mã này có hiệu lực đến {formatDateTime(new Date(payment.expiresAt))}.
          Hệ thống tự động xác nhận trong giây lát sau khi nhận được tiền.
        </p>

        <div className="mt-5">
          {payment.voucherCode ? (
            <p className="text-sm text-green-700">Đã áp mã <span className="font-semibold">{payment.voucherCode}</span></p>
          ) : payment.voucherAllowed ? (
            <div className="flex gap-2">
              <input
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder="Mã giảm giá"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={onApplyVoucher}
                disabled={applying}
                className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {applying ? "Đang áp…" : "Áp mã"}
              </button>
            </div>
          ) : null}
          {voucherError ? (
            <p className="mt-2 text-sm text-red-600">
              {t(`errors.${voucherError}`)}
            </p>
          ) : null}
        </div>

        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block size-2 animate-pulse rounded-full bg-amber-500" />
          Đang chờ thanh toán…
        </p>
      </div>
    </div>
  );
}
