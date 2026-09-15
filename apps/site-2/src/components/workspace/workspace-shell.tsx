import type { ReactNode } from "react";

import { WorkspaceNav } from "./workspace-nav";

export type WorkspaceUser = {
  userId: string;
  email: string | null;
};

/* Authenticated product workspace shell. No marketing nav or footer here;
 * the desktop sidebar is offset with matching content padding. */
export function WorkspaceShell({
  children,
  user,
}: {
  children: ReactNode;
  user: WorkspaceUser;
}) {
  return (
    <div className="s2-workspace md:flex md:items-start">
      <WorkspaceNav user={user} />
      <div className="min-w-0 flex-1">
        <main>{children}</main>
      </div>
    </div>
  );
}
