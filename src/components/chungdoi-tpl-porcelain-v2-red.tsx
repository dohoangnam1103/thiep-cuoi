"use client";

import { PorcelainFamilyInvitation } from "@/components/chungdoi-tpl-porcelain-family";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

export function PorcelainV2RedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <PorcelainFamilyInvitation content={content} templateSlug="porcelain-v2-red" />;
}
