import type { ReactNode } from "react";

/* Invitation isolation shell. Public invitations render the shared template
 * renderer only: no marketing nav, no workspace chrome, no Blush shell
 * wrappers that could leak fonts, colors or spacing into the invitation. */
export default function InvitationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
