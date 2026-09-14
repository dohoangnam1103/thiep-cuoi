import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "hy-uoc";
const HY = "/chungdoi/images/themes/hy-uoc";

const RED = "#990F16";
const IVORY = "#F8F0DF";
const GOLD = "#B58A4B";
const INK = "#34251F";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "hy-uoc-do",
  rendererExport: "HyUocInvitation", ceremonyRendering: "inline-all",
  heroImageCount: 1,
  catalog: {
    name: "Hy Uoc Red",
    title: "Hy Uoc Red Wedding Invitation | Thiệp Mừng Online",
    description:
      "Thiệp cưới đỏ son trên giấy ngà, chữ Hỷ khắc nét và bìa liền một mặt trượt lên khi mở.",
    category: "Traditional",
    color: "Red",
    isNew: true,
    highlights: [
      "Bìa đỏ liền một mặt, trượt lên khi mở",
      "Chữ Hỷ và mẫu đơn khắc nét vàng",
      "Hai phong bao mừng cưới mở ra thẻ QR",
    ],
  },
  theme: {
    theme: {
      background: RED,
      cardBg: RED,
      textPrimary: IVORY,
      textSecondary: "rgba(248, 240, 223, 0.78)",
      accent: GOLD,
      dividerFrom: "transparent",
      dividerTo: "rgba(181, 138, 75, 0.6)",
      buttonBg: IVORY,
      buttonText: RED,
      guestBoxBg: "rgba(248, 240, 223, 0.12)",
      guestBoxBorder: "rgba(181, 138, 75, 0.55)",
      particleColors: [GOLD, IVORY],
      particleType: "happiness",
    },
    fonts: {
      couple: "Fz Qellia",
      ampersand: null,
    },
    // Bìa liền một mặt: cả tấm trượt lên, không có con dấu để nứt.
    // Xem src/components/chungdoi-cover-variant-policy.ts.
    sealType: null,
    decorations: {
      // `flyOnOpen: false` cho tất cả — bìa trượt nguyên tấm nên không có mảnh
      // nào bay riêng (khoá bằng chungdoi-cover-variant-policy.test.ts).
      cardImages: [
        {
          src: `${HY}/paper-red.webp`,
          className: "inset-0 h-full w-full object-cover opacity-100",
          flyOnOpen: false,
        },
        {
          src: `${HY}/peony-corner-gold.webp`,
          className: "w-[130px] md:w-[210px] top-0 left-0 opacity-45",
          flyOnOpen: false,
        },
        {
          src: `${HY}/peony-corner-gold.webp`,
          className: "w-[130px] md:w-[210px] bottom-0 right-0 opacity-45 rotate-180",
          flyOnOpen: false,
        },
        {
          src: `${HY}/cover-border.svg`,
          className: "inset-[10px] h-[calc(100%-20px)] w-[calc(100%-20px)] opacity-70 md:inset-[14px] md:h-[calc(100%-28px)] md:w-[calc(100%-28px)]",
          flyOnOpen: false,
        },
      ],
    },
  },
  demoContent: {
    ...createTemplateDemoContent({
      slug,
      primaryColor: RED,
      fontFamily: "Fz Qellia",
      // zen-sand là bộ 8 ảnh .webp — khớp đúng số lượng và phần mở rộng mà
      // createTemplateDemoContent sinh ra. Bộ song-hy-red chỉ có 7 ảnh .jpg.
      gallerySlug: "zen-sand",
      music: "/chungdoi/music/song-hy-red.mp3",
    }),
    // Một ảnh hero duy nhất trong khung vòm; ảnh còn lại thuộc album.
    heroImage2: undefined,
    dressCodeColors: `${RED},${IVORY},${GOLD},${INK}`,
  },
  i18n: {
    vi: {
      name: "Hỷ Ước Đỏ",
      description:
        "Thiệp cưới đỏ son trên giấy ngà, chữ Hỷ khắc nét vàng, bìa liền một mặt trượt lên khi mở.",
    },
  },
  assets: [
    `${HY}/paper-red.webp`,
    `${HY}/paper-ivory.webp`,
    `${HY}/peony-corner-gold.webp`,
    `${HY}/peony-sprig-gold.webp`,
    `${HY}/envelope-front.webp`,
    `${HY}/cover-border.svg`,
    `${HY}/date-band-red.svg`,
    `${HY}/divider-gold.svg`,
    `${HY}/double-happiness-gold.svg`,
    `${HY}/double-happiness-red.svg`,
    `${HY}/double-happiness-cream.svg`,
    `${HY}/envelope-liner.svg`,
    `${HY}/nameplate-ivory.svg`,
    `${HY}/photo-arch-frame.svg`,
    `${HY}/qr-card-ivory.svg`,
    "/chungdoi/music/song-hy-red.mp3",
  ],
});
