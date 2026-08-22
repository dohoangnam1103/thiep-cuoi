"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useState } from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { templatePreviewUrl } from "@/lib/template-preview-url";

import { home2Copy } from "./copy";
import { Eyebrow, ChapterMark, Rule, Shell, TemplateShot } from "./primitives";
import type { TemplateShotData } from "./types";

const copy = home2Copy;

/* Ba thang chiều cao khung thiệp. Dùng clamp thay vì px cố định để lưới tự co
   theo màn hình, và dùng ba giá trị KHÁC NHAU để lưới không thành một bức
   tường card đều nhau — đó là vấn đề của carousel 20 thẻ 520px ở trang hiện tại. */
const SHOT_TALL = "clamp(17rem, 33vw, 29rem)";
const SHOT_MID = "clamp(12.5rem, 25vw, 21rem)";
const SHOT_SHORT = "clamp(9.5rem, 19vw, 16rem)";

/* ═══════════════════════════════════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════════════════════════════════ */

export function Hero({
  shots,
  createHref,
}: {
  shots: TemplateShotData[];
  createHref: string;
}) {
  const [active, setActive] = useState(0);
  const current = shots[active] ?? shots[0];

  return (
    <section id="dau-trang" className="hp-paper hp-grain relative overflow-hidden">
      {/* Kẻ dọc mảnh chạy suốt hero, canh đúng mép cột phải trên desktop. Chi
          tiết của trang in: một trục thẳng thay cho vệt gradient mờ. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-[color:var(--hp-rule)] lg:block"
      />

      <Shell className="relative grid gap-14 pb-16 pt-12 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center lg:pr-14">
          <div className="hp-enter" style={{ "--hp-enter-delay": "60ms" } as React.CSSProperties}>
            <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          </div>

          <h1
            className="hp-display hp-h1 hp-enter mt-7"
            style={{ "--hp-enter-delay": "140ms" } as React.CSSProperties}
          >
            {copy.hero.titleLead}
            <span className="hp-display-italic mt-1 block pl-[0.5ch] text-[color:var(--hp-accent)]">
              {copy.hero.titleAccent}
            </span>
          </h1>

          <p
            className="hp-body hp-enter mt-8 max-w-[33rem]"
            style={{ "--hp-enter-delay": "230ms" } as React.CSSProperties}
          >
            {copy.hero.lede}
          </p>

          <div
            className="hp-enter mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={{ "--hp-enter-delay": "320ms" } as React.CSSProperties}
          >
            <a href={createHref} className="hp-btn hp-btn-solid">
              {copy.hero.ctaPrimary}
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </a>
            <a href="#cach-hoat-dong" className="hp-link">
              {copy.hero.ctaSecondary}
            </a>
          </div>

          {/* Con dấu điều kiện dùng thử. Xoay lệch 0.7 độ — đủ để đọc ra "đóng
              dấu bằng tay", chưa tới mức thành hiệu ứng. */}
          <p
            className="hp-label hp-enter mt-11 w-fit -rotate-[0.7deg] border border-[color:var(--hp-rule)] px-4 py-2.5 !tracking-[0.2em]"
            style={{ "--hp-enter-delay": "400ms" } as React.CSSProperties}
          >
            {copy.hero.trialNote}
          </p>
        </div>

        <div
          className="hp-enter flex flex-col items-center lg:items-start lg:pl-14"
          style={{ "--hp-enter-delay": "260ms" } as React.CSSProperties}
        >
          <NextLink
            href={current.demoPath}
            className="group block w-full max-w-[22rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hp-accent)]"
          >
            <TemplateShot
              template={current}
              height="clamp(26rem, 58vw, 34rem)"
              drift="auto"
              driftDuration={58}
              priority
              sizes="(max-width: 1024px) 88vw, 22rem"
            />
            <span className="hp-label mt-4 flex items-center gap-2 transition-opacity group-hover:opacity-60">
              {current.name}
              <span aria-hidden className="opacity-50">
                ·
              </span>
              {copy.hero.cardHint}
            </span>
          </NextLink>

          {/* Dải chọn mẫu: khung nhỏ có viền mảnh, không phải chấm tròn. Chấm
              tròn không cho biết mình sắp xem gì. */}
          <div
            role="tablist"
            aria-label={copy.hero.railLabel}
            className="mt-6 flex w-full max-w-[22rem] gap-2.5"
          >
            {shots.map((shot, index) => (
              <button
                key={shot.slug}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={shot.name}
                onClick={() => setActive(index)}
                className={`relative h-16 flex-1 overflow-hidden border transition-all duration-300 ${
                  index === active
                    ? "border-[color:var(--hp-accent)] opacity-100"
                    : "border-[color:var(--hp-rule)] opacity-55 hover:opacity-90"
                }`}
              >
                <Image
                  src={templatePreviewUrl(shot.listing)}
                  alt=""
                  width={shot.listingWidth}
                  height={shot.listingHeight}
                  sizes="72px"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="block w-full max-w-none"
                />
              </button>
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dải số liệu — chương tối đầu tiên, chia hero khỏi phần thân
   ═══════════════════════════════════════════════════════════════════════════ */

export function Ribbon({ templateCount }: { templateCount: number }) {
  const items: Array<{ value: string; label: string }> = [
    { value: copy.ribbon.couplesValue, label: copy.ribbon.couplesLabel },
    { value: String(templateCount), label: copy.ribbon.templatesLabel },
    { value: copy.ribbon.replyValue, label: copy.ribbon.replyLabel },
    { value: copy.ribbon.trialValue, label: copy.ribbon.trialLabel },
  ];

  return (
    <section className="hp-wine hp-grain">
      <Shell className="grid grid-cols-2 gap-y-9 py-11 lg:grid-cols-4 lg:py-12">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`px-1 lg:px-0 ${
              // Kẻ dọc phân cách: bỏ ở ô đầu mỗi hàng. Mobile 2 cột → ô chẵn
              // vị trí; desktop 4 cột → chỉ ô đầu tiên.
              index % 2 === 0 ? "" : "border-l border-[color:var(--hp-rule)] pl-5"
            } ${index === 0 ? "" : "lg:border-l lg:border-[color:var(--hp-rule)] lg:pl-7"}`}
          >
            <p className="hp-num text-[clamp(1.9rem,3.4vw,2.9rem)] text-[color:var(--hp-accent)]">
              {item.value}
            </p>
            <p className="hp-label mt-2.5 !tracking-[0.18em]">{item.label}</p>
          </div>
        ))}
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 01 — Mẫu thiệp
   ═══════════════════════════════════════════════════════════════════════════ */

export function TemplatesChapter({
  shots,
  templateCount,
}: {
  shots: TemplateShotData[];
  templateCount: number;
}) {
  // Xếp thành hai cột dọc có chiều cao lệch nhau, cột phải tụt xuống một nhịp.
  // Đây là cách bố cục của trang tạp chí; grid ô vuông đều nhau là cách bố cục
  // của bảng dữ liệu.
  const columnA = [shots[0], shots[1], shots[2]].filter(Boolean);
  const columnB = [shots[3], shots[4], shots[5]].filter(Boolean);
  const heightsA = [SHOT_MID, SHOT_TALL, SHOT_SHORT];
  const heightsB = [SHOT_TALL, SHOT_SHORT, SHOT_MID];

  return (
    <section id="mau-thiep" className="hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <ChapterMark value={copy.templates.chapter} />
          <Eyebrow className="mt-4">{copy.templates.eyebrow}</Eyebrow>
          <h2 className="hp-display hp-h2 mt-6">{copy.templates.title}</h2>
          <Rule lead className="mt-8" />
          <p className="hp-body mt-7 max-w-[26rem]">{copy.templates.lede}</p>
          <p className="hp-body-sm mt-6 max-w-[26rem] opacity-70">{copy.templates.hoverHint}</p>
          <NextLink href="/mau-thiep" className="hp-btn hp-btn-ghost mt-9">
            {copy.templates.cta}
            <span className="hp-num !tracking-normal">{templateCount}</span>
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </NextLink>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <div className="flex flex-col gap-3 sm:gap-5">
            {columnA.map((shot, index) => (
              <ShotCard key={shot.slug} shot={shot} height={heightsA[index]} />
            ))}
          </div>
          {/* Nhịp tụt của cột phải. */}
          <div className="flex flex-col gap-3 pt-8 sm:gap-5 sm:pt-14">
            {columnB.map((shot, index) => (
              <ShotCard key={shot.slug} shot={shot} height={heightsB[index]} />
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

function ShotCard({ shot, height }: { shot: TemplateShotData; height: string }) {
  return (
    <NextLink
      href={shot.demoPath}
      className="hp-rise group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hp-accent)]"
    >
      <TemplateShot template={shot} height={height} />
      <span className="mt-3 flex items-baseline justify-between gap-3">
        <span className="hp-display text-base leading-tight">{shot.name}</span>
        {shot.isNew ? (
          <span className="hp-label shrink-0 text-[color:var(--hp-accent)] !tracking-[0.16em]">
            {copy.templates.newBadge}
          </span>
        ) : null}
      </span>
    </NextLink>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 02 — Thử ngay bằng tên thật
   ═══════════════════════════════════════════════════════════════════════════ */

export function InstantChapter({ templateId }: { templateId: string }) {
  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");

  const groomShown = groom.trim() || copy.instant.groomPlaceholder;
  const brideShown = bride.trim() || copy.instant.bridePlaceholder;

  return (
    <section id="thu-ngay" className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
        <div>
          <ChapterMark value={copy.instant.chapter} />
          <Eyebrow className="mt-4">{copy.instant.eyebrow}</Eyebrow>
          <h2 className="hp-display hp-h2 mt-6 max-w-[28rem]">{copy.instant.title}</h2>
          <Rule lead className="mt-8" />
          <p className="hp-body mt-7 max-w-[30rem]">{copy.instant.lede}</p>

          {/* Form thật: gửi thẳng vào server action `createInvitation`, đúng
              hai field tên mà action đã nhận sẵn. Không phải ô nhập trang trí. */}
          <form action={createInvitation} className="mt-10 max-w-[30rem]">
            <input type="hidden" name="templateId" value={templateId} />
            <div className="grid gap-7 sm:grid-cols-2">
              <NameField
                id="hp-groom"
                name="groomShortName"
                label={copy.instant.groomLabel}
                placeholder={copy.instant.groomPlaceholder}
                value={groom}
                onChange={setGroom}
              />
              <NameField
                id="hp-bride"
                name="brideShortName"
                label={copy.instant.brideLabel}
                placeholder={copy.instant.bridePlaceholder}
                value={bride}
                onChange={setBride}
              />
            </div>
            <button type="submit" className="hp-btn hp-btn-solid mt-9">
              {copy.instant.cta}
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </button>
            <p className="hp-body-sm mt-5 opacity-70">{copy.instant.note}</p>
          </form>
        </div>

        {/* Thiệp xem trước. Viền kép mảnh + nền kem, tên đặt bằng chữ thư pháp
            — đúng cách một tấm thiệp in thật được dàn. */}
        <div className="hp-rise mx-auto w-full max-w-[24rem]">
          <div className="hp-frame border border-[color:var(--hp-rule)] p-2.5">
            <div className="flex min-h-[26rem] flex-col items-center justify-center border border-[color:var(--hp-rule)] bg-[color:var(--hp-paper)] px-8 py-14 text-center">
              <p className="hp-label !tracking-[0.34em]">{copy.instant.invitePrompt}</p>
              <span aria-hidden className="mt-7 h-px w-12 bg-[color:var(--hp-rule)]" />

              <p className="hp-script mt-8 text-[clamp(2.4rem,7vw,3.4rem)] text-[color:var(--hp-ink)]">
                {groomShown}
              </p>
              <p className="hp-display hp-display-italic my-1 text-2xl text-[color:var(--hp-accent)]">
                &amp;
              </p>
              <p className="hp-script text-[clamp(2.4rem,7vw,3.4rem)] text-[color:var(--hp-ink)]">
                {brideShown}
              </p>

              <span aria-hidden className="mt-8 h-px w-12 bg-[color:var(--hp-rule)]" />
              <p className="hp-label mt-7 !tracking-[0.24em]">{copy.instant.dateLine}</p>
            </div>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function NameField({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="hp-label block">
        {label}
      </label>
      {/* Gạch chân mảnh, không phải ô viền bo góc. Input kiểu "điền vào chỗ
          trống" của biểu mẫu in. */}
      <input
        id={id}
        name={name}
        type="text"
        maxLength={24}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="hp-display mt-3 w-full border-b border-[color:var(--hp-rule)] bg-transparent pb-2.5 text-2xl text-[color:var(--hp-fg)] outline-none transition-colors placeholder:text-[color:var(--hp-fg-soft)] placeholder:opacity-45 focus:border-[color:var(--hp-accent)]"
      />
    </div>
  );
}
