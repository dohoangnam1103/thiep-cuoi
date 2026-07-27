const WEDDING_GUIDE_VIDEO_URL =
  "https://www.youtube.com/embed/_m4vMfrapg0?rel=0";

export function WeddingGuideVideo({ title }: { title: string }) {
  return (
    <iframe
      src={WEDDING_GUIDE_VIDEO_URL}
      title={title}
      className="size-full"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
