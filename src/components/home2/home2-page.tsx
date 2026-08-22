"use client";

import { useEffect, useState } from "react";

import { ContactFab } from "@/components/chungdoi-chrome";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

import { Home2Footer, Home2Header } from "./chrome";
import {
  ClosingChapter,
  FaqChapter,
  FeaturesChapter,
  GuestsChapter,
  HowItWorksChapter,
  LanguagesChapter,
  TestimonialsChapter,
  type ImageSize,
} from "./sections-bottom";
import { Hero, InstantChapter, Ribbon, TemplatesChapter } from "./sections-top";
import type { TemplateShotData } from "./types";

/**
 * Gốc của trang chủ v2.
 *
 * Thứ tự chương được xếp để TÔNG NỀN đổi liên tục, không có hai chương sáng
 * giống nhau nằm cạnh nhau:
 *
 *   hero      giấy
 *   số liệu   vang        ← tối
 *   01 mẫu    giấy
 *   02 thử    giấy đậm
 *   03 cách   vang        ← tối
 *   04 tính năng  giấy
 *   05 khách  giấy đậm
 *   06 ngôn ngữ   giấy
 *   07 lời    giấy đậm
 *   08 hỏi đáp    giấy
 *   kết       vang        ← tối
 *   footer    vang sâu
 *
 * Đúng thứ này là cái trang chủ hiện tại thiếu: 5 trong 6 section của nó dùng
 * cùng một `bg-background`, section còn lại dùng `bg-secondary` chỉ nhạt hơn 4%
 * độ sáng — mắt không nhận ra được ranh giới chương nào.
 */
export function Home2Page({
  shots,
  templateCount,
  instantTemplateId,
  rsvpImage,
  languagesImage,
}: {
  shots: TemplateShotData[];
  templateCount: number;
  instantTemplateId: string;
  rsvpImage: ImageSize;
  languagesImage: ImageSize;
}) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { loggedIn?: boolean } | null) => {
        if (active && data?.loggedIn) setLoggedIn(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Giữ đúng luật điều hướng của sản phẩm hiện tại: chưa đăng nhập thì CTA đi
  // qua trang đăng nhập rồi mới tới danh sách mẫu.
  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);

  const heroShots = shots.slice(0, 5);
  const gridShots = shots.slice(5, 11);

  return (
    <div className="home-editorial">
      <Home2Header createHref={createHref} />
      <main>
        <Hero shots={heroShots} createHref={createHref} />
        <Ribbon templateCount={templateCount} />
        <TemplatesChapter shots={gridShots} templateCount={templateCount} />
        <InstantChapter templateId={instantTemplateId} />
        <HowItWorksChapter />
        <FeaturesChapter />
        <GuestsChapter imageSize={rsvpImage} />
        <LanguagesChapter imageSize={languagesImage} />
        <TestimonialsChapter />
        <FaqChapter />
        <ClosingChapter createHref={createHref} />
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}
