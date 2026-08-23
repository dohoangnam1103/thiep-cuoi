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

export function buildTrialReminderEmail(input: {
  recipientName: string;
  cardName: string;
  payUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(input.recipientName || "bạn");
  const card = escapeHtml(input.cardName);
  const url = input.payUrl;
  const subject = `Thiệp cưới "${input.cardName}" — Hôm nay là ngày cuối dùng thử`;

  const html = `<!DOCTYPE html>
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
          <p style="margin:0 0 16px;font-size:16px;color:#1f2937;">Chào <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
            Hôm nay là <strong>ngày cuối cùng</strong> dùng thử thiệp cưới
            <strong style="color:#be185d;">"${card}"</strong>. Sau hôm nay, thiệp sẽ tạm ẩn cho tới khi bạn thanh toán.
          </p>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#374151;">
            Thanh toán ngay để giữ thiệp online mãi mãi và chia sẻ tới người thân nhé.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="border-radius:12px;background:#ec4899;">
              <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
                Thanh toán ngay
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

  return { subject, html };
}

export async function sendTrialReminderEmail(input: {
  to: string;
  recipientName: string;
  cardName: string;
  invitationId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Thiếu RESEND_API_KEY");

  const resend = new Resend(apiKey);
  const payUrl = absoluteUrl(`/dashboard/${input.invitationId}/thanh-toan`);
  const { subject, html } = buildTrialReminderEmail({
    recipientName: input.recipientName,
    cardName: input.cardName,
    payUrl,
  });

  const { error } = await resend.emails.send({
    from: TRIAL_REMINDER_FROM,
    to: input.to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Resend lỗi: ${error.message}`);
  }
}
