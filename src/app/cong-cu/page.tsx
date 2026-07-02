import type { Metadata } from "next";

import { ChungDoiTools } from "@/components/chungdoi-tools";

export const metadata: Metadata = {
  title: "Công cụ cưới miễn phí | ChungDoi Clone",
  description: "Bộ công cụ cưới miễn phí: tạo ảnh Save the Date, lời mời AI, mã QR, nén ảnh và video. Không cần đăng ký.",
  alternates: { canonical: "/cong-cu" },
};

export default function CongCuPage() {
  return <ChungDoiTools />;
}
