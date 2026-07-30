-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT,
    "contentHtml" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_deletedAt_publishedAt_idx" ON "BlogPost"("status", "deletedAt", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_deletedAt_updatedAt_idx" ON "BlogPost"("deletedAt", "updatedAt");

-- Preserve the public blog cards that existed before blog management moved to the database.
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "category", "contentHtml", "status", "publishedAt", "createdAt", "updatedAt") VALUES
('legacy-cach-lap-danh-sach-khach-moi-dam-cuoi', 'Cách lập danh sách khách mời đám cưới Việt', 'cach-lap-danh-sach-khach-moi-dam-cuoi', 'Đám cưới Việt thường có bốn danh sách khách: cô dâu, chú rể, nhà trai, nhà gái. Cách chia việc và tránh trùng tên.', 'Kinh nghiệm cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-xu-huong-chu-de-dam-cuoi-2026', 'Xu hướng chủ đề đám cưới 2026', 'xu-huong-chu-de-dam-cuoi-2026', 'Phân tích 36.765 thiệp cưới online quý 1/2026: phong cách Truyền thống chiếm 63%, Thiên nhiên 27%.', 'Xu hướng', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-khi-nao-nen-gui-thiep-cuoi', 'Khi nào nên gửi thiệp cưới', 'khi-nao-nen-gui-thiep-cuoi', 'Dựa trên 1.700+ đám cưới và 8.000+ phản hồi RSVP: 2-6 tuần trước cưới là thời điểm tốt nhất.', 'Kinh nghiệm cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-thiep-cuoi-giay-hay-online', 'Thiệp cưới giấy hay điện tử: cách mời tinh tế', 'thiep-cuoi-giay-hay-online', 'Thiệp cưới giấy hay điện tử đều có ưu nhược riêng. Hướng dẫn chọn và kết hợp cả hai theo nhóm khách.', 'Thiệp cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-lich-trinh-ngay-cuoi', 'Lịch trình ngày cưới: 5 mốc khách mời cần biết', 'lich-trinh-ngay-cuoi', 'Lịch trình trên thiệp là cho khách mời, không phải cô dâu chú rể. Năm mốc thời gian quan trọng.', 'Kinh nghiệm cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-tiec-cocktail-dam-cuoi', 'Tiệc cocktail đám cưới và welcome hour hiện đại', 'tiec-cocktail-dam-cuoi', 'Giải thích khái niệm welcome hour, vì sao các cặp đôi hiện đại chọn nó, và cách tổ chức trong 30-60 phút.', 'Ý tưởng tiệc cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-moi-cuoi-qua-zalo', 'Mời Cưới Qua Zalo: Tại Sao Khách Nói ''Ok'' Mà Không Đến (2026)', 'moi-cuoi-qua-zalo', 'Một cô dâu mời 40 bạn cấp 3 qua Zalo. Tất cả trả lời ''okê''. Chỉ 3 người đến dự.', 'Thiệp cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-checklist-chuan-bi-dam-cuoi', 'Checklist chuẩn bị đám cưới: 12 tuần cuối', 'checklist-chuan-bi-dam-cuoi', 'Checklist theo tuần cho ba tháng cuối: địa điểm, chụp ảnh, đăng ký kết hôn, thiệp mời, MC, xe cưới.', 'Kinh nghiệm cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-du-toan-chi-phi-dam-cuoi', 'Dự toán chi phí đám cưới Việt 2026', 'du-toan-chi-phi-dam-cuoi', 'Bảng ngân sách ba mức: tiết kiệm 80 triệu, trung bình 150 triệu, cao cấp 300 triệu.', 'Ngân sách', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-thu-tuc-cuoi-mien-nam', 'Thủ tục cưới miền Nam: hướng dẫn chi tiết', 'huong-dan-chi-tiet-cac-thu-tuc-cuoi-hoi-truyen-thong-cua-mien-nam-viet-nam', 'Hướng dẫn đầy đủ phong tục cưới miền Nam: lễ dạm ngõ, lễ hỏi, lễ rước dâu, kèm so sánh Bắc - Nam.', 'Phong tục cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-cach-ghi-thiep-cuoi', 'Cách ghi thiệp cưới đúng và đủ', 'huong-dan-chi-tiet-cach-ghi-thong-tin-tren-thiep-cuoi-online-hoan-hao', 'Cách điền thiệp online chuẩn: tên, cha mẹ, ngày giờ, địa điểm, loại lễ, RSVP, thông tin ngân hàng.', 'Thiệp cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('legacy-thiep-cuoi-viet-tay-hay-online', 'Thiệp cưới viết tay hay online: nên chọn loại nào', 'thiep-cuoi-viet-tay-hay-thiep-cuoi-hien-dai-lua-chon-nao-phu-hop-nhat', 'Thiệp cưới viết tay tinh tế nhưng tốn công, chi phí cao. Thiệp online nhanh và miễn phí. So sánh chi tiết.', 'Thiệp cưới', '<p>Nội dung bài viết đang được đội ngũ Chung Đôi cập nhật.</p><p>Bạn có thể tham khảo các mẫu thiệp cưới, công cụ hỗ trợ và bảng giá trên website.</p>', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
