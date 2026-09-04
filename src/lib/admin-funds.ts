import { prisma } from "@/lib/prisma";

export type ProjectFundSummary = {
  invitationRevenue: number;
  slideshowRevenue: number;
  totalRevenue: number;
  totalWithdrawn: number;
  recordedBalance: number;
  activeWithdrawalCount: number;
  voidedWithdrawalCount: number;
  paidWithoutDateCount: number;
};

/**
 * Ảnh chụp sổ quỹ toàn thời gian.
 *
 * Chỉ đơn `paid` mới là doanh thu. Các cờ entitlement như `Invitation.paid`
 * hoặc `complimentary` không thể dùng ở đây vì chúng không chứng minh tiền đã
 * về. Tiền rút bị hủy vẫn còn trong lịch sử nhưng không làm giảm số dư.
 */
export async function getProjectFundSummary(): Promise<ProjectFundSummary> {
  const [
    invitationRevenue,
    slideshowRevenue,
    activeWithdrawals,
    activeWithdrawalCount,
    voidedWithdrawalCount,
    invitationPaidWithoutDate,
    slideshowPaidWithoutDate,
  ] = await prisma.$transaction([
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.slideshowPayment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.projectFundWithdrawal.aggregate({
      where: { void: { is: null } },
      _sum: { amount: true },
    }),
    prisma.projectFundWithdrawal.count({ where: { void: { is: null } } }),
    prisma.projectFundWithdrawal.count({ where: { void: { isNot: null } } }),
    prisma.payment.count({ where: { status: "paid", paidAt: null } }),
    prisma.slideshowPayment.count({ where: { status: "paid", paidAt: null } }),
  ]);

  const invitationAmount = invitationRevenue._sum.amount ?? 0;
  const slideshowAmount = slideshowRevenue._sum.amount ?? 0;
  const totalRevenue = invitationAmount + slideshowAmount;
  const totalWithdrawn = activeWithdrawals._sum.amount ?? 0;

  return {
    invitationRevenue: invitationAmount,
    slideshowRevenue: slideshowAmount,
    totalRevenue,
    totalWithdrawn,
    recordedBalance: totalRevenue - totalWithdrawn,
    activeWithdrawalCount,
    voidedWithdrawalCount,
    paidWithoutDateCount: invitationPaidWithoutDate + slideshowPaidWithoutDate,
  };
}
