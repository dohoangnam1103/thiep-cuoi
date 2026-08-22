"use client";

import { ArrowRight, Gift, Images, MapPin, Music, PenLine, Plus, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";

import { WeddingGuideVideo } from "@/components/wedding-guide-video";

import { home2Copy, type FeatureKey } from "./copy";
import { ChapterMark, Eyebrow, Rule, Shell } from "./primitives";

const copy = home2Copy;

export type ImageSize = { width: number; height: number };

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 03 — Cách hoạt động (chương tối)

   Phá nhịp bằng cách thụt cột: tiêu đề nằm ở cột 1-6, danh sách bước ở cột 2-7,
   video ở cột 9-12. Ba khối lệch nhau theo lưới 12 cột thay vì cùng canh giữa.
   ═══════════════════════════════════════════════════════════════════════════ */

export function HowItWorksChapter() {
  return (
    <section id="cach-hoat-dong" className="hp-wine hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          <header className="lg:col-span-6">
            <ChapterMark value={copy.howItWorks.chapter} />
            <Eyebrow className="mt-4">{copy.howItWorks.eyebrow}</Eyebrow>
            <h2 className="hp-display hp-h2 mt-6">{copy.howItWorks.title}</h2>
            <p className="hp-body mt-6 max-w-[26rem]">{copy.howItWorks.lede}</p>
          </header>

          <ol className="lg:col-span-6 lg:col-start-2 lg:row-start-2">
            {copy.howItWorks.steps.map((step, index) => (
              <li
                key={step.title}
                className="hp-rise grid grid-cols-[auto_1fr] gap-x-6 border-t border-[color:var(--hp-rule)] py-8 first:border-t-0 first:pt-0"
              >
                <span className="hp-num text-[2.5rem] leading-none text-[color:var(--hp-accent)] opacity-80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="hp-display hp-h3">{step.title}</h3>
                  <p className="hp-body mt-3 max-w-[30rem]">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:self-end">
            <div className="mx-auto w-full max-w-[17rem] lg:mx-0">
              <div className="hp-frame aspect-[9/16] w-full">
                <WeddingGuideVideo title={copy.howItWorks.videoCaption} />
              </div>
              <p className="hp-label mt-4">{copy.howItWorks.videoCaption}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[color:var(--hp-rule)] pt-10">
          <NextLink href="/mau-thiep" className="hp-btn hp-btn-solid">
            {copy.howItWorks.cta}
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </NextLink>
          <NextLink href="/tao-thiep-cuoi-online" className="hp-link">
            {copy.howItWorks.ctaHint}
          </NextLink>
        </div>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 04 — Bên trong tấm thiệp

   Trình bày kiểu mục lục sách: hai cột, mỗi mục cách nhau bằng kẻ chỉ. KHÔNG
   dùng lưới card bo góc có đổ bóng — sáu card giống nhau là hình ảnh tiêu biểu
   nhất của một trang do máy dựng.
   ═══════════════════════════════════════════════════════════════════════════ */

const FEATURE_ICONS: Record<FeatureKey, LucideIcon> = {
  mobile: Smartphone,
  maps: MapPin,
  album: Images,
  music: Music,
  guestBook: PenLine,
  gift: Gift,
};

export function FeaturesChapter() {
  return (
    <section id="tinh-nang" className="hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid gap-y-8 lg:grid-cols-12">
          <header className="lg:col-span-7">
            <ChapterMark value={copy.features.chapter} />
            <Eyebrow className="mt-4">{copy.features.eyebrow}</Eyebrow>
            <h2 className="hp-display hp-h2 mt-6 max-w-[30rem]">{copy.features.title}</h2>
          </header>
          <p className="hp-body max-w-[24rem] lg:col-span-4 lg:col-start-9 lg:self-end">
            {copy.features.lede}
          </p>
        </div>

        <ul className="mt-14 grid sm:grid-cols-2 sm:gap-x-14 lg:gap-x-24">
          {copy.features.items.map((item) => {
            const Icon = FEATURE_ICONS[item.key];
            return (
              <li
                key={item.key}
                className="hp-fade border-t border-[color:var(--hp-rule)] py-7"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="size-[1.15rem] shrink-0 text-[color:var(--hp-accent)]"
                    strokeWidth={1.25}
                  />
                  <h3 className="hp-display hp-h3">{item.title}</h3>
                </div>
                <p className="hp-body mt-3">{item.copy}</p>
              </li>
            );
          })}
        </ul>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 05 — Khách mời & RSVP

   Ảnh chiếm cột 1-6 và tràn nhẹ sang cột chữ bằng lưới 12 cột (không dùng mẹo
   100vw nên không bao giờ sinh thanh cuộn ngang).
   ═══════════════════════════════════════════════════════════════════════════ */

export function GuestsChapter({ imageSize }: { imageSize: ImageSize }) {
  return (
    <section id="khach-moi" className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="hp-rise lg:col-span-6 lg:row-start-1">
            <Image
              src="/chungdoi/images/rsvp-showcase.png"
              alt={copy.guests.imageAlt}
              width={imageSize.width}
              height={imageSize.height}
              sizes="(max-width: 1024px) 92vw, 38rem"
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:pl-4">
            <ChapterMark value={copy.guests.chapter} />
            <Eyebrow className="mt-4">{copy.guests.eyebrow}</Eyebrow>
            <h2 className="hp-display hp-h2 mt-6">{copy.guests.title}</h2>
            <Rule lead className="mt-8" />
            <p className="hp-body mt-7">{copy.guests.lede}</p>

            <ul className="mt-9">
              {copy.guests.points.map((point) => (
                <li
                  key={point}
                  className="hp-body grid grid-cols-[auto_1fr] gap-x-4 border-t border-[color:var(--hp-rule)] py-4"
                >
                  <span aria-hidden className="mt-[0.85em] h-px w-4 bg-[color:var(--hp-accent)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 06 — Đa ngôn ngữ
   ═══════════════════════════════════════════════════════════════════════════ */

export function LanguagesChapter({ imageSize }: { imageSize: ImageSize }) {
  return (
    <section className="hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-5">
            <ChapterMark value={copy.languages.chapter} />
            <Eyebrow className="mt-4">{copy.languages.eyebrow}</Eyebrow>
            <h2 className="hp-display hp-h2 mt-6">{copy.languages.title}</h2>
            <p className="hp-body mt-7">{copy.languages.lede}</p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {copy.languages.points.map((point) => (
                <li key={point} className="hp-body-sm flex items-center gap-2.5">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-[color:var(--hp-accent)]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="hp-rise lg:col-span-6 lg:col-start-7">
            <Image
              src="/chungdoi/images/language-showcase.png"
              alt={copy.languages.imageAlt}
              width={imageSize.width}
              height={imageSize.height}
              sizes="(max-width: 1024px) 92vw, 34rem"
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 07 — Lời cặp đôi

   Một câu lớn in bằng serif nghiêng, ba câu nhỏ đặt dưới, cách nhau bằng kẻ
   dọc. Bỏ hàng 5 sao và avatar chữ cái ở bản cũ: sáu lời khen đều 5/5 kèm
   avatar sinh tự động là thứ khiến người đọc nghĩ ngay là dựng.
   ═══════════════════════════════════════════════════════════════════════════ */

export function TestimonialsChapter() {
  return (
    <section className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <ChapterMark value={copy.testimonials.chapter} />
            <Eyebrow className="mt-4">{copy.testimonials.eyebrow}</Eyebrow>
          </div>
          <h2 className="hp-display hp-h2">{copy.testimonials.title}</h2>
        </div>

        <figure className="hp-rise mt-14 border-t border-[color:var(--hp-rule)] pt-12">
          <blockquote className="hp-display hp-display-italic max-w-[52rem] text-[clamp(1.4rem,3.1vw,2.35rem)] leading-[1.28]">
            “{copy.testimonials.featured.quote}”
          </blockquote>
          <figcaption className="hp-label mt-8 flex flex-wrap items-center gap-x-3">
            <span className="text-[color:var(--hp-fg)]">{copy.testimonials.featured.author}</span>
            <span aria-hidden className="h-px w-6 bg-[color:var(--hp-rule)]" />
            <span>{copy.testimonials.featured.role}</span>
          </figcaption>
        </figure>

        <div className="mt-16 grid gap-y-10 sm:grid-cols-3 sm:gap-x-10">
          {copy.testimonials.items.map((item, index) => (
            <figure
              key={item.author}
              className={`hp-fade border-t border-[color:var(--hp-rule)] pt-7 ${
                index === 0 ? "" : "sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0"
              }`}
            >
              <blockquote className="hp-body text-[color:var(--hp-fg)]">“{item.quote}”</blockquote>
              <figcaption className="hp-label mt-5">
                <span className="text-[color:var(--hp-fg)]">{item.author}</span>
                <span className="mt-1.5 block !tracking-[0.18em]">{item.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chương 08 — Hỏi đáp

   <details> thuần, chỉ có kẻ chỉ và một dấu cộng xoay. Không JS, mở được cả
   khi chưa hydrate.
   ═══════════════════════════════════════════════════════════════════════════ */

export function FaqChapter() {
  return (
    <section id="hoi-dap" className="hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <header className="lg:col-span-4">
            <ChapterMark value={copy.faq.chapter} />
            <Eyebrow className="mt-4">{copy.faq.eyebrow}</Eyebrow>
            <h2 className="hp-display hp-h2 mt-6">{copy.faq.title}</h2>
            <NextLink href="/bang-gia" className="hp-link mt-8 inline-block">
              {copy.faq.cta}
            </NextLink>
          </header>

          <div className="lg:col-span-7 lg:col-start-6">
            {copy.faq.items.map((item) => (
              <details key={item.q} className="hp-qa border-t border-[color:var(--hp-rule)]">
                <summary className="flex items-start justify-between gap-6 py-6">
                  <h3 className="hp-display text-[1.0625rem] leading-snug sm:text-[1.15rem]">
                    {item.q}
                  </h3>
                  <Plus
                    aria-hidden
                    className="hp-qa-sign mt-0.5 size-4 shrink-0 text-[color:var(--hp-accent)]"
                    strokeWidth={1.5}
                  />
                </summary>
                <p className="hp-body max-w-[38rem] pb-7 pr-8">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Kết — lời mời cuối
   ═══════════════════════════════════════════════════════════════════════════ */

export function ClosingChapter({ createHref }: { createHref: string }) {
  return (
    <section className="hp-wine hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="text-center">
        <span aria-hidden className="mx-auto block h-px w-16 bg-[color:var(--hp-accent)]" />
        <h2 className="hp-display hp-h2 mx-auto mt-10 max-w-[38rem]">
          {copy.closing.titleLead}{" "}
          <span className="hp-display-italic text-[color:var(--hp-accent)]">
            {copy.closing.titleAccent}
          </span>
        </h2>
        <p className="hp-body mx-auto mt-7 max-w-[30rem]">{copy.closing.lede}</p>
        <div className="mt-11 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <a href={createHref} className="hp-btn hp-btn-solid">
            {copy.closing.ctaPrimary}
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </a>
          <NextLink href="/bang-gia" className="hp-link">
            {copy.closing.ctaSecondary}
          </NextLink>
        </div>
      </Shell>
    </section>
  );
}
