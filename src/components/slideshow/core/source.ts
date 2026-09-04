import { z } from "zod";

export const slideshowSourceMediaSchema = z.object({
  id: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1),
  alt: z.string().trim().default("Khoảnh khắc cưới"),
  kind: z.enum(["image", "video"]).default("image"),
});

export const weddingSlideshowSourceSchema = z.object({
  couple: z.object({
    brideName: z.string().trim().min(1).max(100),
    groomName: z.string().trim().min(1).max(100),
  }),
  event: z.object({
    dateLabel: z.string().trim().max(120).default("Ngày cưới đang cập nhật"),
    locationLabel: z.string().trim().max(160).default("Địa điểm đang cập nhật"),
  }).default({
    dateLabel: "Ngày cưới đang cập nhật",
    locationLabel: "Địa điểm đang cập nhật",
  }),
  story: z.object({
    opening: z.string().trim().max(300).default("Từ một lời chào rất khẽ"),
    journey: z.string().trim().max(500).default("Đến một lời hứa trọn đời."),
    closing: z.string().trim().max(500).default("Cảm ơn bạn đã ở đây và chứng kiến khoảnh khắc này."),
  }).default({
    opening: "Từ một lời chào rất khẽ",
    journey: "Đến một lời hứa trọn đời.",
    closing: "Cảm ơn bạn đã ở đây và chứng kiến khoảnh khắc này.",
  }),
  photos: z.array(slideshowSourceMediaSchema).min(1).max(80),
});

export type WeddingSlideshowSource = z.infer<typeof weddingSlideshowSourceSchema>;
export type SlideshowSourceMedia = z.infer<typeof slideshowSourceMediaSchema>;

export const demoWeddingSlideshowSource = weddingSlideshowSourceSchema.parse({
  couple: {
    brideName: "Minh Anh",
    groomName: "Hoàng Nam",
  },
  event: {
    dateLabel: "18 · 10 · 2026",
    locationLabel: "Sài Gòn",
  },
  story: {
    opening: "Từ một lời chào rất khẽ",
    journey: "Đến một lời hứa trọn đời.",
    closing: "Cảm ơn bạn đã ở đây và chứng kiến khoảnh khắc này.",
  },
  photos: [
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-3.webp",
      alt: "Minh Anh và Hoàng Nam trong khung hình cưới mở đầu",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-1.webp",
      alt: "Chân dung cưới của Minh Anh và Hoàng Nam",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-4.webp",
      alt: "Minh Anh và Hoàng Nam trong khoảnh khắc editorial",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-2.webp",
      alt: "Khoảnh khắc gần gũi của Minh Anh và Hoàng Nam",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-5.webp",
      alt: "Ảnh cưới đen trắng của Minh Anh và Hoàng Nam",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-6.webp",
      alt: "Minh Anh và Hoàng Nam giữa không gian cưới tối giản",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-7.webp",
      alt: "Chân dung ngày cưới của Minh Anh và Hoàng Nam",
    },
    {
      url: "/chungdoi/images/gallery/editorial-noir/photo-8.webp",
      alt: "Khoảnh khắc chuyển động cuối ngày cưới",
    },
  ],
});

export function photoAt(source: WeddingSlideshowSource, index: number): SlideshowSourceMedia {
  return source.photos[index % source.photos.length];
}
