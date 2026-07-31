"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { DoraemonDoorInvitation as DoraemonDoorDocument } from "@/components/doraemon-door/doraemon-door-invitation";

export function DoraemonDoorInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <DoraemonDoorDocument content={content} />;
}
