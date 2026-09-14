"use client";

import type { ChungDoiDemoContent } from "../signature/types";
import { DoraemonDoorInvitation as DoraemonDoorDocument } from "./doraemon-door/doraemon-door-invitation";

export function DoraemonDoorInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <DoraemonDoorDocument content={content} />;
}
