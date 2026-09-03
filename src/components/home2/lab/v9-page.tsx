"use client";

import {
  Check,
  CheckCircle2,
  Clock3,
  Play,
  Plus,
  Scale,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ContactFab } from "@/components/chungdoi-chrome";
import { WeddingGuideVideo } from "@/components/wedding-guide-video";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";
import { parseFaqAnswer } from "@/lib/faq-answer";

import { Home2Footer, Home2Header } from "../chrome";
import { Shell } from "../primitives";
import { ClosingChapter, type ImageSize } from "../sections-bottom";
import { Ribbon } from "../sections-top";
import { V9Hero, V9Journey } from "./v9-journey";
import { useIsMobileLayout } from "./v9-journey-motion";
import { V9MobileJourney } from "./v9-mobile-journey";
import type { V9TemplateShot } from "./v9-stations";
import "./v9.css";

/* Một lời dẫn lớn + ba lời phụ, thay cho sáu thẻ đều nhau cùng gắn 5 sao. Lý do
   đã ghi trong `sections-bottom.tsx`: sáu lời khen 5/5 giống khuôn là thứ khiến
   người đọc kết luận ngay là dựng. Lời được chọn làm lời dẫn là lời cụ thể nhất
   (đếm khách bằng RSVP). Bỏ t1 vì nội dung của nó ("10 phút", "đẹp hơn thiệp
   giấy") đã là hero stat và cả chương truyền thống; bỏ t3 vì trùng trạm 03. */
const featuredTestimonial = "t2";
const supportingTestimonials = ["t4", "t5", "t6"] as const;

/* Năm câu còn lại. Cắt q2 (ba bước tạo thiệp), q3 (không cần biết thiết kế),
   q5 (thêm ảnh/nhạc/bản đồ/RSVP) và q9 (hiển thị tốt trên điện thoại) vì trùng
   trực tiếp với các trạm journey. Cắt thêm q7 (gửi được cho bao nhiêu khách) vì
   trạm 05 đã trả lời gần nguyên văn: "Chia sẻ không giới hạn, link chung hoặc
   link riêng" — giữ nó lại là để hai chỗ nói cùng một câu.

   Năm câu giữ lại đều trả lời thứ không chương nào phía trên trả lời: thiệp
   online là gì, cần chuẩn bị gì, sửa được sau khi gửi không, khách nhận thiệp
   ra sao (câu này còn thêm chi tiết in QR lên thiệp giấy), và chi phí. */
const faqNumbers = [1, 4, 6, 8, 10] as const;

export function V9Page({
  shots,
  templateCount,
  instantTemplateId,
  rsvpImage,
}: {
  shots: V9TemplateShot[];
  templateCount: number;
  instantTemplateId: string;
  rsvpImage: ImageSize;
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

  const isMobile = useIsMobileLayout();
  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);
  const heroShot = shots[0];

  if (!heroShot) return null;

  return (
    <div className="home-editorial hp-v9">
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <V9Hero shot={heroShot} createHref={createHref} />
        {/* Bốn mục chi tiết từng nằm ở đây (lưới mẫu, form gõ tên, danh sách tính
            năng, ảnh trang quản lý) đã dời vào trong chính trạm nói về chúng —
            xem `v9-station-assets.tsx`. Cấu trúc hai lớp buộc mỗi chủ đề xuất
            hiện hai lần: hành trình kể, chương dưới chứng minh. Cắt hết câu trùng
            vẫn không hết, vì cái lặp là do có hai lớp chứ không do cách viết. */}
        {/* Hai bố cục, chọn ở runtime theo bề ngang màn hình — không phải một bố
            cục co giãn. Desktop giữ hành trình sticky có tấm thiệp bay; mobile là
            native story deck vuốt ngang và không điều khiển window scroll. Chọn
            bằng `matchMedia` để chỉ mount một cây DOM, tránh tải hai bộ ảnh và
            dựng ScrollTrigger desktop trên điện thoại. `null` là frame đầu (kể
            cả trên server) khi còn chưa biết khổ màn hình. */}
        {isMobile === null ? null : isMobile ? (
          <V9MobileJourney
            shots={shots.slice(0, 4)}
            createHref={createHref}
            templateCount={templateCount}
            instantTemplateId={instantTemplateId}
            rsvpImage={rsvpImage}
          />
        ) : (
          <V9Journey
            shots={shots.slice(0, 4)}
            createHref={createHref}
            templateCount={templateCount}
            instantTemplateId={instantTemplateId}
            rsvpImage={rsvpImage}
          />
        )}
        <TraditionChapter />
        <Ribbon templateCount={templateCount} />
        <SupportChapter />
        <TestimonialsChapter />
        <FullFaqChapter />
        <ClosingChapter createHref={createHref} />
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}

function LabStrip() {
  const t = useTranslations("homeLabV9.labStrip");

  return (
    <div className="v9-lab-strip px-5 py-2.5 sm:px-8">
      <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center gap-x-3 gap-y-1">
        <span className="hp-label !tracking-[0.24em]">{t("label")}</span>
        <span className="hp-body-sm">{t("name")}</span>
        <NextLink
          href="/home-2/lab"
          className="hp-body-sm ml-auto underline decoration-1 underline-offset-4"
        >
          {t("back")}
        </NextLink>
      </div>
    </div>
  );
}

/**
 * Chương "truyền thống & tiện lợi".
 *
 * Chỗ này trước đây là danh sách 3 bước (chọn mẫu → điền thông tin → gửi thiệp)
 * đặt ngay dưới hành trình 6 trạm — tức là kể lại lần thứ hai cùng một câu
 * chuyện, bằng câu ngắn hơn và nhạt hơn. Bỏ hẳn danh sách bước đó. Thay vào là
 * thứ cả trang chưa nói ở đâu khác: cái gì của thiệp giấy được giữ nguyên, và
 * cái gì thì không phải làm nữa. Video hướng dẫn là nội dung duy nhất còn giữ
 * lại từ bản cũ, nên nó được đưa lên làm neo hình ảnh của chương.
 */
function TraditionChapter() {
  const t = useTranslations("homeLabV9.tradition");
  const keeps = [t("keep1"), t("keep2"), t("keep3"), t("keep4")];
  const drops = [t("drop1"), t("drop2"), t("drop3"), t("drop4")];

  return (
    <section className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
          <header className="lg:col-span-7">
            <p className="hp-label flex items-center gap-3 text-[color:var(--hp-accent)]">
              <Scale className="size-4" strokeWidth={1.5} />
              {t("eyebrow")}
            </p>
            <h2 className="hp-display hp-h2 mt-6 max-w-[34rem]">{t("title")}</h2>
          </header>
          <p className="hp-body lg:col-span-4 lg:col-start-9 lg:self-end">
            {t("lede")}
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
          <div className="mx-auto w-full max-w-[19rem] lg:mx-0">
            <div className="v9-guide-frame aspect-[9/16] w-full overflow-hidden">
              <WeddingGuideVideo title={t("videoNote")} />
            </div>
            <p className="hp-label mt-4 flex items-center gap-2.5">
              <Play className="size-3.5" strokeWidth={1.5} />
              {t("videoLabel")}
            </p>
            <p className="hp-body-sm mt-2">{t("videoNote")}</p>
            <NextLink href="/tao-thiep-cuoi-online" className="hp-link mt-6 inline-block">
              {t("ctaHint")}
            </NextLink>
          </div>

          {/* Hai cột chia hàng bằng subgrid nên các kẻ chỉ ngang khớp nhau qua
              đường kẻ dọc, dù câu hai bên dài ngắn khác nhau. */}
          <div className="v9-contrast grid gap-10 sm:gap-0">
            <div className="sm:pr-10">
              <p className="hp-label border-b border-[color:var(--hp-rule)] pb-4 text-[color:var(--hp-fg)]">
                {t("keepTitle")}
              </p>
              <ul>
                {keeps.map((item) => (
                  <li
                    key={item}
                    className="hp-body grid grid-cols-[auto_1fr] gap-x-4 border-b border-[color:var(--hp-rule)] py-5"
                  >
                    <Check
                      aria-hidden
                      className="mt-[0.3em] size-4 shrink-0 text-[color:var(--hp-accent)]"
                      strokeWidth={1.75}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột "bỏ được" gạch ngang bằng nét mực đỏ — một cách trình bày
                không xuất hiện ở bất kỳ chương nào khác của trang. */}
            <div className="sm:border-l sm:border-[color:var(--hp-rule)] sm:pl-10">
              <p className="hp-label border-b border-[color:var(--hp-rule)] pb-4">
                {t("dropTitle")}
              </p>
              <ul>
                {drops.map((item) => (
                  <li
                    key={item}
                    className="hp-body grid grid-cols-[auto_1fr] gap-x-4 border-b border-[color:var(--hp-rule)] py-5"
                  >
                    <X
                      aria-hidden
                      className="mt-[0.3em] size-4 shrink-0 text-[color:var(--v9-coral)] opacity-55"
                      strokeWidth={1.75}
                    />
                    <span className="v9-drop-item">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function SupportChapter() {
  const t = useTranslations("home");

  return (
    <section className="hp-wine hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="hp-label">{t("support.title")}</p>
          <h2 className="hp-display hp-h2 mt-6 max-w-[38rem]">
            {t("support.titleAccent")}
          </h2>
          <p className="hp-body mt-7 max-w-[38rem]">
            {t.rich("support.subtitle", {
              hl: (chunks) => <strong className="font-semibold text-[color:var(--hp-fg)]">{chunks}</strong>,
            })}
          </p>
        </div>
        {/* Chỉ còn một thẻ. Thẻ "thời gian phản hồi · dưới 1 phút" đã bị bỏ vì
            dải số liệu phía trên đã in đúng con số đó ("< 1 phút"). */}
        <div className="flex items-center gap-5 border border-[color:var(--hp-rule)] bg-[color:var(--hp-bg)] p-7">
          <CheckCircle2
            className="size-7 shrink-0 text-[color:var(--hp-accent)]"
            strokeWidth={1.35}
          />
          <div>
            <p className="hp-body-sm">{t("support.helpEditsLabel")}</p>
            <p className="hp-display hp-h3 mt-1 text-[color:var(--hp-fg)]">
              {t("support.helpEditsValue")}
            </p>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function TestimonialsChapter() {
  const t = useTranslations("home");

  return (
    <section className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid gap-8 lg:grid-cols-12">
          <header className="lg:col-span-7">
            <p className="hp-label text-[color:var(--hp-accent)]">
              {t("testimonials.eyebrow")}
            </p>
            <h2 className="hp-display hp-h2 mt-6">{t("testimonials.title")}</h2>
          </header>
          <p className="hp-body lg:col-span-4 lg:col-start-9 lg:self-end">
            {t("testimonials.subtitle")}
          </p>
        </div>
        <figure className="mt-14 border-t border-[color:var(--hp-rule)] pt-12">
          <blockquote className="hp-display hp-display-italic max-w-[52rem] text-[clamp(1.4rem,3.1vw,2.35rem)] leading-[1.28]">
            “{t(`testimonials.${featuredTestimonial}Quote`)}”
          </blockquote>
          <figcaption className="hp-label mt-8 flex flex-wrap items-center gap-x-3">
            <span className="text-[color:var(--hp-fg)]">
              {t(`testimonials.${featuredTestimonial}Author`)}
            </span>
            <span aria-hidden className="h-px w-6 bg-[color:var(--hp-rule)]" />
            <span>{t(`testimonials.${featuredTestimonial}Role`)}</span>
          </figcaption>
        </figure>

        <div className="mt-16 grid gap-y-10 sm:grid-cols-3 sm:gap-x-10">
          {supportingTestimonials.map((key, index) => (
            <figure
              key={key}
              className={`border-t border-[color:var(--hp-rule)] pt-7 ${
                index === 0 ? "" : "sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0"
              }`}
            >
              <blockquote className="hp-body text-[color:var(--hp-fg)]">
                “{t(`testimonials.${key}Quote`)}”
              </blockquote>
              <figcaption className="hp-label mt-5">
                <span className="text-[color:var(--hp-fg)]">
                  {t(`testimonials.${key}Author`)}
                </span>
                <span className="mt-1.5 block !tracking-[0.18em]">
                  {t(`testimonials.${key}Role`)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function FullFaqChapter() {
  const t = useTranslations("home");
  const labT = useTranslations("homeLabV9");
  const items = faqNumbers.map((number) => ({
    question: t(`faq.q${number}Q`),
    answer: parseFaqAnswer(t(`faq.q${number}A`)),
  }));

  return (
    <section id="hoi-dap" className="hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <header className="lg:col-span-4">
          <p className="hp-label flex items-center gap-3 text-[color:var(--hp-accent)]">
            <Clock3 className="size-4" strokeWidth={1.5} />
            {labT("faqEyebrow")}
          </p>
          <h2 className="hp-display hp-h2 mt-6">{t("faq.heading")}</h2>
          <NextLink href="/bang-gia" className="hp-link mt-8 inline-block">
            {t("nav.pricing")}
          </NextLink>
        </header>
        <div className="lg:col-span-7 lg:col-start-6">
          {items.map((item, index) => (
            <details key={item.question} className="v9-qa border-t border-[color:var(--hp-rule)]">
              <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden">
                <span className="hp-num mt-0.5 text-sm text-[color:var(--hp-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="hp-display flex-1 text-[1.08rem] leading-snug sm:text-[1.18rem]">
                  {item.question}
                </h3>
                <Plus className="v9-qa-sign mt-1 size-4 shrink-0" strokeWidth={1.5} />
              </summary>
              {/* Câu trả lời trong catalog dùng `\n\n` ngắt khối, `\n` ngắt dòng
                  danh sách. Không phân tích thì các dòng danh sách in ra thành
                  một dãy câu rời, mất dấu đầu dòng. */}
              <div className="hp-body space-y-4 pb-7 pl-10 pr-8">
                {item.answer.map((block, blockIndex) =>
                  block.type === "list" ? (
                    <ul key={blockIndex} className="list-disc space-y-1.5 pl-5">
                      {block.items.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={blockIndex}>{block.text}</p>
                  ),
                )}
              </div>
            </details>
          ))}
        </div>
      </Shell>
    </section>
  );
}
