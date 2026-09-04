"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import {
  FitText,
  FitTextGroup,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationHeroImage,
  invitationOpeningMessage,
  orderedCouple,
} from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const BETEL_VINE = "/chungdoi/templates/coi-trau-kham-trai/ornaments/betel-vine.svg";
const ARECA_SPRAY = "/chungdoi/templates/coi-trau-kham-trai/ornaments/areca-spray.svg";
const SHELL_DIVIDER = "/chungdoi/templates/coi-trau-kham-trai/ornaments/shell-divider.svg";

export const coiTrauTypography = {
  displayFontClass: "font-mg-cormorant",
} as const;

function formatWeddingDate(date: string, locale: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

type CoiTrauHeroCardProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children" | "content"
> & {
  content: ChungDoiDemoContent;
};

export const CoiTrauHeroCard = forwardRef<HTMLElement, CoiTrauHeroCardProps>(
  function CoiTrauHeroCard(
    { content, className, inert, tabIndex, ...sectionProps },
    ref,
  ) {
    const locale = useLocale();
    const t = useTranslations("invitationTemplate");
    const people = orderedCouple(content);
    const heroImage = invitationHeroImage(content);
    const coupleLabel = `${people[0].shortName} ${t("and")} ${people[1].shortName}`;

    return (
      <section
        {...sectionProps}
        ref={ref}
        data-coi-trau-hero="true"
        inert={inert ? true : undefined}
        tabIndex={tabIndex}
        className={cn(
          "relative isolate flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#32151F] px-4 py-12 font-body-sans text-[#F1E8D8] sm:px-7 sm:py-16",
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(216,227,223,0.13),transparent_25%),radial-gradient(circle_at_14%_18%,rgba(49,90,66,0.72),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(184,91,82,0.18),transparent_30%)]"
        />
        <Image
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute -left-20 -top-24 h-[58%] w-auto -rotate-12 opacity-35 mix-blend-screen sm:-left-12 sm:-top-20"
          height={1200}
          priority
          src={BETEL_VINE}
          unoptimized
          width={900}
        />
        <Image
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute -bottom-24 -right-24 h-[46%] w-auto rotate-12 opacity-25 mix-blend-screen sm:-bottom-20 sm:-right-16"
          height={900}
          priority
          src={ARECA_SPRAY}
          unoptimized
          width={900}
        />

        <article className="relative w-full max-w-[860px] overflow-hidden border border-[#D8E3DF]/35 bg-[#F1E8D8] text-[#32151F] shadow-[0_2.6rem_8rem_rgba(10,3,7,0.48)] [clip-path:polygon(4.5%_0,95.5%_0,100%_4.5%,100%_95.5%,95.5%_100%,4.5%_100%,0_95.5%,0_4.5%)]">
          <div className="pointer-events-none absolute inset-[10px] border border-[#929B98]/55 [clip-path:polygon(4%_0,96%_0,100%_4%,100%_96%,96%_100%,4%_100%,0_96%,0_4%)]" />
          <div className="grid min-h-[760px] items-stretch md:min-h-[780px] md:grid-cols-[1.02fr_0.98fr]">
            <div className="relative flex min-w-0 flex-col justify-center px-7 py-14 text-center sm:px-12 md:px-14 md:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#315A42] sm:text-xs">
                {t("invitation")}
              </p>
              <FitTextGroup>
                <div className="mt-8 min-w-0">
                  <FitText
                    className={`${coiTrauTypography.displayFontClass} w-full text-balance font-medium leading-[0.88] tracking-[-0.045em] text-[#32151F]`}
                    maxFontSize={82}
                    wrapFourWordsOnMobile
                  >
                    {people[0].shortName}
                  </FitText>
                  <p className={`${coiTrauTypography.displayFontClass} my-3 text-3xl font-light italic text-[#B85B52] sm:my-4 sm:text-4xl`}>
                    {t("and")}
                  </p>
                  <FitText
                    className={`${coiTrauTypography.displayFontClass} w-full text-balance font-medium leading-[0.88] tracking-[-0.045em] text-[#32151F]`}
                    maxFontSize={82}
                    wrapFourWordsOnMobile
                  >
                    {people[1].shortName}
                  </FitText>
                </div>
              </FitTextGroup>
              <Image
                aria-hidden="true"
                alt=""
                className="mx-auto mt-7 h-auto w-52 opacity-80 md:mx-0"
                height={180}
                src={SHELL_DIVIDER}
                unoptimized
                width={1200}
              />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#315A42] sm:text-base">
                {formatWeddingDate(content.couple.date, locale)}
              </p>
              <p className="mx-auto mt-6 max-w-[34ch] whitespace-pre-line text-sm leading-7 text-[#32151F]/72 md:mx-0">
                {invitationOpeningMessage(content)}
              </p>
            </div>

            <div className="relative min-h-[380px] overflow-hidden border-t border-[#929B98]/35 bg-[#315A42] md:min-h-0 md:border-l md:border-t-0">
              {heroImage ? (
                <Image
                  alt={t("weddingPhotoAlt", { couple: coupleLabel })}
                  className="object-cover object-center saturate-[0.82]"
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, 430px"
                  src={heroImage}
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(216,227,223,0.2),transparent_28%),linear-gradient(145deg,#315A42,#1D3C2C)]" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(50,21,31,0.82)_100%)]" />
              <div className="absolute inset-x-7 bottom-8 border-t border-[#D8E3DF]/55 pt-4 text-left text-[#F1E8D8]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D8E3DF]">
                  {t("saveTheDate")}
                </p>
                <p className={`${coiTrauTypography.displayFontClass} mt-2 text-3xl leading-none`}>
                  {coupleLabel}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    );
  },
);
