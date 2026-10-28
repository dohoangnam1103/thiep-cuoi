"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { GiftEnvelope } from "@/components/chungdoi-tpl-shared";
import { InvitationEditingContext } from "@/components/invitation-editing-context";

/** A private configuration slot for templates that gate their native gift on bank data. */
export function Editor2GiftPlaceholder({ root, enabled, templateId, heading, openLabel, accent }: {
  root: RefObject<HTMLDivElement | null>; enabled: boolean; templateId: string;
  heading: string; openLabel: string; accent: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const container = root.current;
    if (!enabled || !container) return;
    let slot: HTMLElement | null = null;
    const synchronize = () => {
      const renderer = container.querySelector<HTMLElement>("[data-template-renderer]");
      if (!renderer) return;
      const nativeGift = Array.from(renderer.querySelectorAll('[data-testid="gift-envelope"], [data-testid="gift-flip-card"], [data-testid="gift-qr-grid"]'))
        .some(element => !element.closest("[data-editor2-gift-placeholder]"));
      if (nativeGift) {
        if (slot) { slot.remove(); slot = null; setTarget(null); }
        return;
      }
      const footer = renderer.querySelector<HTMLElement>("[data-template-footer], [data-art-footer]");
      const host = footer?.parentElement ?? renderer;
      if (slot?.isConnected && slot.parentElement === host && (!footer || slot.nextSibling === footer)) return;
      if (!slot) {
        slot = document.createElement("section");
        slot.dataset.editor2GiftPlaceholder = "true";
        slot.className = "e2-default-gift";
      }
      if (footer) host.insertBefore(slot, footer);
      else host.append(slot);
      setTarget(slot);
    };
    const observer = new MutationObserver(synchronize);
    observer.observe(container, { childList: true, subtree: true });
    const frame = requestAnimationFrame(synchronize);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); slot?.remove(); };
  }, [enabled, root, templateId]);

  if (!enabled || !target) return null;
  return createPortal(<InvitationEditingContext value>
    <GiftEnvelope templateSlug={templateId} banks={[]} heading={heading} openLabel={openLabel}
      accent={accent} dark="currentColor" labelColor="currentColor" cardBg="#fffdfa" />
  </InvitationEditingContext>, target);
}
