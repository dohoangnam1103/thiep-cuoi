"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  NguyetAnhSleeveInvitation as NguyetAnhSleeveDocument,
} from "@/components/sleeve/nguyet-anh-sleeve-invitation";

export function NguyetAnhSleeveInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <NguyetAnhSleeveDocument content={content} />;
}
