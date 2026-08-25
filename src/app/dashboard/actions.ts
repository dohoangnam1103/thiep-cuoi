"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { templates } from "@/data/chungdoi";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { loginReasonHref, startInvitationHref } from "@/lib/auth-redirects";
import { zodiacTemplatePrimaryColor } from "@/lib/zodiac";

const DEFAULT_TEMPLATE_ID = "song-hy-red";

function readName(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 24) : "";
}

/**
 * Chokepoint duy nhất tạo thiệp cho khách: mọi CTA "Tạo thiệp" / "Dùng mẫu này"
 * đều POST vào đây. Trước đây action tự mint một User rỗng (`getOrCreateUserId`)
 * nên khách chưa đăng nhập vẫn vào được editor, và thiệp đó chỉ còn cookie 7
 * ngày làm chìa khoá. Giờ phải là account thật; ý định tạo (mẫu + tên) được gói
 * vào `next` để một cú đăng nhập Google là vào thẳng editor, không mất gì.
 */
export async function createInvitation(formData?: FormData): Promise<void> {
  const requested = formData?.get("templateId");
  const templateId =
    typeof requested === "string" && templates.some((t) => t.slug === requested)
      ? requested
      : DEFAULT_TEMPLATE_ID;

  const groomShortName = readName(formData?.get("groomShortName"));
  const brideShortName = readName(formData?.get("brideShortName"));

  const userId = await getAccountSessionUserId();
  if (!userId) {
    redirect(
      loginReasonHref(
        "create",
        startInvitationHref({ templateId, groomShortName, brideShortName }),
      ),
    );
  }

  const primaryColor = zodiacTemplatePrimaryColor(templateId);

  const invitation = await prisma.invitation.create({
    data: {
      userId,
      templateId,
      status: "draft",
      content: {
        create: {
          groomShortName,
          brideShortName,
          ...(primaryColor ? { primaryColor } : {}),
        },
      },
    },
  });
  redirect(`/editor/${invitation.id}`);
}
