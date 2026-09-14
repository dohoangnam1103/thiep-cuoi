"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { JasmineWhiteInvitation as SharedJasmineWhiteInvitation } from "@chungdoi/invitation-core/signature";

export function JasmineWhiteInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <SharedJasmineWhiteInvitation content={content} />;
}
