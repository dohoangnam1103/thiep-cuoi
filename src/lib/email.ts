import { Resend } from "resend";

import { absoluteUrl } from "@/lib/site-url";

export const TRIAL_REMINDER_FROM = "Thiệp Mừng Online <noreply@thiepmungonline.com>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Vỏ HTML dùng chung cho các email nhắc thanh toán.
 *
 * Tách ra để hai mốc nhắc (còn 24h, và đã hết hạn) không phải nhân đôi ~40 dòng
 * table-based layout. Chỉ phần lời văn và nhãn nút là khác nhau.
 *
 * `bodyHtml` là HTML đã escape sẵn bởi người gọi — mọi giá trị do người dùng nhập
 * phải đi qua `escapeHtml` trước khi ghép vào đây.
 */
function renderReminderShell(input: {
  greetingName: string;
  bodyHtml: string;
  ctaLabel: string;
  url: string;
}): string {
  const { greetingName, bodyHtml, ctaLabel, url } = input;
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(190,24,93,0.12);">
        <tr><td style="background:linear-gradient(135deg,#ec4899,#f472b6);padding:32px 32px 24px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Thiệp Mừng Online</div>
          <div style="margin-top:8px;font-size:14px;color:#fce7f3;">Thiệp cưới online</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#1f2937;">Chào <strong>${greetingName}</strong>,</p>
${bodyHtml}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="border-radius:12px;background:#ec4899;">
              <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
                ${ctaLabel}
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;text-align:center;">
            Hoặc mở link: <a href="${url}" style="color:#ec4899;">${url}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fdf2f8;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© Thiệp Mừng Online — thiepmungonline.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildTrialReminderEmail(input: {
  recipientName: string;
  cardName: string;
  payUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(input.recipientName || "bạn");
  const card = escapeHtml(input.cardName);
  const url = input.payUrl;
  const subject = `Thiệp cưới "${input.cardName}" — Hôm nay là ngày cuối dùng thử`;

  const html = renderReminderShell({
    greetingName: name,
    ctaLabel: "Thanh toán ngay",
    url,
    bodyHtml: `          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
            Hôm nay là <strong>ngày cuối cùng</strong> dùng thử thiệp cưới
            <strong style="color:#be185d;">"${card}"</strong>. Sau hôm nay, thiệp sẽ tạm ẩn cho tới khi bạn thanh toán.
          </p>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#374151;">
            Thanh toán ngay để giữ thiệp online mãi mãi và chia sẻ tới người thân nhé.
          </p>`,
  });

  return { subject, html };
}

/**
 * Email nhắc bù: thiệp đã hết hạn dùng thử và đang bị tạm ẩn.
 *
 * Lời văn cố ý khác mốc "còn 24h": ở đây việc đã xảy ra rồi, nên nói thẳng là
 * khách mời đang không xem được và thanh toán sẽ mở lại ngay. Không dùng chữ "hôm
 * nay là ngày cuối" nữa vì sai sự thật và làm người đọc mất tin.
 */
export function buildExpiredReminderEmail(input: {
  recipientName: string;
  cardName: string;
  payUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(input.recipientName || "bạn");
  const card = escapeHtml(input.cardName);
  const url = input.payUrl;
  const subject = `Thiệp cưới "${input.cardName}" đã hết hạn sử dụng — Vui lòng thanh toán để mở lại`;

  const html = renderReminderShell({
    greetingName: name,
    ctaLabel: "Mở lại thiệp",
    url,
    bodyHtml: `          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
            Thiệp cưới <strong style="color:#be185d;">"${card}"</strong> đã hết thời gian dùng thử
            nên hiện <strong>đang tạm ẩn</strong> — khách mời mở link sẽ không xem được nội dung thiệp.
          </p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
            Toàn bộ nội dung, ảnh và lời chúc của bạn vẫn được giữ nguyên. Thanh toán là thiệp
            hiện lại ngay, và online mãi mãi.
          </p>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#374151;">
            Link chia sẻ cũ vẫn dùng được, bạn không cần gửi lại link mới cho ai.
          </p>`,
  });

  return { subject, html };
}

export type ReminderKind = "trial-ending" | "expired";

const REMINDER_BUILDERS = {
  "trial-ending": buildTrialReminderEmail,
  expired: buildExpiredReminderEmail,
} as const;

export function buildReminderEmail(input: {
  recipientName: string;
  cardName: string;
  invitationId: string;
  kind: ReminderKind;
}): { subject: string; html: string } {
  const payUrl = absoluteUrl(`/dashboard/${input.invitationId}/thanh-toan`);
  return REMINDER_BUILDERS[input.kind]({
    recipientName: input.recipientName,
    cardName: input.cardName,
    payUrl,
  });
}

/** Gửi một email đã được dựng sẵn, trả lại message ID của Resend để audit. */
export async function sendEmailViaResend(input: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}): Promise<{ providerMessageId: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Thiếu RESEND_API_KEY");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    {
      from: TRIAL_REMINDER_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Resend lỗi: ${error.message}`);
  return { providerMessageId: data?.id ?? null };
}

/**
 * Gửi một email nhắc thanh toán.
 *
 * `kind` chọn giữa hai mốc: `trial-ending` cho thiệp còn 24h, `expired` cho thiệp
 * đã bị tạm ẩn. Link thanh toán giống nhau ở cả hai, chỉ lời văn khác.
 */
export async function sendReminderEmail(input: {
  to: string;
  recipientName: string;
  cardName: string;
  invitationId: string;
  kind: ReminderKind;
  idempotencyKey?: string;
}): Promise<{ subject: string; providerMessageId: string | null }> {
  const { subject, html } = buildReminderEmail(input);
  const result = await sendEmailViaResend({
    to: input.to,
    subject,
    html,
    idempotencyKey: input.idempotencyKey,
  });
  return { subject, ...result };
}

/** Giữ tên cũ cho mốc "còn 24h" để không phải sửa mọi call site. */
export async function sendTrialReminderEmail(input: {
  to: string;
  recipientName: string;
  cardName: string;
  invitationId: string;
}): Promise<void> {
  await sendReminderEmail({ ...input, kind: "trial-ending" });
}
