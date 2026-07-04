import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";

const SYSTEM_EMAIL = "system@demo.local";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export default async function AdminUsersPage() {
  await verifyAdmin();

  const users = await prisma.user.findMany({
    where: { email: { not: SYSTEM_EMAIL } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: { select: { invitations: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-foreground">Người dùng ({users.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ngày đăng ký</th>
              <th className="px-4 py-3 font-medium">Số thiệp</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  Chưa có người dùng nào.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{user.email ?? "(chưa có email)"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">{user._count.invitations}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
