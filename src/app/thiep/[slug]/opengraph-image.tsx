import { getTranslations } from "next-intl/server";

import { OG_IMAGE_SIZE, renderOgImage } from "@/lib/og-image-renderer";
import { loadPublishedOgInvitation } from "@/lib/prepare-invitation-og";
import { getPreparedOgImage } from "@/lib/prepared-og-image";

export const runtime = "nodejs";
// Always resolve the current content version. The PNG itself is cached on disk;
// Next's route cache must not pin an older image after a name/date autosave.
export const dynamic = "force-dynamic";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "Thiệp cưới | Thiệp Mừng Online";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = await loadPublishedOgInvitation({ slug });
  if (!invitation?.content) {
    const t = await getTranslations({ locale: "vi", namespace: "publicInvitation.metadata" });
    return renderOgImage(null, t("siteName"));
  }

  const png = await getPreparedOgImage({ ...invitation, content: invitation.content });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
