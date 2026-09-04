# Song Hỷ — nhiều lễ

## Tham chiếu

- URL: `https://chungdoi.com/i/thebao-ngocanh-mtmhsds3?open=1`
- Kiểm tra: 2026-09-04, trạng thái thiệp đã mở.
- Desktop: viewport trình duyệt rộng, kiểm tra trực tiếp section lễ cưới và phần kế tiếp.

## Kết quả quan sát

- Hai lễ nằm liên tiếp trong cùng section `THÔNG TIN LỄ CƯỚI`.
- Mỗi lễ lặp lại cùng cấu trúc: tiêu đề, giờ, hàng thứ/ngày/tháng, năm và ngày âm.
- Thông tin gia đình và tên cô dâu/chú rể chỉ xuất hiện một lần phía trên danh sách lễ.
- Sau lễ cuối cùng là `THÔNG TIN TIỆC CƯỚI`.
- Không có card lễ generic và không có nội dung lễ nào sau footer.

## Thay đổi local

- `song-hy-red` và `song-hy-green` render toàn bộ `content.ceremonies` ngay tại section lễ.
- Hai template này không còn dùng `AdditionalCeremonies` nằm ngoài renderer template.
- Mỗi lễ dùng ngày và giờ riêng; không dùng ngày tiệc cưới thay cho ngày lễ.

## Nghiệm thu

- [x] Đã đối chiếu vị trí và thứ tự section trên desktop với thiệp tham chiếu.
- [ ] Chưa đối chiếu pixel-by-pixel artwork vì thay đổi chỉ tác động dữ liệu lặp trong layout hiện hữu.
- [ ] Cần kiểm tra local ở desktop và mobile 390px với dữ liệu có hai lễ.
