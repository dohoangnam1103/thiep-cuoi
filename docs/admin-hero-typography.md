# Font tên rút gọn của mẫu thiệp

## Cách dùng

Vào `/admin/demos/[id]`, chọn **Xem trước**, bấm nút **Aa** ở cạnh trái.
Chọn font, bật/tắt đậm và nghiêng để xem ngay. **Lưu** đặt mặc định cho mẫu;
**Hủy thay đổi** trả về giá trị đã lưu. **Khôi phục kiểu gốc** trả font, đậm,
nghiêng về thiết kế gốc, vẫn cần Lưu để áp dụng.
Thu gọn bảng hoặc chuyển qua lại Chỉnh sửa/Xem trước vẫn giữ bản nháp.
Rời/tải lại trang khi chưa lưu có cảnh báo của trình duyệt.

Không có bảng Aa trong editor của user hoặc trang thiệp công khai. Server action
luôn gọi `verifyAdmin`, kiểm tra ID là demo, slug đúng mẫu đang lưu và whitelist font.
Nếu đổi mẫu ở form admin, cần lưu form trước khi lưu font cho mẫu mới.

## Phạm vi và ưu tiên

- Chỉ các phần tử `data-invitation-short-name` ở đầu phần detail nhận cấu hình.
- Dấu &, tên đầy đủ, các tên lặp lại ở gia đình/footer và phong bì mở đầu không đổi.
- Font user đã lưu trong `InvitationContent.fontFamily` ưu tiên hơn font admin.
  Trường này hiện là bộ chọn font chung có sẵn của user; không thêm bộ chọn mới cho user.
- Nếu user không chọn font: dùng mặc định admin, rồi đến font gốc của mẫu.
- Đậm/nghiêng của admin áp dụng riêng cho tên rút gọn. `null` giữ kiểu gốc,
  `false` yêu cầu chữ thường/không nghiêng, `true` yêu cầu đậm/nghiêng.
- Font có sẵn được tải local; trình duyệt có thể tổng hợp bold/italic nếu font
  trang trí chỉ có một kiểu nét gốc.
- Một số thiệp cũ đã được sao chép font chung từ demo lúc tạo. Vì DB trước đây
  không phân biệt font sao chép với font user tự chọn, giá trị không rỗng này
  được giữ ưu tiên để không ghi đè lựa chọn đang dùng.

## Lưu trữ / triển khai

Bảng `TemplateHeroTypography`, migration `20260903100000_template_hero_typography`.
Cấu hình lưu theo slug, độc lập dữ liệu demo; có tác dụng lên các thiệp cùng mẫu
không có font riêng của user. Cache `template-hero-typography` được invalidated
sau save; không cần sửa hoặc seed lại nội dung các thiệp.

Đã deploy production qua pipeline VPS ngày 03/09/2026, release
`20260903115555`. Migration và regenerate Prisma thành công; container healthy,
database/asset checks đạt, 116 browser tests trong deployment gate đạt.
Trang chủ, bảng giá và demo trả HTTP 200; admin chưa đăng nhập chuyển về admin/login.
Detail Song Hỷ Xanh có đúng hai marker tên và CSS font mới đã được phục vụ.
Bảng cấu hình production ban đầu có 0 dòng; không đưa cấu hình thử local lên production.

Trước build, đã dọn build cache không sử dụng và chuyển image rollback cũ không chạy
về `/Users/namdo/Documents/thiepmung-deploy-20260903-hero-font/` (kèm checksum,
hướng dẫn khôi phục). Giữ image đang chạy trước deploy để rollback, DB và uploads.
Sau deploy VPS còn khoảng 2.8 GiB trống; lần deploy tiếp theo vẫn phải đạt gate 6 GiB.

## Kiểm tra

- Song Hỷ Xanh: chọn Pattaya, bold + italic cập nhật ngay hai tên; computed font
  của tên đầy đủ vẫn EB Garamond. Chưa save thì public vẫn Lora.
- Save thành công, tải lại public nhận Pattaya/700/italic; trang public không có Aa.
- Reload admin đọc lại giá trị; Hủy sau khi chọn Carattere trả về Pattaya.
- Chuyển Chỉnh sửa → Xem trước vẫn giữ font chưa lưu; thu gọn không mất bản nháp.
- Mobile 390px: bảng và nút nằm trong viewport, không tràn ngang.
- Unit tests kiểm tra thứ tự ưu tiên, validation, mọi font có CSS và marker không
  bọc container/footer/dấu &. Typecheck đạt.
- Full lint bị cuốn vào `.worktrees` có build artifacts nên đã dừng; lint các file
  thay đổi không có lỗi mới. Lỗi có sẵn trong `chungdoi-tpl-shared.tsx:278`
  (`react-hooks/set-state-in-effect`) vẫn tồn tại.
- Cấu hình thử Song Hỷ Xanh được trả về kiểu gốc sau kiểm tra.

## Khi thêm template

Đánh dấu đúng hai node hiển thị tên rút gọn đầu detail bằng
`data-invitation-short-name`. Không đánh dấu container chứa dấu &, lời mời hoặc
các phần khác. Không dùng text matching/MutationObserver để đoán tên trong DOM.
Các wrapper detail đọc `HeroTypographyScope`; không đưa scope này vào phong bì.
