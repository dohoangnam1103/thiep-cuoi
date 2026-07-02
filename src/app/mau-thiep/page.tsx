import type { Metadata } from "next";

import { ChungDoiListing } from "@/components/chungdoi-listing";

export const metadata: Metadata = {
  title: "Mẫu thiệp cưới online | ChungDoi Clone",
  description:
    "Kho mẫu thiệp cưới online của ChungDoi: lọc theo phong cách và màu sắc, xem trước và demo thiệp với hiệu ứng mở thiệp, ảnh cưới, RSVP.",
  alternates: { canonical: "/mau-thiep" },
};

export default function MauThiepPage() {
  return <ChungDoiListing />;
}
