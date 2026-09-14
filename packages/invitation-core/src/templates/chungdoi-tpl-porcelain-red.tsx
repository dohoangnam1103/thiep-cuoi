"use client";

import { PorcelainFamilyInvitation } from "./chungdoi-tpl-porcelain-family";
import type { ChungDoiDemoContent } from "../signature/types";

export function PorcelainRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <PorcelainFamilyInvitation content={content} templateSlug="porcelain-red" />;
}
