"use client";

import { createContext, useContext, type ReactNode } from "react";

const TemplateMobileThumbnailOverridesContext = createContext<Record<string, string>>({});

/**
 * Makes the small-screen thumbnail chosen by an admin available to public
 * template-card clients. The absence of an entry is intentionally meaningful:
 * callers preserve their existing listing image and behavior.
 */
export function TemplateMobileThumbnailOverridesProvider({
  value,
  children,
}: {
  value: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <TemplateMobileThumbnailOverridesContext.Provider value={value}>
      {children}
    </TemplateMobileThumbnailOverridesContext.Provider>
  );
}

export function useTemplateMobileThumbnailOverrides(): Record<string, string> {
  return useContext(TemplateMobileThumbnailOverridesContext);
}

export function useTemplateMobileThumbnail(slug: string): string | undefined {
  return useTemplateMobileThumbnailOverrides()[slug];
}
