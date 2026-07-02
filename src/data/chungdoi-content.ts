export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "cach-lap-danh-sach-khach-moi-dam-cuoi",
    title: "Cách lập danh sách khách mời đám cưới Việt",
    excerpt:
      "Đám cưới Việt thường có bốn danh sách khách: cô dâu, chú rể, nhà trai, nhà gái. Cách chia việc và tránh trùng tên.",
  },
  {
    slug: "xu-huong-chu-de-dam-cuoi-2026",
    title: "Xu hướng chủ đề đám cưới 2026",
    excerpt:
      "Phân tích 36.765 thiệp cưới online quý 1/2026: phong cách Truyền thống chiếm 63%, Thiên nhiên 27%.",
  },
  {
    slug: "khi-nao-nen-gui-thiep-cuoi",
    title: "Khi nào nên gửi thiệp cưới",
    excerpt:
      "Dựa trên 1.700+ đám cưới và 8.000+ phản hồi RSVP: 2-6 tuần trước cưới là thời điểm tốt nhất.",
  },
  {
    slug: "thiep-cuoi-giay-hay-online",
    title: "Thiệp cưới giấy hay điện tử: cách mời tinh tế",
    excerpt:
      "Thiệp cưới giấy hay điện tử đều có ưu nhược riêng. Hướng dẫn chọn và kết hợp cả hai theo nhóm khách.",
  },
  {
    slug: "lich-trinh-ngay-cuoi",
    title: "Lịch trình ngày cưới: 5 mốc khách mời cần biết",
    excerpt:
      "Lịch trình trên thiệp là cho khách mời, không phải cô dâu chú rể. Năm mốc thời gian quan trọng.",
  },
  {
    slug: "tiec-cocktail-dam-cuoi",
    title: "Tiệc cocktail đám cưới và welcome hour hiện đại",
    excerpt:
      "Giải thích khái niệm welcome hour, vì sao các cặp đôi hiện đại chọn nó, và cách tổ chức trong 30-60 phút.",
  },
  {
    slug: "moi-cuoi-qua-zalo",
    title: "Mời Cưới Qua Zalo: Tại Sao Khách Nói 'Ok' Mà Không Đến (2026)",
    excerpt:
      "Một cô dâu mời 40 bạn cấp 3 qua Zalo. Tất cả trả lời 'okê'. Chỉ 3 người đến dự.",
  },
  {
    slug: "checklist-chuan-bi-dam-cuoi",
    title: "Checklist chuẩn bị đám cưới: 12 tuần cuối",
    excerpt:
      "Checklist theo tuần cho ba tháng cuối: địa điểm, chụp ảnh, đăng ký kết hôn, thiệp mời, MC, xe cưới.",
  },
  {
    slug: "du-toan-chi-phi-dam-cuoi",
    title: "Dự toán chi phí đám cưới Việt 2026",
    excerpt:
      "Bảng ngân sách ba mức: tiết kiệm 80 triệu, trung bình 150 triệu, cao cấp 300 triệu.",
  },
  {
    slug: "huong-dan-chi-tiet-cac-thu-tuc-cuoi-hoi-truyen-thong-cua-mien-nam-viet-nam",
    title: "Thủ tục cưới miền Nam: hướng dẫn chi tiết",
    excerpt:
      "Hướng dẫn đầy đủ phong tục cưới miền Nam: lễ dạm ngõ, lễ hỏi, lễ rước dâu, kèm so sánh Bắc - Nam.",
  },
  {
    slug: "huong-dan-chi-tiet-cach-ghi-thong-tin-tren-thiep-cuoi-online-hoan-hao",
    title: "Cách ghi thiệp cưới đúng và đủ",
    excerpt:
      "Cách điền thiệp online chuẩn: tên, cha mẹ, ngày giờ, địa điểm, loại lễ, RSVP, thông tin ngân hàng.",
  },
  {
    slug: "thiep-cuoi-viet-tay-hay-thiep-cuoi-hien-dai-lua-chon-nao-phu-hop-nhat",
    title: "Thiệp cưới viết tay hay online: nên chọn loại nào",
    excerpt:
      "Thiệp cưới viết tay tinh tế nhưng tốn công, chi phí cao. Thiệp online nhanh và miễn phí. So sánh chi tiết.",
  },
];

export type HelpCategory = {
  name: string;
  description: string;
};

export const helpCategories: HelpCategory[] = [
  { name: "Bắt đầu", description: "Tạo thiệp mời đầu tiên và nắm những điều cơ bản." },
  { name: "Mẫu thiệp", description: "Chọn và tùy chỉnh những mẫu thiệp xinh xắn." },
  { name: "Khách mời & Xác nhận", description: "Quản lý tên khách, phản hồi, lời chúc và nhóm khách." },
  { name: "Chia sẻ", description: "Gửi link thiệp qua chat, mã QR hoặc mạng xã hội." },
  { name: "Thanh toán", description: "Hiểu về giới hạn dùng thử, nâng cấp, thanh toán và hóa đơn." },
  { name: "Khắc phục sự cố", description: "Xử lý các vấn đề thường gặp khi xuất bản, tải ảnh, chia sẻ và thanh toán." },
];

export const helpPopularArticles: string[] = [
  "Cách tạo thiệp cưới online",
  "Cách đổi mẫu thiệp",
  "Cách thêm và quản lý khách mời",
  "Cách xác nhận tham dự hoạt động",
  "Cách chia sẻ thiệp qua Zalo",
  "Cách hoạt động của mã QR mừng cưới và Google Maps",
];
