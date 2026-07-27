const WEDDING_GUIDE_VIDEO_URL =
  "/chungdoi/videos/wedding-guide-720p.mp4";
const WEDDING_GUIDE_POSTER_URL =
  "/chungdoi/videos/wedding-guide-720p-poster.webp";

export function WeddingGuideVideo({ title }: { title: string }) {
  return (
    <video
      className="size-full bg-black object-contain"
      controls
      playsInline
      preload="metadata"
      poster={WEDDING_GUIDE_POSTER_URL}
      aria-label={title}
    >
      <source src={WEDDING_GUIDE_VIDEO_URL} type="video/mp4" />
      {title}
    </video>
  );
}
