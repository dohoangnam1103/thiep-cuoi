-- Đếm số lần thiệp được mở, phục vụ cột "Lượt xem" trong trang quản trị.
-- Cột có DEFAULT nên SQLite thêm được tại chỗ, không phải dựng lại bảng:
-- thiệp đang tồn tại bắt đầu từ 0 thay vì NULL.
ALTER TABLE "Invitation" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
