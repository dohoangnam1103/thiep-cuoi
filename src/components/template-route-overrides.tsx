"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getVietnameseTemplateSlug } from "@/data/template-route-slugs";

const TemplateRouteOverridesContext = createContext<Record<string, string>>({});

export function TemplateRouteOverridesProvider({
  value,
  children,
}: {
  value: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <TemplateRouteOverridesContext.Provider value={value}>
      {children}
    </TemplateRouteOverridesContext.Provider>
  );
}

/** Resolves the canonical Vietnamese demo URL while preserving built-in fallbacks. */
export function useTemplateRouteSlug(): (sourceSlug: string) => string {
  const overrides = useContext(TemplateRouteOverridesContext);
  return (sourceSlug) =>
    overrides[sourceSlug]?.trim() || getVietnameseTemplateSlug(sourceSlug);
}
