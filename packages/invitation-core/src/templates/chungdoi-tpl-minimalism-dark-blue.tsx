"use client";

import { useTranslations } from "next-intl";

import { MinimalismDarkBlueInvitation as MinimalismDarkBlueRenderer } from "./chungdoi-tpl-minimalism-dark-red";
import type { ChungDoiDemoContent } from "../signature/types";

export function MinimalismDarkBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  void useTranslations("invitationTemplate");
  return <MinimalismDarkBlueRenderer content={content} />;
}
