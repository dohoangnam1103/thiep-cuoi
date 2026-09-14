"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { SilkFloraBrownInvitation as SharedSilkFloraBrownInvitation } from "@chungdoi/invitation-core/signature";

export function SilkFloraBrownInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <SharedSilkFloraBrownInvitation content={content} />;
}
