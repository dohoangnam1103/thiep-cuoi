"use client";

import { PorcelainFamilyInvitation } from "@/components/chungdoi-tpl-porcelain-family";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

export function PorcelainBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <PorcelainFamilyInvitation content={content} templateSlug="porcelain-blue" />;
}
