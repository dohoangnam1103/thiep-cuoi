export const DEFAULT_AUTH_RETURN_PATH = "/dashboard";
export const TEMPLATE_LIST_PATH = "/mau-thiep";

export function safeAuthReturnPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_RETURN_PATH,
): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  return value;
}

export function loginHref(returnTo = TEMPLATE_LIST_PATH): string {
  return `/login?next=${encodeURIComponent(safeAuthReturnPath(returnTo, TEMPLATE_LIST_PATH))}`;
}

export function googleCompleteHref(returnTo = DEFAULT_AUTH_RETURN_PATH): string {
  return `/auth/google/complete?next=${encodeURIComponent(
    safeAuthReturnPath(returnTo, DEFAULT_AUTH_RETURN_PATH),
  )}`;
}
