"use client";

import { useTranslations } from "next-intl";

import { MinimalismDarkBlueInvitation as MinimalismDarkBlueRenderer } from "@/components/chungdoi-tpl-minimalism-dark-red";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

export function MinimalismDarkBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  void useTranslations("invitationTemplate");
  return <MinimalismDarkBlueRenderer content={content} />;
}
