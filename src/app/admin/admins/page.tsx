import { verifySuperAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import { AdminForm } from "./AdminForm";
import { deleteAdmin, toggleSuperAdmin } from "./actions";

const rootSuperAdminEmail = "dohoangnamvn@gmail.com";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function AdminsPage() {
  const { adminId } = await verifySuperAdmin();
  const admins = await prisma.admin.findMany({ orderBy: { createdAt: "desc" } });
  const superAdminCount = admins.filter((admin) => admin.isSuperAdmin).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Admin ({admins.length})</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chỉ super admin mới xem và quản lý được trang này.
        </p>
      </div>

      <AdminForm />

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const self = admin.id === adminId;
              const rootSuperAdmin = admin.email === rootSuperAdminEmail;
              const lastSuperAdmin = admin.isSuperAdmin && superAdminCount <= 1;
              const protectedAdmin = self || rootSuperAdmin || lastSuperAdmin;

              return (
                <tr key={admin.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        admin.isSuperAdmin
                          ? "rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {admin.isSuperAdmin ? "Super admin" : "Admin"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(admin.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <form action={toggleSuperAdmin.bind(null, admin.id)}>
                        <button
                          type="submit"
                          disabled={protectedAdmin && admin.isSuperAdmin}
                          className="text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                        >
                          {admin.isSuperAdmin ? "Hạ quyền" : "Nâng super"}
                        </button>
                      </form>
                      <form action={deleteAdmin.bind(null, admin.id)}>
                        <button
                          type="submit"
                          disabled={protectedAdmin}
                          className="text-sm text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                        >
                          Xoá
                        </button>
                      </form>
                      {rootSuperAdmin ? <span className="text-xs text-muted-foreground">Super admin gốc</span> : null}
                      {self ? <span className="text-xs text-muted-foreground">Tài khoản hiện tại</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
