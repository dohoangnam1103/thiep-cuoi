"use client";

import { DetectiveConanCasebookReader } from "./detective-conan-casebook/conan-casebook-reader";
import type { ChungDoiDemoContent } from "../signature/types";

export function DetectiveConanCasebookInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <DetectiveConanCasebookReader content={content} />;
}
