"use client";

import type { ChungDoiDemoContent } from "../signature/types";
import { LongPhungGatefoldInvitation as LongPhungGatefoldDocument } from "./gatefold/long-phung-gatefold-invitation";

/**
 * Production document entry used by the shared ChungDoi experience shell.
 * The opening shell hands off to the same DOM hero rendered here before the
 * reader continues into the document and its guest-media footer marker.
 */
export function LongPhungGatefoldInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return <LongPhungGatefoldDocument content={content} />;
}
