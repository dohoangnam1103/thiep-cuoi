import {
  getSourceTemplateSlug,
  getTemplateRouteSlugs,
  getVietnameseTemplateSlug,
  vietnameseTemplateSlugs,
} from "./template-route-slugs";

export {
  getTemplateRouteSlugs,
  getVietnameseTemplateSlug,
  vietnameseTemplateSlugs,
};

export type ChungDoiTemplate = {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  color: string;
  isNew: boolean;
  highlights: string[];
  listing: string;
  portrait: string;
  landscape: string;
  sourceUrl: string;
};

export const templates = [
  {
    "slug": "song-hy-red",
    "name": "Song Hỷ Đỏ",
    "title": "Double Happiness Red Template - Elegant Shuangxi & Arch Photo | Thiệp Mừng Online",
    "description": "Double Happiness Red wedding e-card: red sunburst, shuangxi motif, arch photo frame, happiness seal envelope. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": true,
    "highlights": [
      "Red sunburst and shuangxi as the hero focal point",
      "Arch photo frame with curved LOVE NEVER FAILS text",
      "Red envelope with shuangxi accents and happiness seal"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/song_hy_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/song_hy_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/song_hy_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/song-hy-red"
  },
  {
    "slug": "song-hy-green",
    "name": "Song Hỷ Xanh",
    "title": "Double Happiness Green Template - Forest Green Shuangxi & Arch Photo | Thiệp Mừng Online",
    "description": "Double Happiness Green wedding e-card: forest green shuangxi motif, arch photo frame, happiness seal envelope. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Green",
    "isNew": true,
    "highlights": [
      "Forest green shuangxi as the hero focal point",
      "Arch photo frame with curved LOVE NEVER FAILS text",
      "Deep green envelope with shuangxi accents and happiness seal"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/song_hy_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/song_hy_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/song_hy_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/song-hy-green"
  },
  {
    "slug": "double-dragon-red",
    "name": "Song Long Đỏ",
    "title": "Double Dragon Red Template - Traditional Elegant Wedding Invitation | Thiệp Mừng Online",
    "description": "Double Dragon Red online wedding invitation featuring classic twin dragon motifs and elegant red tones. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Traditional twin dragon motif",
      "Auspicious red tone, elegant and warm",
      "Classic ornamental design meets modern layout"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/double_dragon_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/double_dragon_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/double_dragon_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/double-dragon-red"
  },
  {
    "slug": "double-phoenix-red",
    "name": "Song Phụng Đỏ",
    "title": "Double Phoenix Red Template - Graceful Traditional Wedding Invitation | Thiệp Mừng Online",
    "description": "Double Phoenix Red online wedding invitation featuring elegant twin phoenix motifs and a classic red palette. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Unique twin phoenix motif",
      "Classic red tone, refined and elegant",
      "Symbol of harmony and happiness"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/double_phoenix_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/double_phoenix_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/double_phoenix_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/double-phoenix-red"
  },
  {
    "slug": "elegant-leaf-green",
    "name": "Thanh Diệp Xanh",
    "title": "Elegant Leaf Green Template - Modern Minimalist Wedding Invitation | Thiệp Mừng Online",
    "description": "Elegant Leaf Green online wedding invitation — clean green tones with a refined minimalist style. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Modern minimalist design",
      "Elegant green palette Open, airy layout",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/elegant_leaf_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/elegant_leaf_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/elegant_leaf_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/elegant-leaf-green"
  },
  {
    "slug": "dragon-phoenix-red",
    "name": "Long Phụng Đỏ",
    "title": "Dragon Phoenix Red Template - Classic Traditional Wedding Invitation | Thiệp Mừng Online",
    "description": "Dragon Phoenix Red online wedding invitation with classic dragon and phoenix motifs, formal red tones. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Richly detailed dragon and phoenix motif",
      "Separate engagement and reception sections",
      "Full family hierarchy support"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/dragon_phoenix_red_480.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/dragon_phoenix_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/dragon-phoenix-red"
  },
  {
    "slug": "dragon-phoenix-v3-red",
    "name": "Long Phụng V3 Đỏ",
    "title": "Dragon Phoenix V3 Red Template - Deep Red Classic Wedding Invitation | Thiệp Mừng Online",
    "description": "Dragon Phoenix V3 Red online wedding invitation featuring an arched dragon-phoenix photo frame, deep red tones, and swallow accents. Free on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": true,
    "highlights": [
      "Arched dragon-phoenix photo frame",
      "Deep crimson base with gold-bronze details",
      "Wedding timeline with swallow decorations"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/dragon_phoenix_v3_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_v3_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/dragon_phoenix_v3_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/dragon-phoenix-v3-red"
  },
  {
    "slug": "dragon-phoenix-v2-red",
    "name": "Long Phụng V2 Đỏ",
    "title": "Dragon Phoenix V2 Red Template - Classic Modern Wedding Invitation | Thiệp Mừng Online",
    "description": "Dragon Phoenix V2 Red online wedding invitation — improved version with refined dragon and phoenix artwork and a modern layout. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Upgraded version of the classic",
      "Refined dragon and phoenix artwork with finer lines",
      "Modern layout and cleaner typography"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/dragon_phoenix_v2_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_v2_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/dragon_phoenix_v2_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/dragon-phoenix-v2-red"
  },
  {
    "slug": "double-dragon-green",
    "name": "Song Long Xanh",
    "title": "Double Dragon Green Template - Elegant Nature-Inspired Wedding Invitation | Thiệp Mừng Online",
    "description": "Double Dragon Green online wedding invitation with classic twin dragon motifs and fresh green tones. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Traditional twin dragon motif Fresh, natural green color palette",
      "Elegant modern design",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/double_dragon_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/double_dragon_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/double_dragon_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/double-dragon-green"
  },
  {
    "slug": "boho-floral-green",
    "name": "Hoa Mộc Xanh",
    "title": "Boho Floral Green Template - Fresh Watercolor Wedding Invitation | Thiệp Mừng Online",
    "description": "Boho Floral Green wedding invitation with fresh green watercolor flowers on a warm cream background. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Elegant watercolor boho flowers Fresh, natural green palette Rustic, nature-close aesthetic",
      "Parallax scroll effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/boho_floral_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/boho_floral_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/boho_floral_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/boho-floral-green"
  },
  {
    "slug": "boho-floral-pink",
    "name": "Hoa Mộc Hồng",
    "title": "Boho Floral Pink Template - Romantic Watercolor Wedding Invitation | Thiệp Mừng Online",
    "description": "Boho Floral Pink wedding invitation with romantic pink watercolor flowers on a warm cream background. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Pink",
    "isNew": false,
    "highlights": [
      "Romantic watercolor boho flowers",
      "Warm dusty rose palette",
      "Creative dual tilted portrait frames"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/boho_floral_pink.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/boho_floral_pink.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/boho_floral_pink.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/boho-floral-pink"
  },
  {
    "slug": "jasmine-white",
    "name": "Mai Lan Trắng",
    "title": "Jasmine White Template - Minimalist Elegant Wedding Invitation | Thiệp Mừng Online",
    "description": "Jasmine White wedding invitation with a warm cream background and deep olive green tones — a refined, minimalist modern style. Free demo on Thiệp Mừng Online.",
    "category": "Signature",
    "color": "White",
    "isNew": false,
    "highlights": [
      "Delicate jasmine flower frame in the header",
      "Warm cream background, soft and inviting",
      "Distinctive deep olive green accent"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/jasmine_white.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/jasmine_white.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/jasmine_white.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/jasmine-white"
  },
  {
    "slug": "silk-flora-brown",
    "name": "Hoa Lụa Nâu",
    "title": "Silk Flora Brown Template - Minimal Warm Cream Wedding Invitation | Thiệp Mừng Online",
    "description": "Silk Flora Brown is a warm minimalist wedding invitation with clean typography, clear structure, and a calm modern tone. Free demo on Thiệp Mừng Online.",
    "category": "Signature",
    "color": "Brown",
    "isNew": false,
    "highlights": [
      "Warm minimalist direction with calm visual rhythm Type-led layout that keeps key details easy to scan",
      "Complete flow from ceremony to RSVP and guestbook",
      "Envelope visuals aligned with the same design language"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/silk_flora_brown.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/silk_flora_brown.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/silk_flora_brown.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/silk-flora-brown"
  },
  {
    "slug": "chateau-blue",
    "name": "Lâu Đài Lam",
    "title": "Chateau Blue Template - Classic European Royal Wedding Invitation | Thiệp Mừng Online",
    "description": "Chateau Blue wedding e-card: hand-painted European manor, banquet table, Italian cypress trees, framed mini calendar; deep blue on cream. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Blue",
    "isNew": true,
    "highlights": [
      "European manor as the hero focal point",
      "Deep blue on cream — classic, regal and elegant",
      "Banquet table and pair of birds for a warm royal mood"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/chateau_blue.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/chateau_blue.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/chateau_blue.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/chateau-blue"
  },
  {
    "slug": "brocade-flower-red",
    "name": "Gấm Hoa Đỏ",
    "title": "Brocade Flower Red Template - Ornate Red and Gold Wedding Invitation | Thiệp Mừng Online",
    "description": "Brocade Flower Red wedding e-card: ornate brocade patterns, red roses, gold pillars and a floral calendar frame; deep maroon and olive green on warm cream. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Red",
    "isNew": true,
    "highlights": [
      "Brocade pattern running through the whole card",
      "Red rose clusters in the top corners",
      "Deep maroon on warm cream, accented with olive green"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/brocade_flower_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/brocade_flower_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/brocade_flower_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/brocade-flower-red"
  },
  {
    "slug": "crystal-floral-blue",
    "name": "Hoa Thủy Tinh Lam",
    "title": "Crystal Floral Blue Template - Elegant European Blue Wedding Invitation | Thiệp Mừng Online",
    "description": "Crystal Floral Blue wedding e-card: a porcelain-blue crystal floral frame, delicate florals, warm cream background and a dedicated calendar frame; fresh porcelain blue. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Blue",
    "isNew": true,
    "highlights": [
      "Porcelain-blue crystal floral frame wrapping the couple names",
      "Soft floral bands at the top and bottom, light and graceful",
      "Scattered crystal florals with a subtle parallax effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/crystal_floral_blue.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/crystal_floral_blue.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/crystal_floral_blue.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/crystal-floral-blue"
  },
  {
    "slug": "chateau-green",
    "name": "Lâu Đài Xanh",
    "title": "Chateau Green Template - European Garden Wedding Invitation | Thiệp Mừng Online",
    "description": "Chateau Green wedding e-card: watercolor European chateau on a wildflower garden, leafy trees, fountain, forest-green palette on cream. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Green",
    "isNew": true,
    "highlights": [
      "European chateau as the hero focal point",
      "Forest green on cream — fresh and elegant",
      "Leafy trees, wildflowers and a fountain woven through every section"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/chateau_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/chateau_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/chateau_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/chateau-green"
  },
  {
    "slug": "baroque-gold",
    "name": "Hoàng Gia Vàng",
    "title": "Baroque Gold Template - Ornate Gold Frame European Wedding Invitation | Thiệp Mừng Online",
    "description": "Baroque Gold wedding e-card: ornate gilded frame, Roman pillars, damask ivory background and a gold framed calendar; gold-bronze with olive. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Gold",
    "isNew": true,
    "highlights": [
      "Ornate gilded frame wrapping the couple names A pair of gilded",
      "Roman pillars for a palatial feel",
      "Damask ivory background with white-and-gold florals Gold-bronze paired with olive — classic and warm"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/baroque_gold.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/baroque_gold.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/baroque_gold.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/baroque-gold"
  },
  {
    "slug": "qasr-green",
    "name": "Thành Cung Xanh",
    "title": "Qasr Green Template - Domed Palace Garden Wedding Invitation | Thiệp Mừng Online",
    "description": "Qasr Green wedding e-card: a domed palace and a couple in sage-green attire on warm cream, white-rose and eucalyptus florals, a heart-marked framed calendar, and full Arabic RTL support. Free to create on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Green",
    "isNew": true,
    "highlights": [
      "Domed palace and a sage-green couple as the centerpiece Sage-green palette with white roses and eucalyptus, refined",
      "Delicate golden-line dividers separating each section",
      "Framed mini calendar with the wedding day marked by a heart Wedding-day timeline with food, cake and ring medallions"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/qasr_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/qasr_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/qasr_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/qasr-green"
  },
  {
    "slug": "qasr-gold",
    "name": "Thành Cung Vàng",
    "title": "Qasr Gold Template - Desert Oasis Domed Palace Wedding Invitation | Thiệp Mừng Online",
    "description": "Qasr Gold wedding e-card: a domed palace amid a desert oasis, date palms, a couple in Gulf attire on warm sand-cream, a heart-marked framed calendar, and full Arabic RTL support. Free to create on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Gold",
    "isNew": true,
    "highlights": [
      "Golden domed palace and a Gulf-attired couple as the centerpiece Sand-gold palette with white florals and date palms, warm and regal",
      "Delicate golden-line dividers separating each section",
      "Framed mini calendar with the wedding day marked by a heart Wedding-day timeline with toast cup, rings and lantern medallions"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/qasr_gold.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/qasr_gold.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/qasr_gold.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/qasr-gold"
  },
  {
    "slug": "glass-garden-green",
    "name": "Vườn Kính Xanh",
    "title": "Glass Garden Green Template - Soft Floral Garden Wedding Invitation | Thiệp Mừng Online",
    "description": "Glass Garden Green wedding e-card: a soft floral background fills the card, the names sit in a clear oval glass frame, and a large glass panel wraps the content in garden-green over white blooms. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Soft watercolor floral background filling the whole card",
      "The couple's names inside a clear oval glass frame A large glass panel wrapping the content, florals showing through",
      "Fresh garden-green palette over white blooms Rounded-frame mini calendar with the wedding day marked by a heart Wedding-day timeline with welcome, cake and dish medallions"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/glass_garden_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/glass_garden_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/glass_garden_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/glass-garden-green"
  },
  {
    "slug": "royal-red",
    "name": "Hoàng Kim Đỏ",
    "title": "Royal Red Template - Luxurious Royal Wedding Invitation | Thiệp Mừng Online",
    "description": "Royal Red wedding invitation with deep red background and stunning gold accents. A regal, high-end style. Free to create on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Deep crimson background — rich and commanding",
      "Stunning gold accent details throughout",
      "Gold floral frame in the header Regal, royal aesthetic"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/royal_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/royal_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/royal_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/royal-red"
  },
  {
    "slug": "maroon-love",
    "name": "Tình Yêu Đỏ Đô",
    "title": "Maroon Love Template - Đỏ Đô Sang Trọng | Thiệp Mừng Online",
    "description": "Thiệp cưới Maroon Love nền đỏ đô đậm, chữ serif kem và điểm nhấn hồng. Phong cách lãng mạn, sang trọng. Tạo miễn phí trên Thiệp Mừng Online.",
    "category": "Modern",
    "color": "Red",
    "isNew": true,
    "highlights": [
      "Nền đỏ đô đậm — ấm và sang trọng",
      "Chữ serif màu kem thanh lịch",
      "Điểm nhấn hồng phấn lãng mạn"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/maroon_love.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/maroon_love.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/maroon_love.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/royal-red"
  },
  {
    "slug": "nhat-binh-red",
    "name": "Nhật Bình Đỏ",
    "title": "Nhat Binh Red Template - Cream Paper, Vermillion Accents, Brown Envelope | Thiệp Mừng Online",
    "description": "Nhat Binh Red wedding invitation: warm cream paper, brown and vermillion type, parallax clouds and florals; brown envelope, cream card, double-happiness seal. Free on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Cream paper with brown and vermillion type Clouds, florals, lantern; scroll parallax",
      "Brown envelope, cream card, double-happiness seal",
      "Full online invitation features"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/nhat_binh_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/nhat_binh_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/nhat_binh_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/nhat-binh-red"
  },
  {
    "slug": "hoa-tinh-red",
    "name": "Họa Tình Đỏ",
    "title": "Love Art Red Wedding Invitation Template - Romantic Comic-Art Style | Thiệp Mừng Online",
    "description": "Love Art Red online wedding invitation: comic-art style, red heart florals, handwritten fonts, unique tilted couple photo frames. Free to create on Thiệp Mừng Online.",
    "category": "Modern",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Tilted couple photo frames with chibi cartoon accents",
      "Bhaijaan typography Hand-drawn red spiral notebook calendar with heart-marked wedding day",
      "Illustrated wedding-day timeline with couple figures Deep-red envelope with 囍 seal and cascading gold happiness characters"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/hoa_tinh_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/hoa_tinh_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/hoa_tinh_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/hoa-tinh-red"
  },
  {
    "slug": "co-ba-red",
    "name": "Cô Ba Đỏ",
    "title": "Co Ba Red Template - Vietnamese Vintage Wedding Invitation | Thiệp Mừng Online",
    "description": "Co Ba Red wedding e-card: warm aged-paper background, brown type with a blue accent, Ben Thanh Market illustration, and a matching brown envelope. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Modern",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Market and hand-drawn couple illustration in the header",
      "Soft aged-paper background, warm brown type with a blue accent",
      "Clean ceremony layout that is easy to use on mobile"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/co_ba_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/co_ba_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/co_ba_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/co-ba-red"
  },
  {
    "slug": "royal-blue",
    "name": "Hoàng Kim Lam",
    "title": "Royal Blue Template - Luxurious Royal Wedding Invitation | Thiệp Mừng Online",
    "description": "Royal Blue wedding invitation with deep navy background and stunning gold accents. A regal, high-end style. Free to create on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Blue",
    "isNew": false,
    "highlights": [
      "Deep navy background — mysterious and sophisticated",
      "Stunning gold accent details throughout",
      "Gold floral frame in the header Regal, royal aesthetic"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/royal_blue.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/royal_blue.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/royal_blue.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/royal-blue"
  },
  {
    "slug": "royal-green",
    "name": "Hoàng Kim Xanh",
    "title": "Royal Green Template - Luxurious Royal Wedding Invitation | Thiệp Mừng Online",
    "description": "Royal Green wedding invitation with deep forest green background and stunning gold accents. A regal, high-end style. Free to create on Thiệp Mừng Online.",
    "category": "Royal",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Deep forest green background — rich and natural",
      "Stunning gold accent details throughout",
      "Gold floral frame in the header"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/royal_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/royal_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/royal_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/royal-green"
  },
  {
    "slug": "spring-garden-green",
    "name": "Vườn Xuân Xanh",
    "title": "Spring Garden Green Template - Fresh Nature Wedding Invitation | Thiệp Mừng Online",
    "description": "Spring Garden Green online wedding invitation with hand-drawn leaf motifs and refreshing green tones. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Hand-illustrated leaf motifs Fresh, serene green palette Nature-inspired, refined aesthetic",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/spring_garden_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/spring_garden_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/spring_garden_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/spring-garden-green"
  },
  {
    "slug": "chibi-red",
    "name": "Chibi Đỏ",
    "title": "Chibi Red Template - Cute Illustrated Wedding Invitation | Thiệp Mừng Online",
    "description": "Chibi Red online wedding invitation featuring adorable illustrated couple artwork and a playful design. Free to create on Thiệp Mừng Online.",
    "category": "Modern",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Adorable chibi couple illustration",
      "Playful illustrated style throughout",
      "Balance of fun and dignity"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/chibi_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/chibi_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/chibi_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/chibi-red"
  },
  {
    "slug": "boho-floral-brown",
    "name": "Hoa Mộc Nâu",
    "title": "Boho Floral Brown Template - Rustic Earthy Wedding Invitation | Thiệp Mừng Online",
    "description": "Boho Floral Brown wedding invitation with rustic brown watercolor flowers on a warm cream background. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Brown",
    "isNew": false,
    "highlights": [
      "Rustic watercolor boho flowers",
      "Warm earthy brown tones Vintage, organic aesthetic",
      "Parallax scroll effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/boho_floral_brown.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/boho_floral_brown.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/boho_floral_brown.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/boho-floral-brown"
  },
  {
    "slug": "spring-garden-red",
    "name": "Vườn Xuân Đỏ",
    "title": "Spring Garden Red Template - Warm Nature Wedding Invitation | Thiệp Mừng Online",
    "description": "Spring Garden Red online wedding invitation with floral nature motifs and warm red tones. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Floral and nature-inspired motifs",
      "Warm red palette, lively and vibrant Romantic, approachable design",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/spring_garden_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/spring_garden_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/spring_garden_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/spring-garden-red"
  },
  {
    "slug": "dragon-phoenix-green",
    "name": "Long Phụng Xanh",
    "title": "Dragon Phoenix Green Template - Classic Refined Wedding Invitation | Thiệp Mừng Online",
    "description": "Dragon Phoenix Green online wedding invitation with dragon and phoenix motifs and elegant green tones. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Classic dragon and phoenix motif Elegant, refreshing green tones",
      "Separate engagement ceremony section",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/dragon_phoenix_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/dragon_phoenix_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/dragon-phoenix-green"
  },
  {
    "slug": "spring-garden-blue",
    "name": "Vườn Xuân Lam",
    "title": "Spring Garden Blue Template - Refined Elegant Wedding Invitation | Thiệp Mừng Online",
    "description": "Spring Garden Blue online wedding invitation with floral nature motifs and soft blue tones. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Blue",
    "isNew": false,
    "highlights": [
      "Floral and nature-inspired motifs Soft, cool blue palette Gentle, refined aesthetic",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/spring_garden_blue.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/spring_garden_blue.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/spring_garden_blue.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/spring-garden-blue"
  },
  {
    "slug": "minimalism-red",
    "name": "Tối Giản Đỏ",
    "title": "Minimalism Red Template - Modern Minimalist Wedding Invitation | Thiệp Mừng Online",
    "description": "Minimalist style wedding invitation with a clean white background and elegant red accents. Refined, contemporary, and free to create on Thiệp Mừng Online.",
    "category": "Modern",
    "color": "Red",
    "isNew": false,
    "highlights": [
      "Minimalist, contemporary design",
      "Clean white background, refined and airy",
      "Red as a deliberate accent color"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/minimalism_red.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/minimalism_red.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/minimalism_red.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/minimalism-red"
  },
  {
    "slug": "cherry-blossom-pink",
    "name": "Anh Đào Hồng",
    "title": "Cherry Blossom Pink Template - Romantic Floral Wedding Invitation | Thiệp Mừng Online",
    "description": "Cherry Blossom Pink online wedding invitation with soft pink sakura petals and a romantic modern style. Free to create on Thiệp Mừng Online.",
    "category": "Floral",
    "color": "Pink",
    "isNew": false,
    "highlights": [
      "Falling cherry blossom petal effect",
      "Soft pastel pink, romantic and feminine",
      "Separate engagement ceremony section"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/cherry_blossom_pink.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/cherry_blossom_pink.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/cherry_blossom_pink.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/cherry-blossom-pink"
  },
  {
    "slug": "double-phoenix-green",
    "name": "Song Phụng Xanh",
    "title": "Double Phoenix Green Template - Graceful Nature Wedding Invitation | Thiệp Mừng Online",
    "description": "Double Phoenix Green online wedding invitation with twin phoenix motifs and fresh green tones. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Green",
    "isNew": false,
    "highlights": [
      "Graceful twin phoenix motif Cool, natural green palette",
      "Symbol of harmony and happiness",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/double_phoenix_green.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/double_phoenix_green.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/double_phoenix_green.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/double-phoenix-green"
  },
  {
    "slug": "double-dragon-blue",
    "name": "Song Long Lam",
    "title": "Double Dragon Blue Template - Romantic Gentle Wedding Invitation | Thiệp Mừng Online",
    "description": "Double Dragon Blue online wedding invitation with twin dragon motifs and soft blue tones. Free to create, 3-day trial on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Blue",
    "isNew": false,
    "highlights": [
      "Traditional twin dragon motif",
      "Romantic soft blue color palette",
      "Balance of tradition and modern elegance"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/double_dragon_blue.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/double_dragon_blue.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/double_dragon_blue.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/double-dragon-blue"
  },
  {
    "slug": "dragon-phoenix-blue",
    "name": "Long Phụng Lam",
    "title": "Dragon Phoenix Blue Template - Classic Luxurious Wedding Invitation | Thiệp Mừng Online",
    "description": "Dragon Phoenix Blue online wedding invitation with classic dragon and phoenix motifs and elegant blue tones. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Blue",
    "isNew": false,
    "highlights": [
      "Classic dragon and phoenix motif",
      "Luxurious deep blue palette",
      "Separate engagement ceremony section"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/dragon_phoenix_blue.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_blue.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/dragon_phoenix_blue.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/dragon-phoenix-blue"
  },
  {
    "slug": "dragon-phoenix-black",
    "name": "Long Phụng Đen",
    "title": "Dragon Phoenix Black Template - Mysterious Luxurious Wedding Invitation | Thiệp Mừng Online",
    "description": "Dragon Phoenix Black online wedding invitation with dragon and phoenix motifs on a deep black background. Free to create on Thiệp Mừng Online.",
    "category": "Traditional",
    "color": "Black",
    "isNew": false,
    "highlights": [
      "Dramatic black ground, uniquely bold",
      "Golden dragon and phoenix motif Luxurious, statement-making style",
      "Animated envelope opening effect"
    ],
    "listing": "/chungdoi/images/template-previews/en/listing/dragon_phoenix_black.webp",
    "portrait": "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_black.webp",
    "landscape": "/chungdoi/images/template-previews/en/landscape/dragon_phoenix_black.webp",
    "sourceUrl": "https://chungdoi.com/en/templates/dragon-phoenix-black"
  }
] satisfies ChungDoiTemplate[];

// Templates with complete dedicated renderers. This registry drives the public listing,
// canonical demo sitemap entries, and editor choices; incomplete templates stay excluded.
export const completedTemplateSlugs = new Set<string>([
  "double-phoenix-red",
  "double-phoenix-green",
  "song-hy-red",
  "song-hy-green",
  "nhat-binh-red",
  "co-ba-red",
  "dragon-phoenix-red",
  "dragon-phoenix-green",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "double-dragon-red",
  "double-dragon-blue",
  "double-dragon-green",
  "royal-red",
  "maroon-love",
  "royal-blue",
  "royal-green",
  "spring-garden-green",
  "spring-garden-red",
  "spring-garden-blue",
  "boho-floral-green",
  "boho-floral-pink",
  "boho-floral-brown",
  "chateau-blue",
  "chateau-green",
  "qasr-green",
  "qasr-gold",
  "dragon-phoenix-v2-red",
  "dragon-phoenix-v3-red",
  "elegant-leaf-green",
  "jasmine-white",
  "silk-flora-brown",
  "brocade-flower-red",
  "crystal-floral-blue",
  "baroque-gold",
  "glass-garden-green",
  "hoa-tinh-red",
  "chibi-red",
  "minimalism-red",
  "cherry-blossom-pink",
]);

export const completedTemplates = templates.filter((template) => completedTemplateSlugs.has(template.slug));

export const templateCategories = ["All", ...Array.from(new Set(completedTemplates.map((template) => template.category)))] as const;
export const templateColors = ["All", ...Array.from(new Set(completedTemplates.map((template) => template.color)))] as const;

export function findTemplateByRouteSlug(routeSlug: string) {
  const sourceSlug = getSourceTemplateSlug(routeSlug);
  if (!sourceSlug) return undefined;
  return templates.find((template) => template.slug === sourceSlug);
}

export type ChungDoiDemoTheme = {
  primaryColor: string;
  backgroundImage: string;
  motifs: string[];
  coupleNameFont: string;
  headingFont: string;
};

export type ChungDoiDemoFamily = {
  honorific: string;
  parentA: string;
  parentB: string;
  address: string;
};

export type ChungDoiDemoScheduleItem = {
  time: string;
  label: string;
};

export type ChungDoiDemoWish = {
  name: string;
  time: string;
  text: string;
};

export type ChungDoiDemoContent = {
  theme: ChungDoiDemoTheme;
  couple: {
    groomName: string;
    brideName: string;
    weddingDate: string;
    ceremonyTime: string;
    receptionTime: string;
  };
  families: {
    groomFamily: ChungDoiDemoFamily;
    brideFamily: ChungDoiDemoFamily;
  };
  venue: {
    ceremonyName: string;
    receptionName: string;
    address: string;
    mapEmbedUrl: string;
  };
  schedule: ChungDoiDemoScheduleItem[];
  wishes: ChungDoiDemoWish[];
  musicUrl: string;
};
