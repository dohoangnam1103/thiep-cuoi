import type { Metadata } from "next";

import { ChungDoiPricing } from "@/components/chungdoi-pricing";

export const metadata: Metadata = {
  title: "Bảng giá | ChungDoi Clone",
  description: "Giá thiệp cưới online ChungDoi: thanh toán một lần, không phí ẩn, dùng thử miễn phí 3 ngày.",
  alternates: { canonical: "/bang-gia" },
};

export default function BangGiaPage() {
  return <ChungDoiPricing />;
}
