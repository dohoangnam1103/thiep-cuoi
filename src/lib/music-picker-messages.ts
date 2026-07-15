import { getTranslations } from "next-intl/server";

import type { MusicPickerMessages } from "@/lib/music-picker";

export async function getMusicPickerMessages(locale: string): Promise<MusicPickerMessages> {
  const t = await getTranslations({ locale, namespace: "editor.music" });

  return {
    label: t("label"),
    dialogTitle: t("dialogTitle"),
    choose: t("choose"),
    change: t("change"),
    remove: t("remove"),
    searchPlaceholder: t("searchPlaceholder"),
    loading: t("loading"),
    empty: t("empty"),
    loadMore: t("loadMore"),
    currentMusic: t("currentMusic"),
    preview: t("preview"),
    stopPreview: t("stopPreview"),
    select: t("select"),
    close: t("close"),
    error: t("error"),
  };
}
