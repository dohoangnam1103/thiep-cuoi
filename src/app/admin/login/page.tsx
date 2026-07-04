import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/admin-dal";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <AdminLoginForm />
    </div>
  );
}
