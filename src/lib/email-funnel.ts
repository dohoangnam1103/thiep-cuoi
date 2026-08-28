import { prisma } from "@/lib/prisma";

/**
 * Phễu email nhắc thanh toán: gửi → click → thanh toán.
 *
 * Trả lời đúng một câu hỏi: email nhắc có mang lại tiền không. Trước khi có bảng
 * này, `/admin/email-logs` chỉ nói được "Resend đã nhận thư" — tức là mọi số liệu
 * đều dừng ở phía gửi, không có gì nối sang doanh thu.
 *
 * Gộp trong JS thay vì một câu SQL join: Prisma không so sánh được hai cột thuộc
 * hai model (`Payment.paidAt > EmailDelivery.sentAt`), nên lựa chọn thực tế là
 * `$queryRaw` hoặc fold ở tầng ứng dụng. Chọn fold vì cùng lý do như
 * `src/lib/admin-daily-stats.ts`: logic thành hàm thuần test được, và tập dữ liệu
 * ở đây tính bằng chục dòng chứ không phải chục nghìn.
 *
 * Một cảnh báo cần đọc kèm mọi con số dưới đây: đây là **tương quan, không phải
 * nhân quả**. Không có nhóm holdout, nên "đã trả sau email" bao gồm cả người vốn
 * đã định trả. Muốn biết email có tác dụng thật thì phải giữ lại một nhóm không
 * gửi — với lưu lượng hiện tại thì nhóm đó chưa đủ lớn để nói được điều gì.
 */

/** Hai loại email nhắc thanh toán. Các loại khác không có đích chuyển đổi. */
export const FUNNEL_EMAIL_TYPES = ["trial-ending", "expired"] as const;

export type FunnelEmailType = (typeof FUNNEL_EMAIL_TYPES)[number];

export type FunnelDelivery = {
  type: string;
  invitationId: string | null;
  sentAt: Date | null;
  firstClickedAt: Date | null;
};

export type FunnelPayment = {
  invitationId: string;
  paidAt: Date | null;
};

export type EmailFunnelRow = {
  type: FunnelEmailType;
  /** Email đã được Resend nhận. Đây là mẫu số của mọi tỉ lệ trong hàng. */
  sent: number;
  /** Có ít nhất một lần bấm vào nút thanh toán trong thư. */
  clicked: number;
  /** Thiệp có đơn `paid` với `paidAt` sau lúc gửi thư, kể cả khi không bấm link. */
  paidAfterSent: number;
  /** Đã bấm link VÀ trả sau lần bấm đầu. Con số gần với "email mang lại tiền" nhất. */
  paidAfterClick: number;
};

function isFunnelType(value: string): value is FunnelEmailType {
  return (FUNNEL_EMAIL_TYPES as readonly string[]).includes(value);
}

/**
 * Mốc thanh toán muộn nhất của mỗi thiệp.
 *
 * Lấy muộn nhất chứ không phải sớm nhất vì câu hỏi luôn có dạng "có khoản nào trả
 * sau mốc T không": nếu khoản muộn nhất còn không sau T thì không khoản nào sau T.
 * Một thiệp bình thường chỉ có một đơn `paid` — `settlePayment` dùng điều kiện
 * `paid: false` trên thiệp làm người phân xử — nhưng đường voucher-về-0 và thao tác
 * admin vẫn có thể sinh thêm, nên không giả định là một.
 */
function latestPaidAtByInvitation(payments: readonly FunnelPayment[]): Map<string, number> {
  const latest = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.paidAt) continue;
    const at = payment.paidAt.getTime();
    const current = latest.get(payment.invitationId);
    if (current === undefined || at > current) latest.set(payment.invitationId, at);
  }
  return latest;
}

/**
 * Gộp delivery + thanh toán thành một hàng cho mỗi loại email nhắc.
 *
 * Luôn trả về đủ số hàng bằng `FUNNEL_EMAIL_TYPES`, kể cả loại chưa gửi email nào:
 * một hàng 0 nói "đã đo, chưa có gì" — còn hàng biến mất khỏi bảng thì người đọc
 * không phân biệt được với "tính năng hỏng".
 *
 * Đếm theo delivery, không theo thiệp. Mỗi thiệp có tối đa một delivery cho mỗi
 * loại (`dedupeKey` = `trial-reminder:<kind>:<invitationId>`) nên trong cùng một
 * hàng không có đếm trùng; còn một thiệp nhận cả hai mốc thì cố ý xuất hiện ở cả
 * hai hàng, vì đó là hai lần nhắc riêng biệt.
 */
export function buildEmailFunnel(
  deliveries: readonly FunnelDelivery[],
  payments: readonly FunnelPayment[],
): EmailFunnelRow[] {
  const latestPaidAt = latestPaidAtByInvitation(payments);
  const rows = new Map<FunnelEmailType, EmailFunnelRow>(
    FUNNEL_EMAIL_TYPES.map((type) => [
      type,
      { type, sent: 0, clicked: 0, paidAfterSent: 0, paidAfterClick: 0 },
    ]),
  );

  for (const delivery of deliveries) {
    if (!isFunnelType(delivery.type)) continue;
    const row = rows.get(delivery.type);
    // `isFunnelType` vừa hẹp kiểu nên nhánh này không xảy ra; giữ để không dùng `!`.
    if (!row) continue;

    row.sent += 1;
    if (delivery.firstClickedAt) row.clicked += 1;

    // Không có thiệp thì không có đường nối sang tiền: thiệp đã bị xoá
    // (`invitationId` là `onDelete: SetNull`). Vẫn tính vào `sent` để mẫu số khớp
    // với số thư thật đã gửi.
    if (!delivery.invitationId) continue;
    const paidAt = latestPaidAt.get(delivery.invitationId);
    if (paidAt === undefined) continue;

    if (delivery.sentAt && paidAt > delivery.sentAt.getTime()) row.paidAfterSent += 1;
    if (delivery.firstClickedAt && paidAt > delivery.firstClickedAt.getTime()) {
      row.paidAfterClick += 1;
    }
  }

  return FUNNEL_EMAIL_TYPES.map((type) => rows.get(type)).filter(
    (row): row is EmailFunnelRow => row !== undefined,
  );
}

/**
 * Tỉ lệ để hiển thị, hoặc `null` khi mẫu số bằng 0.
 *
 * `null` chứ không phải 0: "0%" đọc như một kết quả đã đo được, còn chưa gửi thư
 * nào thì chưa đo gì cả. Trang quản trị in dấu gạch cho `null`.
 */
export function funnelRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export function sumEmailFunnel(rows: readonly EmailFunnelRow[]): Omit<EmailFunnelRow, "type"> {
  return rows.reduce(
    (total, row) => ({
      sent: total.sent + row.sent,
      clicked: total.clicked + row.clicked,
      paidAfterSent: total.paidAfterSent + row.paidAfterSent,
      paidAfterClick: total.paidAfterClick + row.paidAfterClick,
    }),
    { sent: 0, clicked: 0, paidAfterSent: 0, paidAfterClick: 0 },
  );
}

/**
 * Đọc dữ liệu phễu cho toàn bộ thời gian.
 *
 * Cố ý không nhận bộ lọc ngày như bảng bên dưới nó: chuyển đổi có độ trễ, nên cắt
 * theo "hôm nay" sẽ luôn cho ra tỉ lệ thấp giả tạo vì thư gửi sáng nay chưa kịp
 * được trả tiền. Toàn thời gian là con số duy nhất không tự bóp méo mình.
 *
 * Chỉ lấy delivery `sent`: thư `failed`/`blocked` chưa từng tới hộp thư khách nên
 * đưa vào mẫu số sẽ làm tỉ lệ chuyển đổi trông tệ hơn thực tế vì một lý do không
 * liên quan gì tới nội dung email.
 *
 * Không phân trang và không giới hạn thời gian, nên số hàng đọc lên tăng tuyến tính
 * theo số email đã gửi: khoảng 5 thư/ngày ở thời điểm viết, tức vài nghìn hàng mỗi
 * năm. Ở quy mô đó thì gộp trong JS rẻ hơn nhiều lần một câu SQL phức tạp. Nếu lưu
 * lượng tăng hàng chục lần thì chỗ cần đổi là gộp sẵn theo ngày, không phải cắt bớt
 * cửa sổ — cắt cửa sổ sẽ làm tỉ lệ tự bóp méo như đã nói ở trên.
 */
export async function loadEmailFunnel(db = prisma): Promise<EmailFunnelRow[]> {
  const types = [...FUNNEL_EMAIL_TYPES];
  const [deliveries, payments] = await Promise.all([
    db.emailDelivery.findMany({
      where: { status: "sent", type: { in: types } },
      select: {
        type: true,
        invitationId: true,
        sentAt: true,
        firstClickedAt: true,
      },
    }),
    // Hẹp về đúng những thiệp đã nhận email nhắc, thay vì kéo toàn bộ đơn `paid`
    // của hệ thống rồi lọc trong JS.
    db.payment.findMany({
      where: {
        status: "paid",
        invitation: { emailDeliveries: { some: { status: "sent", type: { in: types } } } },
      },
      select: { invitationId: true, paidAt: true },
    }),
  ]);

  return buildEmailFunnel(deliveries, payments);
}
