import type { AbstractIntlMessages } from "next-intl";

export const homeMessageNamespaces = ["chrome", "home", "listing", "templatePreviewModal"] as const;
export const pricingMessageNamespaces = ["chrome", "pricing"] as const;
export const invitationMessageNamespaces = [
  "invitationTemplate", "invitationControls", "gatefoldLab", "sleeveLab",
  "doraemonDoorLab", "doraemonDoor", "detectiveConanCasebookLab",
  "detectiveConanCasebook", "comicHero",
] as const;

// Every EditorForm entry point also renders invitation previews.
export const editorMessageNamespaces = [
  "editor", ...invitationMessageNamespaces, "flowDemoLab", "listing",
  "templatePreviewModal", "trialCountdown", "home", "chrome",
] as const;

export function selectMessages(messages: AbstractIntlMessages, namespaces: readonly string[]) {
  const selected: AbstractIntlMessages = {};
  for (const namespace of namespaces) {
    if (!Object.hasOwn(messages, namespace) || messages[namespace] == null) throw new Error(`Missing message namespace: ${namespace}`);
    selected[namespace] = messages[namespace];
  }
  return selected;
}
