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

/**
 * Nơi tiếp tục tạo thiệp sau khi đăng nhập. Ý định tạo thiệp nằm trong POST
 * body của form CTA nên không thể sống qua vòng OAuth; route này nhận lại ý
 * định đó dưới dạng query để một cú đăng nhập là vào thẳng editor, không phải
 * bấm lại nút.
 */
export const START_INVITATION_PATH = "/editor/bat-dau";

export type StartInvitationIntent = {
  templateId?: string;
  groomShortName?: string;
  brideShortName?: string;
};

export function startInvitationHref(intent: StartInvitationIntent = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(intent)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${START_INVITATION_PATH}?${query}` : START_INVITATION_PATH;
}

/** Why a visitor was sent to /login, so the form can explain itself. */
export type AuthReason = "checkout" | "create" | "slideshow";

export function loginReasonHref(reason: AuthReason, returnTo: string): string {
  return `/login?reason=${reason}&next=${encodeURIComponent(
    safeAuthReturnPath(returnTo),
  )}`;
}

export function googleCompleteHref(returnTo = DEFAULT_AUTH_RETURN_PATH): string {
  return `/auth/google/complete?next=${encodeURIComponent(
    safeAuthReturnPath(returnTo, DEFAULT_AUTH_RETURN_PATH),
  )}`;
}
