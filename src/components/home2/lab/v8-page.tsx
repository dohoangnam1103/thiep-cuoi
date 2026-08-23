"use client";

import { useEffect, useState } from "react";

import NextLink from "next/link";

import { ContactFab } from "@/components/chungdoi-chrome";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

import { Home2Footer, Home2Header } from "../chrome";
import {
  ClosingChapter,
  FaqChapter,
  FeaturesChapter,
  GuestsChapter,
  LanguagesChapter,
  TestimonialsChapter,
  type ImageSize,
} from "../sections-bottom";
import { InstantChapter, Ribbon, TemplatesChapter } from "../sections-top";
import type { TemplateShotData } from "../types";
import { V8Day, V8Hero } from "./v8-day";
import { v8Copy } from "./v8-copy";
import "./v8.css";

/**
 * V8 — "Một ngày cưới": biến thể trang chủ hoàn chỉnh, hướng thiết kế khác hẳn
 * V7. Chữ là chữ thật, ảnh là ảnh thiệp thật, toàn bộ art direction dùng hệ
 * `.hp-*` của `home-2.css`.
 *
 * Kịch bản: cuộn = thời gian trong ngày cưới trôi từ sáng tới tối. Ba canh giờ
 * (lễ sớm / lễ thành hôn / tiệc tối) là ba hồi, mỗi hồi gắn đúng phần lịch trình
 * và tính năng sản phẩm tương ứng. Ngày khép lại bằng con dấu sáp ép ngày cưới,
 * rồi phong bì hiện ra đường link chia sẻ — sau đó trang tiếp tục bằng các
 * chương nội dung thật đã dựng của V0.
 *
 * Nguồn các hồi:
 *   hồi mở đầu  mới      một ngày cưới trôi theo cuộn, nền đổi tông theo giờ
 *   hồi kết     V1/V7    mở phong bì trước khi hiện đường link (dùng lại nguyên)
 *   phần thân   V0       các chương nội dung thật đã dựng, dùng lại nguyên
 *
 * Thứ tự chương giữ đúng luật đổi TÔNG NỀN của V0 — không có hai chương cùng
 * độ sáng nằm cạnh nhau. Sân khấu kết ở nền vang sâu (`--v8-night`), chương kế
 * (Ribbon) cũng vang tối nên mạch nền liền, không hở bước đổi tông.
 *
 * Bỏ `HowItWorksChapter` của V0: ba hồi lịch trình ở trên ĐÃ kể đúng ba việc
 * đó (chọn mẫu → điền thông tin → gửi link) theo bối cảnh giờ giấc, giữ lại là
 * nói hai lần cùng một chuyện.
 */
export function V8Page({
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

  const gridShots = shots.slice(5, 11);

  return (
    <div className="home-editorial hp-day">
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <V8Hero createHref={createHref} />
        <V8Day createHref={createHref} />
        <Ribbon templateCount={templateCount} />
        <TemplatesChapter shots={gridShots} templateCount={templateCount} />
        <InstantChapter templateId={instantTemplateId} />
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

/**
 * Dải nhắc đây là biến thể lab, kèm đường về danh sách — cùng hình dạng với
 * LabStrip của V7 nhưng gắn nhãn V8.
 *
 * KHÔNG dùng `VariantSwitcher` của `kit.tsx`: thanh đó nền tối, chữ 11px, thuộc
 * ngôn ngữ wireframe — dán lên một trang đã đắp art direction thì nó là thứ bắt
 * mắt nhất trên màn hình.
 */
function LabStrip() {
  return (
    <div
      className="hp-wine-deep px-5 py-2.5 sm:px-8"
      style={{ background: "var(--hp-wine-deep)" }}
    >
      <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center gap-x-3 gap-y-1">
        <span className="hp-label !tracking-[0.24em]" style={{ color: "var(--hp-gold)" }}>
          {v8Copy.labStrip.label}
        </span>
        <span className="hp-body-sm" style={{ color: "var(--hp-cream)" }}>
          {v8Copy.labStrip.name}
        </span>
        <NextLink
          href="/home-2/lab"
          className="hp-body-sm ml-auto underline decoration-1 underline-offset-4"
          style={{ color: "var(--hp-cream)" }}
        >
          {v8Copy.labStrip.back}
        </NextLink>
      </div>
    </div>
  );
}
