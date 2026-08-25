import { verifyAdmin } from "@/lib/admin-dal";
import { getCover3dEnabled } from "@/lib/cover-3d-config";
import { Cover3dToggleForm } from "./Cover3dToggleForm";

export default async function AdminSettingsPage() {
  await verifyAdmin();
  const cover3dEnabled = await getCover3dEnabled();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Các công tắc áp dụng cho toàn hệ thống, ảnh hưởng mọi thiệp đang phát hành.
        </p>
      </div>
      <Cover3dToggleForm enabled={cover3dEnabled} />
    </div>
  );
}
