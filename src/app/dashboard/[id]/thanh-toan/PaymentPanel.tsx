"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BANK, buildVietQrUrl } from "@/lib/payment";
import { applyVoucherToPayment, type PaymentInfo } from "./actions";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function PaymentPanel({ initial }: { initial: PaymentInfo }) {
  const router = useRouter();
  const [amount, setAmount] = useState(initial.amount);
  const [voucherCode, setVoucherCode] = useState(initial.voucherCode ?? "");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [paid, setPaid] = useState(initial.status === "paid");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const qrUrl = buildVietQrUrl({ amount, code: initial.code });

  useEffect(() => {
    if (paid) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/${initial.code}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status === "paid") {
          setPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
          router.push("/dashboard");
          router.refresh();
        }
      } catch {
        // ignore transient errors, keep polling
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [initial.code, paid, router]);

  async function onApplyVoucher() {
    setApplying(true);
    setVoucherError(null);
    const result = await applyVoucherToPayment(initial.paymentId, voucherInput);
    setApplying(false);
    if (result.ok) {
      setAmount(result.amount);
      setVoucherCode(result.voucherCode);
      setVoucherInput("");
    } else {
      setVoucherError(result.error);
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

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_1.1fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow">
        <img
          src={qrUrl}
          alt="Mã QR chuyển khoản VietQR"
          className="mx-auto w-full max-w-[280px] rounded-xl"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow">
        <p className="text-sm text-muted-foreground">Số tiền cần thanh toán</p>
        <p className="mt-1 font-heading text-3xl font-bold text-foreground">{formatVnd(amount)}</p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ngân hàng</dt>
            <dd className="font-medium text-foreground">MB Bank</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Số tài khoản</dt>
            <dd className="font-medium text-foreground">{BANK.account}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Chủ tài khoản</dt>
            <dd className="font-medium text-foreground">{BANK.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Nội dung CK</dt>
            <dd className="font-mono font-semibold text-foreground">{initial.code}</dd>
          </div>
        </dl>

        <p className="mt-4 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
          Chuyển khoản đúng số tiền và nội dung. Hệ thống tự động xác nhận trong giây lát sau khi
          nhận được tiền.
        </p>

        <div className="mt-5">
          {voucherCode ? (
            <p className="text-sm text-green-700">Đã áp mã <span className="font-semibold">{voucherCode}</span></p>
          ) : (
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
          )}
          {voucherError ? <p className="mt-2 text-sm text-red-600">{voucherError}</p> : null}
        </div>

        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block size-2 animate-pulse rounded-full bg-amber-500" />
          Đang chờ thanh toán…
        </p>
      </div>
    </div>
  );
}
