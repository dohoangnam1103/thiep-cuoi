"use server";

import { redirect } from "next/navigation";

import { createInvitation } from "../../lib/dal";
import { getSite2Session } from "../../lib/session";

export async function createDashboardInvitation(
  formData: FormData,
): Promise<void> {
  const session = await getSite2Session();
  if (!session) {
    redirect("/dang-nhap");
  }
  const templateSlug = String(formData.get("templateSlug") ?? "");
  const invitation = await createInvitation(session.userId, templateSlug);
  redirect(`/editor/${invitation.id}`);
}
