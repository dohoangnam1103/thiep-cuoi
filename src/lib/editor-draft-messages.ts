import { getTranslations } from "next-intl/server";

import type { DraftStatusMessages } from "@/hooks/use-form-draft";

export async function getEditorDraftMessages(locale: string): Promise<DraftStatusMessages> {
  const t = await getTranslations({ locale, namespace: "editor.draft" });

  return {
    server: t("server"),
    saving: t("saving"),
    local: t("local"),
    restored: t("restored"),
    error: t("error"),
  };
}
