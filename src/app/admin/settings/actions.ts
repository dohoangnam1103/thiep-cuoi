"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { verifyAdmin } from "@/lib/admin-dal";
import {
  COVER_3D_CACHE_TAG,
  updateCover3dEnabled,
} from "@/lib/cover-3d-config";

export type Cover3dState = { error?: string; ok?: boolean; enabled?: boolean } | undefined;

// Checkbox không được tick thì không có mặt trong FormData, nên "thiếu key" phải
// hiểu là tắt chứ không phải dữ liệu sai.
const cover3dSchema = z.object({
  enabled: z.enum(["on", "off"]),
});

export async function updateCover3dAction(
  _prev: Cover3dState,
  formData: FormData,
): Promise<Cover3dState> {
  await verifyAdmin();

  const parsed = cover3dSchema.safeParse({
    enabled: formData.get("enabled") ?? "off",
  });
  if (!parsed.success) {
    return { error: "Giá trị công tắc không hợp lệ" };
  }

  const enabled = parsed.data.enabled === "on";
  await updateCover3dEnabled(enabled);
  updateTag(COVER_3D_CACHE_TAG);

  revalidatePath("/admin/settings");
  // Công tắc đổi cách MỌI trang thiệp render bìa, nên phải xoá cache cả cây route
  // chứ không chỉ trang admin: trang demo mẫu thiệp được prerender theo
  // generateStaticParams, giữ cache là bìa cũ vẫn được phục vụ sau khi tắt/bật.
  revalidatePath("/", "layout");

  return { ok: true, enabled };
}
