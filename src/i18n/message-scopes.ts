import type { AbstractIntlMessages } from "next-intl";

export const homeMessageNamespaces = ["chrome", "home", "listing", "templatePreviewModal"] as const;
export const templateSeoDetailMessageNamespaces = ["templateSeoDetails"] as const;
export const pricingMessageNamespaces = ["chrome", "pricing"] as const;
export const invitationMessageNamespaces = [
  "invitationTemplate", "invitationBranding", "invitationControls", "gatefoldLab", "sleeveLab",
  "coiTrauLab", "banVeToAmTemplate", "doraemonDoorLab",
  "doraemonDoor", "detectiveConanCasebookLab", "detectiveConanCasebook",
  "comicHero", "hoaMaiThuyMac",
] as const;

// Every EditorForm entry point also renders invitation previews.
export const editorMessageNamespaces = [
  "editor", ...invitationMessageNamespaces, "flowDemoLab", "listing",
  "templatePreviewModal", "trialCountdown", "home", "chrome",
] as const;

export function selectMessages(messages: AbstractIntlMessages | Record<string, unknown>, namespaces: readonly string[]) {
  const selected: Record<string, unknown> = {};
  for (const namespace of namespaces) {
    if (!Object.hasOwn(messages, namespace) || messages[namespace] == null) throw new Error(`Missing message namespace: ${namespace}`);
    selected[namespace] = messages[namespace];
  }
  return selected as AbstractIntlMessages;
}
