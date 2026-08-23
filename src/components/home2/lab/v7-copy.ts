/**
 * Nội dung chữ cho biến thể V7 — bản trang chủ hoàn chỉnh, không phải wireframe.
 *
 * Chỉ chứa phần chữ RIÊNG của hồi mở đầu (hành trình hai người đi về phía nhau
 * và phong bì hồi kết). Toàn bộ phần thân trang dùng lại `home2Copy` — không
 * viết lại chữ đã có, nếu không hai chỗ sẽ lệch nhau khi sửa.
 *
 * ⚠️ Cùng nợ kỹ thuật với `copy.ts`: chữ đang nằm trong file TS chứ chưa ở
 * `messages/vi.json`. Khi chuyển `home2Copy` sang namespace `home2` thì gộp
 * object dưới đây vào cùng, dưới khoá `home2.journey`.
 */

export const v7Copy = {
  /** Dòng dẫn về lab, không phải phần thiết kế. */
  labStrip: {
    label: "Biến thể V7",
    name: "Hành trình về chung một nhà",
    back: "Về danh sách biến thể",
  },

  hero: {
    eyebrow: "Thiệp mừng online",
    titleLead: "Hai người, hai nhà,",
    titleAccent: "về chung một lối",
    lede:
      "Cuộn xuống để đi cùng hai bạn từ hai đầu con đường tới tấm thiệp được gửi đi. Mỗi bước là một việc bạn sẽ làm khi tạo thiệp thật.",
    ctaPrimary: "Tạo thiệp của bạn",
    ctaSecondary: "Xem mẫu thiệp",
    scrollHint: "Cuộn xuống",
  },

  /** Chú thích từng hồi. `to` là mốc trên tiến độ sân khấu. */
  acts: [
    { to: 0.08, kicker: "Hồi một", line: "Hai người, hai nhà" },
    { to: 0.44, kicker: "Hồi hai", line: "Đi về phía nhau" },
    { to: 0.54, kicker: "Hồi ba", line: "Và thành một" },
    { to: 0.86, kicker: "Hồi bốn", line: "Một tấm thiệp cho ngày ấy" },
    { to: 1.0, kicker: "Hồi năm", line: "Gửi bằng một đường link" },
  ],

  /** Nhãn thanh tiến độ, đọc được khi cuộn nhanh. */
  progressActs: [
    "Hai đầu con đường",
    "Đi lại gần",
    "Gặp nhau",
    "Thiệp mở ra",
    "Gửi bằng một đường link",
  ],

  /** Cột thông tin nhà trai. `at` là mốc hiện dòng đó trên tiến độ. */
  groomRows: [
    {
      at: 0.12,
      label: "Nhà trai",
      title: "Ba mẹ và thứ bậc trong nhà",
      copy: "Điền tên ba mẹ, cách xưng hô và lời mời riêng của nhà trai.",
    },
    {
      at: 0.24,
      label: "Lễ thành hôn",
      title: "Giờ lễ và địa điểm",
      copy: "Ngày giờ, tên nhà hàng, kèm bản đồ chỉ đường tới đúng cửa.",
    },
  ],

  /** Cột thông tin nhà gái. */
  brideRows: [
    {
      at: 0.18,
      label: "Nhà gái",
      title: "Ba mẹ và thứ bậc trong nhà",
      copy: "Nhà gái có phần riêng, chữ và ảnh không dùng chung với nhà trai.",
    },
    {
      at: 0.3,
      label: "Lễ vu quy",
      title: "Giờ lễ và địa điểm",
      copy: "Hai lễ hai nơi vẫn nằm gọn trong một tấm thiệp, không phải hai link.",
    },
  ],

  /**
   * Bốn mốc tính năng trên đường đi, xen kẽ hai bên như nhịp của V2.
   * `x` là vị trí theo % bề ngang (bố cục ngang), `by` là người đi qua nó.
   */
  milestones: [
    {
      x: 21,
      by: "groom" as const,
      label: "Chọn mẫu thiệp",
      copy: "Xem đủ trang demo trước khi chọn, không phải đoán qua ảnh thu nhỏ.",
    },
    {
      x: 34,
      by: "groom" as const,
      label: "Ảnh cưới & nhạc nền",
      copy: "Album ảnh, video phóng sự và bản nhạc của hai bạn.",
    },
    {
      x: 66,
      by: "bride" as const,
      label: "Bản đồ & lịch trình",
      copy: "Khách chạm một lần là mở được chỉ đường tới địa điểm.",
    },
    {
      x: 79,
      by: "bride" as const,
      label: "Khách mời & RSVP",
      copy: "Mỗi khách một đường link riêng, tự xác nhận tham dự.",
    },
  ],

  /** Hai mốc dùng cho bố cục chéo trên màn hẹp — chỗ hẹp chỉ đủ hai cái. */
  narrowMilestones: [
    { label: "Chọn mẫu thiệp", side: "right" as const },
    { label: "Khách mời & RSVP", side: "left" as const },
  ],

  meetLabel: "Một câu chuyện, hai nửa",

  /** Chữ in trên hai cánh thiệp trong phong bì. */
  card: {
    invitePrompt: "Trân trọng kính mời",
    coupleNames: "Minh & Hà",
    joiner: "đến chung vui trong ngày cưới của chúng tôi",
    dateLine: "Chủ nhật · 20 · 11 · 2026",
    venueLine: "Trung tâm tiệc cưới Hoa Sen · TP.HCM",
    openHint: "Thiệp mở ra ngay trên trình duyệt của khách",
  },

  finale: {
    label: "Đường link của hai bạn",
    link: "thiepmungonline.com/thiep/minh-ha",
    channels: ["Zalo", "Messenger", "Email"],
    note: "Sửa giờ lễ hay đổi ảnh sau khi gửi vẫn dùng đúng đường link cũ.",
    cta: "Tạo thiệp của bạn",
  },
} as const;
