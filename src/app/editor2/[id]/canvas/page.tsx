import { notFound, redirect } from "next/navigation";
import { ownInvitation } from "@/lib/dal";
import { getSession } from "@/lib/session";

/** Keep old private preview bookmarks usable without booting a second page. */
export default async function Editor2CanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !await ownInvitation(id, session.userId)) notFound();
  redirect(`/editor2/${id}`);
}
