"use client";

import { useEffect, type RefObject } from "react";
import { waitForCoverPaint } from "@/lib/invitation-asset-readiness";

/** Renderer-ready is distinct from images/fonts decoded and painted. */
export function useInvitationCoverReady(
  root: RefObject<HTMLElement | null>,
  rendererReady: boolean,
  onReady?: () => void,
) {
  useEffect(() => {
    if (!rendererReady || !root.current || !onReady) return;
    const controller = new AbortController();
    const element = root.current;
    void waitForCoverPaint(element, controller.signal).then(() => {
      if (controller.signal.aborted) return;
      element.dataset.coverAssetsReady = "true";
      onReady();
    });
    return () => controller.abort();
  }, [root, rendererReady, onReady]);
}
