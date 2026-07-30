"use client";

import { CalendarDays, Clock3, Heart, MapPin } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type {
  StudioDecoration,
  StudioPalette,
  StudioSection,
  StudioSource,
  StudioSpec,
  StudioTypography,
} from "@/lib/template-studio";

const paletteClasses: Record<StudioPalette, {
  shell: string;
  surface: string;
  soft: string;
  accent: string;
  button: string;
  overlay: string;
}> = {
  crimson: {
    shell: "bg-[#671d2b] text-[#fff8ed]",
    surface: "bg-[#fff8ed] text-[#671d2b]",
    soft: "bg-[#f4e3d3] text-[#671d2b]",
    accent: "text-[#d9ad63] border-[#d9ad63]",
    button: "bg-[#671d2b] text-[#fff8ed]",
    overlay: "from-[#2d0710]/85 via-[#671d2b]/30 to-transparent",
  },
  sage: {
    shell: "bg-[#415b4b] text-[#f7f1e5]",
    surface: "bg-[#f7f1e5] text-[#30483a]",
    soft: "bg-[#dfe8db] text-[#30483a]",
    accent: "text-[#b89555] border-[#b89555]",
    button: "bg-[#415b4b] text-[#f7f1e5]",
    overlay: "from-[#1d3025]/85 via-[#415b4b]/25 to-transparent",
  },
  midnight: {
    shell: "bg-[#13223d] text-[#f5eddf]",
    surface: "bg-[#f5eddf] text-[#13223d]",
    soft: "bg-[#dce3ec] text-[#13223d]",
    accent: "text-[#c7a45b] border-[#c7a45b]",
    button: "bg-[#13223d] text-[#f5eddf]",
    overlay: "from-[#071226]/90 via-[#13223d]/30 to-transparent",
  },
  ivory: {
    shell: "bg-[#ede7db] text-[#3d4636]",
    surface: "bg-[#fffdf8] text-[#3d4636]",
    soft: "bg-[#e5e1d4] text-[#3d4636]",
    accent: "text-[#8b7450] border-[#8b7450]",
    button: "bg-[#3d4636] text-[#fffdf8]",
    overlay: "from-[#30372b]/75 via-[#3d4636]/15 to-transparent",
  },
  terracotta: {
    shell: "bg-[#a64f3b] text-[#fff4df]",
    surface: "bg-[#fff4df] text-[#713b2e]",
    soft: "bg-[#ecd2b7] text-[#713b2e]",
    accent: "text-[#956b35] border-[#956b35]",
    button: "bg-[#a64f3b] text-[#fff4df]",
    overlay: "from-[#512116]/85 via-[#a64f3b]/25 to-transparent",
  },
  lavender: {
    shell: "bg-[#665174] text-[#fff7fb]",
    surface: "bg-[#fff7fb] text-[#55405e]",
    soft: "bg-[#eadfea] text-[#55405e]",
    accent: "text-[#a17b55] border-[#a17b55]",
    button: "bg-[#665174] text-[#fff7fb]",
    overlay: "from-[#2e1e39]/85 via-[#665174]/25 to-transparent",
  },
};

const typographyClasses: Record<StudioTypography, { heading: string; body: string; tracking: string }> = {
  romantic: { heading: "font-art-signora", body: "font-art-lora", tracking: "tracking-normal" },
  editorial: { heading: "font-art-lora uppercase", body: "font-art-helvetica", tracking: "tracking-[0.16em]" },
  modern: { heading: "font-art-helvetica", body: "font-art-helvetica", tracking: "tracking-[-0.03em]" },
  heritage: { heading: "font-art-uni", body: "font-art-lora", tracking: "tracking-wide" },
};

function Decoration({ type, className }: { type: StudioDecoration; className?: string }) {
  if (type === "none") return null;
  if (type === "traditional") {
    return <span aria-hidden="true" className={cn("font-art-uni text-4xl opacity-70", className)}>囍</span>;
  }
  if (type === "line-art") {
    return <span aria-hidden="true" className={cn("text-3xl font-light opacity-60", className)}>◇ — ◇</span>;
  }
  return <span aria-hidden="true" className={cn("text-3xl opacity-65", className)}>❀ ❦ ❀</span>;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(date);
}

function HeroSection({
  spec,
  source,
  wide,
}: {
  spec: StudioSpec;
  source: StudioSource;
  wide: boolean;
}) {
  const t = useTranslations("templateStudio");
  const palette = paletteClasses[spec.palette];
  const type = typographyClasses[spec.typography];
  const split = spec.layout === "split" && wide;
  const minimal = spec.heroStyle === "minimal";
  const imageClass = spec.heroStyle === "arch" ? "rounded-t-[50%]" : "rounded-none";

  if (minimal) {
    return (
      <section className={cn("flex min-h-[520px] flex-col items-center justify-center px-8 py-20 text-center", palette.shell)}>
        <Decoration type={spec.decoration} className={palette.accent} />
        <p className={cn("mt-8 text-[10px] font-bold uppercase", type.tracking)}>{spec.copy.eyebrow}</p>
        <h1 className={cn("mt-8 text-5xl leading-tight", type.heading, type.tracking)}>
          {source.groomName}<span className="block text-3xl opacity-70">&</span>{source.brideName}
        </h1>
        <div className={cn("mt-10 border-y py-3 text-sm uppercase", palette.accent, type.tracking)}>
          {formatDate(source.date)}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("relative overflow-hidden", palette.shell, split ? "grid grid-cols-2" : "min-h-[620px]")}>
      <div className={cn("relative overflow-hidden", split ? "min-h-[620px]" : "absolute inset-0", imageClass)}>
        <Image src={source.heroImage} alt={t("previewHeroAlt")} fill sizes={wide ? "720px" : "390px"} className="object-cover" />
      </div>
      <div className={cn(
        "relative z-10 flex flex-col justify-end p-8",
        split ? "min-h-[620px] bg-current/0 text-center" : `min-h-[620px] bg-gradient-to-t ${palette.overlay} text-center`,
        spec.layout === "editorial" && !split ? "items-start text-left" : "items-center",
      )}>
        <Decoration type={spec.decoration} />
        <p className={cn("mt-5 text-[10px] font-bold uppercase", type.tracking)}>{spec.copy.eyebrow}</p>
        <h1 className={cn("mt-4 text-5xl leading-tight", type.heading, type.tracking)}>
          {source.groomName}<span className="mx-2 text-3xl opacity-80">&</span>{source.brideName}
        </h1>
        <p className={cn("mt-5 text-xs uppercase", type.tracking)}>{formatDate(source.date)}</p>
      </div>
    </section>
  );
}

function StorySection({ spec }: { spec: StudioSpec }) {
  const t = useTranslations("templateStudio");
  const palette = paletteClasses[spec.palette];
  const type = typographyClasses[spec.typography];
  return (
    <section className={cn("px-7 py-16 text-center", palette.surface, type.body)}>
      <Decoration type={spec.decoration} className={palette.accent} />
      <p className={cn("mt-6 text-[10px] font-bold uppercase", palette.accent, type.tracking)}>{t("previewStoryEyebrow")}</p>
      <h2 className={cn("mt-3 text-3xl", type.heading)}>{t("previewStoryTitle")}</h2>
      <blockquote className="mx-auto mt-6 max-w-md text-base italic leading-8 opacity-75">“{spec.copy.quote}”</blockquote>
    </section>
  );
}

function DetailsSection({ spec, source }: { spec: StudioSpec; source: StudioSource }) {
  const t = useTranslations("templateStudio");
  const palette = paletteClasses[spec.palette];
  const type = typographyClasses[spec.typography];
  return (
    <section className={cn("px-7 py-16 text-center", palette.soft, type.body)}>
      <p className={cn("text-[10px] font-bold uppercase", palette.accent, type.tracking)}>{t("previewInvitation")}</p>
      <h2 className={cn("mt-3 text-3xl", type.heading)}>{t("previewCeremony")}</h2>
      <div className="mx-auto mt-8 grid max-w-lg gap-4 text-left sm:grid-cols-2">
        <div className={cn("rounded-3xl border border-current/10 p-5", palette.surface)}>
          <CalendarDays className={cn("size-5", palette.accent)} />
          <p className="mt-3 text-xs font-bold uppercase opacity-55">{t("previewDate")}</p>
          <p className="mt-1 text-sm font-semibold">{formatDate(source.date)}</p>
        </div>
        <div className={cn("rounded-3xl border border-current/10 p-5", palette.surface)}>
          <Clock3 className={cn("size-5", palette.accent)} />
          <p className="mt-3 text-xs font-bold uppercase opacity-55">{t("previewTime")}</p>
          <p className="mt-1 text-sm font-semibold">{source.time}</p>
        </div>
      </div>
      <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-current/10 p-5 text-left">
        <MapPin className={cn("size-5", palette.accent)} />
        <p className="mt-3 text-xs font-bold uppercase opacity-55">{t("previewVenue")}</p>
        <p className="mt-1 text-sm leading-6">{source.venue}</p>
      </div>
    </section>
  );
}

function ScheduleSection({ spec, source }: { spec: StudioSpec; source: StudioSource }) {
  const t = useTranslations("templateStudio");
  const palette = paletteClasses[spec.palette];
  const type = typographyClasses[spec.typography];
  const fallback = [
    { time: "17:30", label: t("previewWelcome") },
    { time: "18:30", label: t("previewParty") },
    { time: "20:30", label: t("previewClosing") },
  ];
  const schedule = source.schedule.length ? source.schedule.slice(0, 5) : fallback;
  return (
    <section className={cn("px-7 py-16", palette.surface, type.body)}>
      <div className="text-center">
        <Decoration type={spec.decoration} className={palette.accent} />
        <h2 className={cn("mt-4 text-3xl", type.heading)}>{t("previewSchedule")}</h2>
      </div>
      <div className="mx-auto mt-8 max-w-md space-y-3">
        {schedule.map((item, index) => (
          <div key={`${item.time}-${item.label}-${index}`} className="flex items-center gap-4 border-b border-current/10 py-3 text-sm">
            <span className={cn("font-bold", palette.accent)}>{item.time}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ spec, source, wide }: { spec: StudioSpec; source: StudioSource; wide: boolean }) {
  const t = useTranslations("templateStudio");
  const palette = paletteClasses[spec.palette];
  const type = typographyClasses[spec.typography];
  return (
    <section className={cn("px-5 py-16", palette.soft, type.body)}>
      <h2 className={cn("text-center text-3xl", type.heading)}>{t("previewGallery")}</h2>
      <div className={cn("mt-8 grid gap-2", wide ? "grid-cols-3" : "grid-cols-2")}>
        {source.gallery.slice(0, 6).map((image, index) => (
          <div key={image} className={cn("relative overflow-hidden rounded-2xl", index === 0 && wide ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/5]")}>
            <Image src={image} alt={t("previewGalleryAlt", { number: index + 1 })} fill sizes={wide ? "240px" : "195px"} className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RsvpSection({ spec }: { spec: StudioSpec }) {
  const t = useTranslations("templateStudio");
  const palette = paletteClasses[spec.palette];
  const type = typographyClasses[spec.typography];
  return (
    <section className={cn("px-7 py-16 text-center", palette.shell, type.body)}>
      <Heart className="mx-auto size-7" />
      <h2 className={cn("mt-5 text-3xl", type.heading)}>{t("previewRsvp")}</h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 opacity-75">{spec.copy.closing}</p>
      <button type="button" className={cn("mt-7 rounded-full border border-current/30 px-7 py-3 text-xs font-bold uppercase", palette.surface, type.tracking)}>
        {t("previewConfirm")}
      </button>
    </section>
  );
}

export function TemplateStudioPreview({
  spec,
  source,
  viewport,
}: {
  spec: StudioSpec;
  source: StudioSource;
  viewport: "mobile" | "desktop";
}) {
  const wide = viewport === "desktop";

  function renderSection(section: StudioSection) {
    switch (section) {
      case "hero":
        return <HeroSection spec={spec} source={source} wide={wide} />;
      case "story":
        return <StorySection spec={spec} />;
      case "details":
        return <DetailsSection spec={spec} source={source} />;
      case "schedule":
        return <ScheduleSection spec={spec} source={source} />;
      case "gallery":
        return <GallerySection spec={spec} source={source} wide={wide} />;
      case "rsvp":
        return <RsvpSection spec={spec} />;
    }
  }

  return (
    <div className={cn("mx-auto overflow-hidden bg-white shadow-2xl transition-[width] duration-300", wide ? "w-full max-w-[760px] rounded-3xl" : "w-full max-w-[390px] rounded-[2.5rem]")}>
      {spec.sectionOrder.map((section) => <div key={section}>{renderSection(section)}</div>)}
    </div>
  );
}