"use client";

import { Check, Share2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type ShareState = "idle" | "copied" | "shared" | "error";

export function SlideshowShareButton({ path, title }: { path: string; title: string }) {
  const t = useTranslations("slideshowDashboard");
  const [state, setState] = useState<ShareState>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  function showTemporaryState(nextState: Exclude<ShareState, "idle">) {
    setState(nextState);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState("idle"), 2_200);
  }

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        showTemporaryState("shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      showTemporaryState("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showTemporaryState("error");
    }
  }

  const label = state === "copied"
    ? t("share.copied")
    : state === "shared"
      ? t("share.shared")
      : state === "error"
        ? t("share.failed")
        : t("share.action");
  const icon = state === "copied" || state === "shared"
    ? <Check size={15} aria-hidden />
    : state === "error"
      ? <TriangleAlert size={15} aria-hidden />
      : <Share2 size={15} aria-hidden />;

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
        state === "error"
          ? "border-red-300/25 bg-red-300/8 text-red-200"
          : "border-white/12 text-white/70 hover:bg-white/8 hover:text-white"
      }`}
    >
      {icon}
      <span aria-live="polite">{label}</span>
    </button>
  );
}
