"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Match SSR markup, then initialize forms once from browser-only storage. */
export function Editor2ClientReady({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const t = useTranslations("editor2");
  return hydrated ? children : <div className="e2-canvas-loading" aria-busy="true" role="status">{t("loading")}</div>;
}
