"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getDemoFontFamily } from "@/lib/demo-font-default";
import { DEFAULT_INVITATION_MUSIC, DEFAULT_INVITATION_MUSIC_ARTIST, DEFAULT_INVITATION_MUSIC_TITLE } from "@/lib/invitation-music";
import { prisma } from "@/lib/prisma";
import { templates } from "@/data/chungdoi";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { loginReasonHref, startInvitationHref } from "@/lib/auth-redirects";
import { zodiacTemplatePrimaryColor } from "@/lib/zodiac";
import { editor2DefaultFields } from "@/lib/editor2-defaults";
import { editor2StarterSchedule } from "@/lib/editor2-starter";

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
  const fontFamily = await getDemoFontFamily(prisma, templateId);
  const sample = await getTranslations("editor2.samples");
  const t = await getTranslations("editor2");
  const defaults = editor2DefaultFields(key => sample(key));
  // Every new card starts with an editable timeline instead of an empty block.
  const schedule = editor2StarterSchedule(templateId, [
    { time: "17:30", label: t("starterSchedule.welcome") },
    { time: "18:00", label: t("starterSchedule.ceremony") },
    { time: "18:30", label: t("starterSchedule.reception") },
    { time: "20:30", label: t("starterSchedule.photos") },
  ]);

  const invitation = await prisma.invitation.create({
    data: {
      userId,
      templateId,
      status: "draft",
      content: {
        create: {
          ...defaults,
          fontFamily,
          groomShortName,
          brideShortName,
          music: DEFAULT_INVITATION_MUSIC,
          musicTitle: DEFAULT_INVITATION_MUSIC_TITLE,
          musicArtist: DEFAULT_INVITATION_MUSIC_ARTIST,
          ...(primaryColor ? { primaryColor } : {}),
        },
      },
      schedule: { create: schedule.map((item, sortOrder) => ({ ...item, sortOrder })) },
    },
  });
  redirect(`/editor/${invitation.id}`);
}
