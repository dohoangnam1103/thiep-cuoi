/**
 * Nội dung chữ cho biến thể V8 — "Một ngày cưới".
 *
 * Chỉ chứa phần chữ RIÊNG của sân khấu mở đầu (cuộn = một ngày cưới trôi từ
 * sáng tới tối, kết bằng con dấu ép ngày và phong bì hiện link). Toàn bộ phần
 * thân trang dùng lại `home2Copy` — không viết lại chữ đã có, nếu không hai
 * chỗ sẽ lệch nhau khi sửa.
 *
 * ⚠️ Cùng nợ kỹ thuật với `copy.ts`: chữ đang nằm trong file TS chứ chưa ở
 * `messages/vi.json`. Khi chuyển `home2Copy` sang namespace `home2` thì gộp
 * object dưới đây vào cùng, dưới khoá `home2.day`.
 */

export const v8Copy = {
  /** Dòng dẫn về lab, không phải phần thiết kế. */
  labStrip: {
    label: "Biến thể V8",
    name: "Một ngày cưới",
    back: "Về danh sách biến thể",
  },

  hero: {
    eyebrow: "Thiệp mừng online",
    titleLead: "Từ sáng tới tối,",
    titleAccent: "một lời mời trọn vẹn",
    lede:
      "Cuộn xuống để đi qua đúng một ngày cưới: lễ sớm, giờ thành hôn, tiệc tối. Mỗi canh giờ là một việc thiệp phải nói thay hai bạn.",
    ctaPrimary: "Tạo thiệp của bạn",
    ctaSecondary: "Xem mẫu thiệp",
    scrollHint: "Cuộn xuống",
  },

  /**
   * Ba hồi = ba canh giờ trong ngày cưới. Mỗi hồi một khối lịch trình thật,
   * gắn đúng tính năng sản phẩm tương ứng — lịch trình là nội dung kể chuyện
   * chứ không phải bullet liệt kê.
   */
  acts: [
    {
      id: "dawn" as const,
      kicker: "06:00",
      line: "Lễ dâng nhà trai",
      rows: [
        {
          title: "Nghi thức ra mắt",
          copy: "Tên ba mẹ hai họ, cách xưng hô và lời chào riêng cho từng bên.",
        },
        { title: "Nhà trai", copy: "Địa chỉ đón đoàn nhà gái, kèm mốc thời gian." },
      ],
    },
    {
      id: "noon" as const,
      kicker: "11:30",
      line: "Lễ thành hôn",
      rows: [
        {
          title: "Giờ lễ & địa điểm",
          copy: "Ngày giờ chính xác, tên nhà hàng và bản đồ chỉ đường tới đúng cửa.",
        },
        {
          title: "Hai lễ, hai nơi",
          copy: "Lễ vu quy và lễ thành hôn nằm gọn trong một thiệp, không phải hai đường link.",
        },
      ],
    },
    {
      id: "dusk" as const,
      kicker: "18:00",
      line: "Tiệc mừng",
      rows: [
        {
          title: "Sổ lưu bút",
          copy: "Khách để lại lời chúc ngay trên thiệp, giữ lại sau ngày cưới.",
        },
        {
          title: "Hộp quà QR",
          copy: "Mã QR chuyển khoản cho khách ở xa không tới dự được.",
        },
      ],
    },
  ],

  /** Chữ in trên con dấu sáp khi nó ép xuống cuối ngày. */
  seal: {
    label: "Niêm phong",
    dateLine: "20 · 11 · 2026",
    note: "Một ngày, một lời mời, một đường link duy nhất.",
  },

  /**
   * Hồi kết — đường link của cặp đôi. Lấy nguyên nội dung của V7 để hai biến
   * thể không lệch nhau khi sửa.
   */
  finale: null, // dùng v7Copy.finale — xem v8-day.tsx
} as const;
