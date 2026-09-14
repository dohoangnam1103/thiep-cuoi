"use client";

export const SIGNATURE_RENDERER_SLUGS = [
  "jasmine-white",
  "silk-flora-brown",
] as const;

export type SignatureRendererSlug =
  (typeof SIGNATURE_RENDERER_SLUGS)[number];

export type { InvitationRenderContent } from "./types";
export { JasmineWhiteInvitation } from "./jasmine-white";
export { SilkFloraBrownInvitation } from "./silk-flora-brown";

import { JasmineWhiteInvitation } from "./jasmine-white";
import { SilkFloraBrownInvitation } from "./silk-flora-brown";

const RENDERERS = {
  "jasmine-white": JasmineWhiteInvitation,
  "silk-flora-brown": SilkFloraBrownInvitation,
} as const;

export function getSignatureRenderer(slug: string) {
  return (RENDERERS as Record<string, unknown>)[slug] as
    | typeof JasmineWhiteInvitation
    | undefined;
}
