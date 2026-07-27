"use client";

import { createContext, useContext, type ReactNode } from "react";

const TemplateNameOverridesContext = createContext<Record<string, string>>({});

/**
 * Makes admin-renamed template names available to the client components that
 * render template cards. Mounted by the public pages that list templates.
 */
export function TemplateNameOverridesProvider({
  value,
  children,
}: {
  value: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <TemplateNameOverridesContext.Provider value={value}>
      {children}
    </TemplateNameOverridesContext.Provider>
  );
}

/**
 * Returns a resolver that prefers the admin rename and otherwise keeps whatever
 * name the caller already computed (usually the localized catalog entry).
 */
export function useTemplateName(): (slug: string, fallback: string) => string {
  const overrides = useContext(TemplateNameOverridesContext);
  return (slug, fallback) => overrides[slug]?.trim() || fallback;
}
