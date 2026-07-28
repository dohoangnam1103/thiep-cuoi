# Audit decor vượt mép thiệp chưa mở

Ngày audit: 2026-07-28.

## Cách kiểm tra

Mỗi route trong `vietnameseTemplateSlugs` được mở trực tiếp trên
`https://chungdoi.com/vi/mau-thiep/<route>/demo` ở desktop. Với từng decor
`position: absolute` có bounding box vượt khỏi khung thiệp, audit đi ngược cây
DOM để kiểm tra có lớp tổ tiên `overflow-hidden`/`overflow-clip` hay không.

## Kết quả

### Cho phép decor vượt mép

- `glass-garden-green` (`vuonkinh-xanh`): ba cụm hoa đều vượt khỏi khung và
  không có tổ tiên clip.

### Clip decor tại mép thiệp

- `song-hy-red`, `song-hy-green`
- `double-dragon-red`, `double-dragon-green`, `double-dragon-blue`
- `double-phoenix-red`, `double-phoenix-green`
- `dragon-phoenix-red`, `dragon-phoenix-green`, `dragon-phoenix-blue`,
  `dragon-phoenix-black`, `dragon-phoenix-v2-red`, `dragon-phoenix-v3-red`
- `elegant-leaf-green`, `boho-floral-green`, `boho-floral-pink`,
  `boho-floral-brown`, `silk-flora-brown`, `brocade-flower-red`,
  `crystal-floral-blue`
- `spring-garden-green`, `spring-garden-red`, `spring-garden-blue`
- `chateau-blue`, `chateau-green`, `baroque-gold`, `qasr-green`, `qasr-gold`
- `royal-red`, `royal-blue`, `royal-green`, `nhat-binh-red`, `co-ba-red`,
  `minimalism-red`, `cherry-blossom-pink`
- `jasmine-white`, `hoa-tinh-red`, `chibi-red`: không có decor nào thực sự
  vượt khung ở trạng thái audit, nhưng policy vẫn là clip để giữ fallback an
  toàn nếu asset/vị trí thay đổi.

### Không có trang nguồn

- `maroon-love`: Chung Đôi trả 404. Policy dùng fallback `clip` cho đến khi có
  nguồn tham chiếu khác.

## Quy tắc triển khai

`envelopeDecorOverflowForTemplate()` mặc định trả `clip`; allowlist `visible`
chỉ chứa `glass-garden-green`. Nhờ vậy template mới không vô tình để lộ decor
ngoài thiệp trước khi được audit.
