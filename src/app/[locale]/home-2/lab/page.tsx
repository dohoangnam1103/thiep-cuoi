import type { Metadata } from "next";
import NextLink from "next/link";
import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe trang chủ · các biến thể",
  robots: { index: false, follow: false },
};

const VARIANTS: Array<{
  code: string;
  href: string;
  name: string;
  motion: string;
  strength: string;
  weakness: string;
  note?: string;
}> = [
  {
    code: "V0",
    href: "/home-2",
    name: "Ấn phẩm",
    motion:
      "Không có màn diễn nào. Chỉ hiện dần khi vào khung nhìn, đổi tông nền giữa các chương.",
    strength: "Đọc nhanh, hợp SEO, làm xong là dùng được ngay.",
    weakness: "Đúng cái bạn nói: chưa ấn tượng. Không có gì để nhớ.",
  },
  {
    code: "V1",
    href: "/home-2/lab/v1",
    name: "Thiệp mở ra",
    motion:
      "Phong bì đứng giữa màn hình. Cuộn thì dấu sáp nứt, nắp mở, thiệp được rút lên, mở ra như cửa hai cánh, rồi hiện đường link chia sẻ.",
    strength: "Kịch tính nhất. Hiểu ngay sản phẩm là gì mà không cần đọc chữ.",
    weakness: "Tốn 5 màn hình cuộn trước khi tới nội dung. Cuộn nhanh sẽ thấy loang loáng.",
  },
  {
    code: "V2",
    href: "/home-2/lab/v2",
    name: "Thiệp du hành",
    motion:
      "Một tấm thiệp duy nhất không bao giờ rời khung nhìn. Nó bay qua từng chương, đổi vị trí, cỡ, góc nghiêng và đổi mặt mẫu.",
    strength: "Mượt và sang. Mỗi màn hình đều đang giới thiệu một tính năng, không tốn màn hình trống.",
    weakness: "Đây là ngôn ngữ chuyển động của trang công nghệ. Sang nhưng không riêng của cưới.",
  },
  {
    code: "V3",
    href: "/home-2/lab/v3",
    name: "Album lật ngang",
    motion:
      "Cuộn dọc bị đổi thành lật ngang. Sáu trang album trượt sang trái, hai trang rìa hơi nghiêng như trang sách thật.",
    strength: "Lạ nhất, gần như chắc chắn người xem sẽ nhớ. Hợp nghĩa album cưới.",
    weakness: "Nghịch trực giác với một số người. Khó quét mắt nhanh. Mobile phải đổi sang xếp dọc.",
  },
  {
    code: "V4",
    href: "/home-2/lab/v4",
    name: "Tơ hồng",
    motion:
      "Một sợi chỉ đỏ được vẽ dần suốt trang, con dấu sáp trượt dọc sợi chỉ. Mỗi chương một nút thắt, đi qua thì sáng lên.",
    strength: "Mang nghĩa văn hoá đúng chỗ. Không tốn thêm màn hình nào, nội dung vẫn đọc bình thường. Chạy tốt trên mobile.",
    weakness: "Nhẹ hơn V1/V3 về độ choáng. Nó là sợi dẫn, không phải màn diễn.",
  },
  {
    code: "V5",
    href: "/home-2/lab/v5",
    name: "Đi về phía nhau",
    motion:
      "Cô dâu và chú rể ở hai mép màn hình, nền chia hai tông là hai nhà. Cuộn thì hai người bước lại gần theo sải chân thật, gặp nhau ở giữa thì nắm tay, hai nền màu hoà thành một, và tấm thiệp mọc lên từ chỗ hai bàn tay chạm nhau.",
    strength:
      "Đúng chủ đề cưới nhất, và có một cái đích rõ ràng nên người xem tự muốn cuộn tiếp để xem hai người có gặp được nhau không. Nền hai nửa hoà làm một là phần kể chuyện mà bốn cái kia không có. Quãng đi không bị trống: hai cột thông tin hai họ hiện dồn lại, còn tính năng sản phẩm thành các mốc sáng lên khi có người bước qua.",
    weakness:
      "Sống chết vào chất lượng hình hai nhân vật. Bản wireframe chỉ là bóng dáng SVG cho thấy nhịp; bản thật cần hình vẽ tử tế, làm dở là rơi xuống mức hoạt hình rẻ tiền ngay.",
    note: "Thu cửa sổ xuống dưới 860px để xem bản mobile: hai người đi chéo (chú rể từ trên-trái, cô dâu từ dưới-phải), nền chia trên/dưới, và mỗi người để lại vết đường đã đi.",
  },
];

export default async function LabIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen bg-[#f4f2ee] px-6 py-16 text-[#2f2c29]">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#b4453d]">
          Wireframe
        </p>
        <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
          Năm hướng cho trang chủ
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#7d766d]">
          Toàn bộ đều là bản nháp bằng khối xám, không dùng ảnh hay font thật, để
          chọn <strong className="font-semibold text-[#2f2c29]">kịch bản chuyển động</strong> trước
          đã. Trang chủ đang chạy ở <code className="text-[#2f2c29]">/</code> không bị ảnh hưởng.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#7d766d]">
          Mỗi trang có thanh chuyển nhanh ở trên và thanh tiến độ ở dưới để thấy
          mình đang ở hồi nào trong kịch bản.
        </p>

        <ul className="mt-14 space-y-px">
          {VARIANTS.map((variant) => (
            <li key={variant.code}>
              <NextLink
                href={variant.href}
                className="group block border-t border-[#d5cfc5] py-7 transition-colors hover:bg-[#ece8e1]"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-lg font-semibold tabular-nums text-[#b4453d]">
                    {variant.code}
                  </span>
                  <h2 className="text-xl font-semibold">{variant.name}</h2>
                  <span className="ml-auto text-xs text-[#7d766d] transition-transform group-hover:translate-x-1">
                    xem →
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed">{variant.motion}</p>
                <dl className="mt-5 grid gap-3 text-xs leading-relaxed sm:grid-cols-2">
                  <div>
                    <dt className="font-bold uppercase tracking-[0.18em] text-[#7d766d]">Mạnh</dt>
                    <dd className="mt-1.5">{variant.strength}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.18em] text-[#7d766d]">Yếu</dt>
                    <dd className="mt-1.5">{variant.weakness}</dd>
                  </div>
                </dl>
                {variant.note ? (
                  <p className="mt-4 border-l-2 border-[#b4453d] pl-3 text-xs leading-relaxed text-[#7d766d]">
                    {variant.note}
                  </p>
                ) : null}
              </NextLink>
            </li>
          ))}
        </ul>

        <p className="mt-14 border-t border-[#d5cfc5] pt-7 text-xs leading-relaxed text-[#7d766d]">
          Chọn được hướng rồi thì bước tiếp là đắp art direction thật lên: font,
          màu, ảnh thiệp thật, nội dung thật. Cũng có thể ghép — ví dụ lấy màn mở
          phong bì của V1 làm hero rồi dùng sợi tơ hồng của V4 làm sợi dẫn cho
          phần thân.
        </p>
      </div>
    </main>
  );
}
