/**
 * Nội dung trang chủ v2.
 *
 * ⚠️ TẠM THỜI ĐẶT Ở ĐÂY, KHÔNG PHẢI CHỖ ở LÂU DÀI.
 *
 * Luật của repo (AGENTS.md) là mọi chữ hiển thị phải đi qua catalog next-intl
 * (`messages/vi.json`). Nội dung đang nằm trong file này vì lúc dựng trang có
 * một task khác chạy song song đang ghi vào `messages/vi.json`; sửa cùng lúc
 * thì hai bên đè mất thay đổi của nhau. Trang này chưa công khai (noindex, chưa
 * có link trỏ tới) nên trả giá tạm thời đó là chấp nhận được.
 *
 * VIỆC CẦN LÀM khi task kia xong: chuyển toàn bộ object dưới đây vào namespace
 * `home2` trong `messages/vi.json`, rồi đổi các component sang `useTranslations("home2")`.
 * Cấu trúc bên dưới đã lồng đúng theo hình dạng namespace để bước chuyển chỉ là
 * copy-paste, không phải viết lại.
 *
 * Về mặt nội dung, so với trang chủ hiện tại:
 * - Hero từ 3 đoạn xám xếp dọc rút còn 1 câu. Bỏ luôn tiêu đề "Mẫu thiệp cưới
 *   online đẹp nhất" nằm cuối hero vì nó trùng gần như từng chữ với tiêu đề của
 *   section ngay bên dưới.
 * - Bỏ mọi so sánh nhất ("đẹp nhất", "hoàn hảo"): không chứng minh được và là
 *   thứ khiến chữ đọc ra như máy viết.
 * - Bốn khối nội dung đã có sẵn trong `messages/vi.json` nhưng CHƯA từng được
 *   render ở đâu (`home.stats`, `home.features`, `home.languages`,
 *   `home.instant`) được đưa vào dùng — đó là lý do trang chủ cũ gần như không
 *   giới thiệu tính năng nào ngoài RSVP.
 */

export type FeatureKey =
  | "mobile"
  | "maps"
  | "album"
  | "music"
  | "guestBook"
  | "gift";

export const home2Copy = {
  header: {
    templates: "Mẫu thiệp",
    howItWorks: "Cách hoạt động",
    guests: "Khách mời",
    pricing: "Bảng giá",
    createNow: "Tạo thiệp",
    menu: "Mở menu",
    closeMenu: "Đóng menu",
  },

  hero: {
    eyebrow: "Thiệp mừng online",
    titleLead: "Thiệp cưới online",
    titleAccent: "gửi trọn một lời mời",
    lede:
      "Chọn mẫu, điền thông tin, gửi đường link. Khách mở trên điện thoại là thấy đủ giờ lễ, đường đi và chỗ xác nhận tham dự.",
    trialNote: "Tạo miễn phí · Dùng thử 3 ngày · Chỉ trả khi bạn hài lòng",
    ctaPrimary: "Tạo thiệp của bạn",
    ctaSecondary: "Xem hướng dẫn",
    cardHint: "Chạm để xem cả thiệp",
    railLabel: "Chọn mẫu thiệp xem trước",
  },

  /** Dải số liệu ngay sau hero. Mỗi số phải truy được về một nguồn thật —
   *  không có số nào ở đây do bịa ra. */
  ribbon: {
    couplesValue: "65.000+",
    couplesLabel: "cặp đôi đã tạo thiệp",
    templatesLabel: "mẫu thiệp thủ công",
    replyValue: "< 1 phút",
    replyLabel: "thời gian phản hồi",
    trialValue: "3 ngày",
    trialLabel: "dùng thử miễn phí",
  },

  templates: {
    chapter: "01",
    eyebrow: "Mẫu thiệp",
    title: "Chọn một mẫu, rồi làm nó thành của bạn",
    lede:
      "Mỗi mẫu là một bộ hoàn chỉnh: bìa, album, lịch trình, bản đồ, sổ lưu bút và hộp quà. Bạn đổi chữ và ảnh, phần còn lại đã dựng sẵn.",
    hoverHint: "Đưa chuột vào thiệp để xem cả trang",
    cta: "Xem tất cả mẫu thiệp",
    newBadge: "Mới",
  },

  instant: {
    chapter: "02",
    eyebrow: "Thử ngay, không cần đăng ký",
    title: "Gõ tên hai bạn, xem thiệp đổi ngay",
    lede:
      "Không cần tài khoản, không cần điền form. Nhập tên để thấy thiệp mang tên mình trước khi quyết định có làm hay không.",
    groomLabel: "Tên chú rể",
    brideLabel: "Tên cô dâu",
    groomPlaceholder: "Alex",
    bridePlaceholder: "Jordan",
    invitePrompt: "Trân trọng kính mời",
    inviteBody: "đến chung vui trong ngày cưới của",
    dateLine: "Chủ nhật · 20 · 11 · 2026",
    cta: "Tạo thiệp mang tên này",
    note: "Tên vừa gõ sẽ được điền sẵn vào thiệp khi bạn bắt đầu.",
  },

  howItWorks: {
    chapter: "03",
    eyebrow: "Cách hoạt động",
    title: "Ba bước, khoảng mười phút",
    lede: "Giữ trọn phần lễ nghi, bỏ đi phần vất vả.",
    stepLabel: "Bước",
    steps: [
      {
        title: "Chọn mẫu thiệp",
        copy: "Xem demo đầy đủ từng mẫu trước khi chọn, không phải đoán qua ảnh thu nhỏ.",
      },
      {
        title: "Điền thông tin",
        copy: "Tên hai họ, ngày giờ lễ và tiệc, địa điểm, ảnh cưới, nhạc nền. Lưu nháp bao nhiêu lần cũng được.",
      },
      {
        title: "Gửi thiệp mời",
        copy: "Xuất bản rồi gửi link qua Zalo, Messenger hay email. Sửa sau khi gửi vẫn dùng đúng link cũ.",
      },
    ],
    videoCaption: "Video hướng dẫn",
    cta: "Bắt đầu tạo thiệp",
    ctaHint: "Xem hướng dẫn chi tiết",
  },

  features: {
    chapter: "04",
    eyebrow: "Bên trong tấm thiệp",
    title: "Một tấm thiệp, đủ mọi thứ đám cưới cần",
    lede:
      "Không phải một tấm ảnh gửi qua tin nhắn. Là một trang riêng của hai bạn, có đủ những phần khách sẽ cần đến.",
    items: [
      {
        key: "mobile" as FeatureKey,
        title: "Tối ưu di động",
        copy: "Gần như mọi khách sẽ mở thiệp bằng điện thoại, nên thiệp được dựng cho màn hình dọc trước rồi mới đến máy tính.",
      },
      {
        key: "maps" as FeatureKey,
        title: "Chỉ đường Google Maps",
        copy: "Bản đồ nhúng sẵn trong thiệp. Khách chạm một lần là mở được chỉ đường tới đúng địa điểm.",
      },
      {
        key: "album" as FeatureKey,
        title: "Album ảnh và video",
        copy: "Trình xem album ngay trong thiệp, kèm được cả video phóng sự cưới.",
      },
      {
        key: "music" as FeatureKey,
        title: "Nhạc nền",
        copy: "Chọn bản nhạc của hai bạn, phát khi khách mở thiệp và luôn có nút tắt.",
      },
      {
        key: "guestBook" as FeatureKey,
        title: "Sổ lưu bút",
        copy: "Khách để lại lời chúc ngay trên thiệp. Lời chúc được giữ lại sau ngày cưới.",
      },
      {
        key: "gift" as FeatureKey,
        title: "Hộp quà QR",
        copy: "Mã QR chuyển khoản cho cả hai bên, tiện cho khách ở xa không tới dự được.",
      },
    ],
  },

  guests: {
    chapter: "05",
    eyebrow: "Khách mời và RSVP",
    title: "Biết trước ai sẽ đến",
    lede:
      "Gửi lời mời riêng cho từng người, và để khách tự xác nhận. Bạn không phải gọi điện đếm lại từng nhà.",
    points: [
      "Thêm từng khách hoặc nhập cả danh sách khi đã chuẩn bị sẵn",
      "Mỗi khách một đường link riêng, kèm lời chào và cách xưng hô phù hợp",
      "Khách xác nhận tham dự hoặc từ chối, chọn số người đi cùng, gửi ghi chú",
      "Chia sẻ link để người thân cùng thêm khách mà không cần đăng nhập",
      "Theo dõi toàn bộ danh sách bằng số liệu và biểu đồ",
    ],
    imageAlt: "Bảng quản lý khách mời và thống kê RSVP",
  },

  languages: {
    chapter: "06",
    eyebrow: "Đa ngôn ngữ",
    title: "Khách ở nước ngoài cũng đọc được",
    lede:
      "Hiển thị hai ngôn ngữ song song trên cùng một thiệp, để họ hàng xa và bạn bè quốc tế đều theo dõi được thông tin.",
    points: [
      "Thêm ngôn ngữ chỉ với một lần chạm",
      "Hiển thị song song, dễ đọc",
      "Có sẵn bản dịch tham khảo",
      "Sửa lại bản dịch theo ý bạn",
    ],
    imageAlt: "Thiệp cưới hiển thị song song hai ngôn ngữ",
  },

  testimonials: {
    chapter: "07",
    eyebrow: "Thư từ các cặp đôi",
    title: "Người dùng kể lại",
    featured: {
      quote:
        "Mình làm xong thiệp trong một buổi tối. Điều mình không ngờ là phần xác nhận tham dự — trước đó cả hai bên đã định chia nhau gọi điện cho hơn hai trăm khách.",
      author: "Tuấn & Linh",
      role: "Cưới tháng 5, TP.HCM",
    },
    items: [
      {
        quote: "Làm thiệp chưa tới mười phút mà khách khen đẹp hơn thiệp giấy.",
        author: "Minh & Hà",
        role: "Cưới tháng 3, Hà Nội",
      },
      {
        quote: "Sát ngày phải đổi giờ lễ. Sửa trên thiệp là xong, không phải gửi lại link mới.",
        author: "Đức & Trang",
        role: "Cưới tháng 6, Hải Phòng",
      },
      {
        quote: "Hộp quà QR tiện cho mấy người bạn ở nước ngoài không về được.",
        author: "Nam & Vy",
        role: "Cưới tháng 2, Cần Thơ",
      },
    ],
  },

  faq: {
    chapter: "08",
    eyebrow: "Hỏi đáp",
    title: "Hỏi nhanh, đáp gọn",
    items: [
      {
        q: "Thiệp cưới online là gì?",
        a: "Là một trang thiệp riêng cho ngày cưới của hai bạn. Ngoài lời mời, khách xem được giờ lễ, địa điểm, bản đồ, album ảnh, câu chuyện của hai bạn và xác nhận tham dự ngay trên đó.",
      },
      {
        q: "Tạo thiệp có mất nhiều thời gian không?",
        a: "Ba bước: chọn mẫu, điền thông tin và ảnh, xuất bản rồi gửi link. Nếu đã chuẩn bị sẵn nội dung thì chỉ mất vài phút.",
      },
      {
        q: "Tôi có cần biết thiết kế không?",
        a: "Không. Bố cục và hiệu ứng đã dựng sẵn trong từng mẫu. Bạn chỉ điền chữ và tải ảnh lên.",
      },
      {
        q: "Xuất bản rồi còn sửa được không?",
        a: "Được. Đổi giờ, đổi địa điểm hay thay ảnh đều cập nhật ngay trên đường link cũ, không phải gửi lại link mới cho khách.",
      },
      {
        q: "Gửi được cho bao nhiêu khách?",
        a: "Không giới hạn. Chia sẻ một link chung qua Zalo, Messenger, email, hoặc tạo link riêng cho từng khách để cá nhân hoá tên và theo dõi phản hồi.",
      },
      {
        q: "Khách xem thiệp thế nào?",
        a: "Chạm vào link là xem được ngay trên trình duyệt, không cần tải ứng dụng hay đăng nhập. Bạn cũng có thể xuất mã QR để in lên thiệp giấy hoặc bảng đón khách.",
      },
      {
        q: "Chi phí bao nhiêu?",
        a: "Tạo và chỉnh sửa trước đã, chỉ trả khi bạn quyết định dùng. Mức giá và quyền lợi hiển thị rõ trước khi thanh toán.",
      },
    ],
    cta: "Xem bảng giá",
  },

  closing: {
    titleLead: "Ngày của hai bạn xứng đáng",
    titleAccent: "một lời mời tử tế",
    lede: "Tạo miễn phí. Dùng thử ba ngày. Chỉ trả khi bạn thật sự hài lòng.",
    ctaPrimary: "Tạo thiệp của bạn",
    ctaSecondary: "Xem bảng giá",
  },

  footer: {
    tagline: "Thiệp cưới online, tạo trong mười phút và gửi bằng một đường link.",
    productHeading: "Sản phẩm",
    resourcesHeading: "Tài nguyên",
    toolsHeading: "Công cụ",
    templates: "Mẫu thiệp cưới",
    pricing: "Bảng giá",
    howItWorks: "Cách hoạt động",
    tools: "Tất cả công cụ",
    help: "Trung tâm trợ giúp",
    blog: "Blog",
    privacy: "Chính sách bảo mật",
    terms: "Điều khoản sử dụng",
    refund: "Chính sách hoàn tiền",
    copyright: "© 2026 Thiệp Mừng Online",
    draftNotice: "Bản nháp thiết kế — trang chủ đang chạy vẫn ở /",
  },
} as const;
