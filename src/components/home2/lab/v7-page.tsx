"use client";

import { useEffect, useRef, useState } from "react";

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
import { useReducedMotion, useStageProgress, useViewport } from "./kit";
import { V7Hero, V7Journey } from "./v7-journey";
import { V7Thread } from "./v7-thread";
import { v7Copy } from "./v7-copy";
import "./v7.css";

/**
 * V7 — trang chủ hoàn chỉnh, ghép điểm mạnh của năm biến thể lab.
 *
 * Khác với V1–V5: đây KHÔNG phải wireframe. Chữ là chữ thật, ảnh là ảnh thiệp
 * thật, và toàn bộ art direction dùng hệ `.hp-*` của `home-2.css` — cùng một
 * bảng màu, cùng một thang chữ với bản V0 đã dựng.
 *
 * Ghép từ đâu:
 *   xương sống   V5  hành trình hai người đi về phía nhau, 5 hồi scroll-driven
 *   sợi dẫn      V4  tơ hồng vẽ dần xuyên phần thân, nút thắt ở mỗi chương
 *   nhịp thông tin V2 mỗi màn đúng một tính năng, xen kẽ trái/phải
 *   hồi kết      V1  mở phong bì trước khi hiện đường link
 *   phần thân    V0  các chương nội dung thật đã dựng, dùng lại nguyên
 *
 * Thứ tự chương giữ đúng luật đổi TÔNG NỀN của V0 — không có hai chương cùng độ
 * sáng nằm cạnh nhau:
 *
 *   hero          giấy
 *   hành trình    giấy (nền hai nửa, tự hoà)
 *   số liệu       vang      ← tối
 *   01 mẫu        giấy
 *   02 thử tên    giấy đậm
 *   03 tính năng  giấy
 *   04 khách      giấy đậm
 *   05 ngôn ngữ   giấy
 *   06 lời        giấy đậm
 *   07 hỏi đáp    giấy
 *   kết           vang      ← tối
 *   footer        vang sâu
 *
 * Bỏ `HowItWorksChapter` của V0: hành trình ở trên ĐÃ kể đúng ba bước đó bằng
 * chuyển động, giữ lại là nói hai lần cùng một chuyện. Đó cũng là lý do các mốc
 * trên đường đi lấy đúng nội dung của những bước ấy.
 */
export function V7Page({
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

  /* Giữ đúng luật điều hướng của sản phẩm: chưa đăng nhập thì CTA đi qua trang
     đăng nhập rồi mới tới danh sách mẫu. */
  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);

  /* Hành trình đã dùng hết 5 mẫu cho phần chuyển động của nó, nên lưới chương 01
     lấy 6 mẫu tiếp theo — không lặp lại mẫu người xem vừa thấy. */
  const gridShots = shots.slice(0, 6);

  return (
    <div className="home-editorial hp-journey">
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <V7Hero createHref={createHref} />
        <V7Journey createHref={createHref} />
        <ThreadedBody
          gridShots={gridShots}
          templateCount={templateCount}
          instantTemplateId={instantTemplateId}
          rsvpImage={rsvpImage}
          languagesImage={languagesImage}
          createHref={createHref}
        />
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}

/** Số nút thắt trên sợi tơ hồng. Phải bằng số chương bên trong `ThreadedBody`,
 *  nếu không thì nút thắt lệch khỏi ranh giới chương. */
const THREAD_CHAPTERS = 7;

/**
 * Phần thân trang, có sợi tơ hồng chạy dọc bên lề.
 *
 * Sợi nằm ở lớp phủ `absolute inset-0` của chính khối này chứ không `fixed`: nhờ
 * vậy nó dài đúng bằng phần thân, không tràn xuống footer, và không cần đo DOM.
 *
 * Sợi tắt hẳn khi bật giảm chuyển động — nó là lớp trang trí thuần, không mang
 * thông tin nào mà việc mất đi làm hỏng nội dung.
 */
function ThreadedBody({
  gridShots,
  templateCount,
  instantTemplateId,
  rsvpImage,
  languagesImage,
  createHref,
}: {
  gridShots: TemplateShotData[];
  templateCount: number;
  instantTemplateId: string;
  rsvpImage: ImageSize;
  languagesImage: ImageSize;
  createHref: string;
}) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const progress = useStageProgress(bodyRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();

  return (
    <div ref={bodyRef} className="relative">
      {reduced ? null : (
        <V7Thread
          progress={progress}
          chapters={THREAD_CHAPTERS}
          narrow={viewport.width < 1024}
        />
      )}

      <Ribbon templateCount={templateCount} />
      <TemplatesChapter shots={gridShots} templateCount={templateCount} />
      <InstantChapter templateId={instantTemplateId} />
      <FeaturesChapter />
      <GuestsChapter imageSize={rsvpImage} />
      <LanguagesChapter imageSize={languagesImage} />
      <TestimonialsChapter />
      <FaqChapter />
      <ClosingChapter createHref={createHref} />
    </div>
  );
}

/**
 * Dải nhắc đây là biến thể lab, kèm đường về danh sách.
 *
 * KHÔNG dùng `VariantSwitcher` của `kit.tsx`: thanh đó nền tối, chữ 11px, thuộc
 * ngôn ngữ wireframe — dán lên một trang đã đắp art direction thì nó là thứ bắt
 * mắt nhất trên màn hình.
 *
 * Cũng không `sticky`: header của trang đã neo `top-0 z-50`, thêm một thanh dính
 * nữa là hai lớp tranh nhau mép trên và dòng "Hồi một" của sân khấu bị đẩy xuống
 * dưới chỗ đã tính.
 */
function LabStrip() {
  return (
    <div
      className="hp-wine-deep px-5 py-2.5 sm:px-8"
      style={{ background: "var(--hp-wine-deep)" }}
    >
      <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="hp-label !tracking-[0.24em]"
          style={{ color: "var(--hp-gold)" }}
        >
          {v7Copy.labStrip.label}
        </span>
        <span className="hp-body-sm" style={{ color: "var(--hp-cream)" }}>
          {v7Copy.labStrip.name}
        </span>
        <NextLink
          href="/home-2/lab"
          className="hp-body-sm ml-auto underline decoration-1 underline-offset-4"
          style={{ color: "var(--hp-cream-soft)" }}
        >
          {v7Copy.labStrip.back}
        </NextLink>
      </div>
    </div>
  );
}
