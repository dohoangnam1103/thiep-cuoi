import { redirect } from "next/navigation";

import { verifyAdmin } from "@/lib/admin-dal";

export default async function AdminSettingsPage() {
  await verifyAdmin();
  redirect("/admin");
}
