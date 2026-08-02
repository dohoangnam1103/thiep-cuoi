"use client";

import { DetectiveConanCasebookReader } from "@/components/detective-conan-casebook/conan-casebook-reader";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

export function DetectiveConanCasebookInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <DetectiveConanCasebookReader content={content} />;
}
