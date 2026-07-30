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
