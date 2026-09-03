"use client";

import { Activity, createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { createAssetWarmer } from "@/lib/invitation-asset-readiness";

const DetailVisibleContext = createContext(true);
export function useInvitationDetailVisible() {
  return useContext(DetailVisibleContext);
}

/**
 * Hidden Activity loads the selected renderer and its images at background
 * priority without running effects. Reveal reuses the same DOM, not a second
 * copy. The boundary does not exist at all until the cover has been painted (or
 * the guest explicitly asks to open), so detail cannot compete with the cover.
 */
export function PreparedInvitationDetail({ prepare, visible, children }: {
  prepare: boolean;
  visible: boolean;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!prepare || visible || !root.current) return;
    const element = root.current;
    const controller = new AbortController();
    const warm = createAssetWarmer(controller.signal);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scan = () => {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!controller.signal.aborted) void warm(element);
      }, 0);
    };
    // Dynamic templates commit later; a ref/effect inside a hidden Activity
    // would not attach yet. Observe from the active parent instead.
    const observer = new MutationObserver(scan);
    observer.observe(element, { childList: true, subtree: true });
    scan();
    return () => {
      controller.abort();
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [prepare, visible]);

  return (
    <div ref={root} className="contents" data-invitation-detail={visible ? "visible" : prepare ? "preparing" : "waiting"}>
      {prepare || visible ? (
        <DetailVisibleContext value={visible}>
          <Activity mode={visible ? "visible" : "hidden"}>
            {children}
          </Activity>
        </DetailVisibleContext>
      ) : null}
    </div>
  );
}
