"use client";

import type { ChungDoiDemoContent } from "../signature/types";
import {
  NguyetAnhSleeveInvitation as NguyetAnhSleeveDocument,
} from "./sleeve/nguyet-anh-sleeve-invitation";

export function NguyetAnhSleeveInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <NguyetAnhSleeveDocument content={content} />;
}
