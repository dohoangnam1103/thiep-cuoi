import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { WorkspaceShell } from "../../components/workspace/workspace-shell";
import { prisma } from "../../lib/prisma";
import { getSite2Session } from "../../lib/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSite2Session();
  if (!session) {
    redirect("/dang-nhap?next=/dashboard");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!user) {
    redirect("/dang-nhap");
  }
  return (
    <WorkspaceShell user={{ userId: session.userId, email: user.email }}>
      {children}
    </WorkspaceShell>
  );
}
