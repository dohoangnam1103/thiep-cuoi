# Ảnh mở đầu dọc và bụi hoa hồng

Ngày: 2026-09-06. Route: http://localhost:3000/mau-thiep/hong-van-hoa-hong/demo

## Thay đổi

- Ảnh user upload chuyển từ 16:10 sang 3:4. Khung ảnh được đặt phía trước artwork hoa, vì vậy hoa không che người trong ảnh.
- Artwork bao quanh cả bốn phía, nằm trong containing block `data-portrait-frame` có tỷ lệ 3:4, rộng tối đa 600px. Phần này không dùng vị trí tương đối với toàn trang hoặc banner tên đôi.
- `portraitFrameArtwork` là config opt-in; chỉ Hồng Vân bật. Giữ nguyên nguồn ảnh upload, alt dịch qua catalog và animation `invitation-photo-reveal`.

## Artwork và nguồn

- Công cụ: built-in ImageGen, tạo mới ngày 2026-09-06.
- Bản gốc: `/Users/namdo/.codex/generated_images/01a07512-fef0-7a12-be78-71c79b9f7bea/exec-4402bbcd-53b1-4d86-9dfe-233939a84511.png`.
- Asset khung đầu tiên trong project: `public/chungdoi/images/themes/hong-van-rose/portrait-rose-frame.webp`, 1024×1536, có alpha, 570224 bytes. Asset này đã được thay bằng bản kín bốn cạnh ở phần cập nhật bên dưới.

### Prompt đã dùng

```text
Use case: stylized-concept
Asset type: transparent decorative frame for a digital wedding invitation hero image
Primary request: Create a premium photorealistic arrangement of many deep red roses and dark green leaves forming a tall oval / portrait floral frame. The center must be completely empty and transparent so a separate vertical wedding photo can be placed inside. The flowers should feel like a dense natural rose bush surrounding the photo: layered blooms, buds, leaves, subtle stems, varied rose sizes, organic asymmetry, with fuller clusters at the upper corners, side edges, and lower corners. Keep the interior opening generous and clean for readable photo content.
Scene/backdrop: no backdrop; genuinely transparent background with clean alpha edges
Subject: dense red rose and foliage frame, portrait orientation, no vase, no ribbon, no people
Style/medium: high-end photorealistic botanical cutout, natural studio detail, realistic petals and leaves
Composition/framing: 2:3 vertical canvas; roses hug the outside perimeter in an oval frame, leave the central 45% width and 55% height open; balanced enough for a centered portrait photo
Lighting/mood: soft diffused light, rich romantic wedding mood
Color palette: burgundy, crimson, ruby red, deep forest green, subtle warm highlights
Materials/textures: detailed velvety petals, natural leaf veins, layered depth, slight soft shadow only within the artwork
Text (verbatim): none
Constraints: transparent PNG-style alpha; no text, no border line, no geometric frame, no white background, no cream background, no cropped flowers at the central opening
Avoid: flat clipart, repeated identical bouquets, sparse arrangement, horizontal banner, landscape composition, artificial symmetry, watermark
```

## Kiểm tra

- Desktop 1440px và tablet 768px: vùng hoa 600×800px; ảnh 408×544px.
- Mobile 390px: vùng hoa 358×477px; ảnh 265×353px. Mobile 320px: vùng hoa 288×384px; ảnh 213×284px.
- Đã xem ảnh chụp thực tế desktop và cả hai mobile: ảnh dọc, khung cân giữa, hoa đủ bốn phía và không nằm trước ảnh.
- Không tràn ngang ở 768/390/320px. Mở thiệp thành công và auto-scroll bật sau khi mở; tắt auto-scroll bằng control chung trước khi chụp.
- Ảnh bằng chứng: `portrait-frame-1440.png`, `portrait-frame-768.png`, `portrait-frame-390.png`, `portrait-frame-320.png`.
- Lint: 0 errors, 32 warnings có sẵn. Typecheck: pass.
- Không kiểm tra lại gửi RSVP/lời chúc hoặc editor trong thay đổi layout này. Ảnh crop theo object-cover; ảnh ngang do user tải lên sẽ cắt bớt hai cạnh khi nằm trong khung dọc.

## Khung hoa kín bốn cạnh — bản hiện tại

- Dùng artwork RGBA `portrait-rose-frame-v4.webp`, tạo từ một vòng hoa liên tục gồm các cụm hồng đỏ, nụ và lá; lỗ trung tâm trong suốt để ảnh upload nằm dưới lớp hoa. Bản gốc ImageGen: `/Users/namdo/.codex/generated_images/01a07512-fef0-7a12-be78-71c79b9f7bea/exec-bde4f488-2edd-4861-b957-b6a24f761d50.png`.
- Artwork được thu về `scale(1)` trong đúng containing block `data-portrait-frame` (tỷ lệ 3:4), thay cho scale phóng lớn trước đó. Nhờ vậy vòng hoa ôm sát ảnh hơn và không tạo khoảng đỏ rộng quanh ảnh.
- Đã kiểm tra sau khi mở thiệp ở 1440px, 768px, 390px và 320px: frame lần lượt 600×800, 600×800, 358×477 và 288×384; không có tràn ngang. Ảnh bằng chứng mới: `portrait-frame-final-1440.png`, `portrait-frame-final-768.png`, `portrait-frame-final-390.png`, `portrait-frame-final-320.png`.
- Ảnh người dùng vẫn giữ `object-cover`, lớp hoa nằm trên mép ảnh và không che vùng trung tâm cô dâu/chú rể; layout mobile dùng cùng tỉ lệ dọc để tránh biến dạng.
