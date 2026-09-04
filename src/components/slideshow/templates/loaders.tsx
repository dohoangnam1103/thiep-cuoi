"use client";

import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";

import type { SlideshowCompositionProps } from "../core/types";
import {
  isSupportedSlideshowTemplateVersion,
  slideshowTemplateById,
  slideshowTemplateVersionKey,
  type SlideshowTemplateId,
} from "./catalog";

const CinematicComposition = dynamic(
  () => import("./cinematic/composition").then((module) => module.CinematicComposition),
  { loading: CompositionLoading },
);

const EditorialComposition = dynamic(
  () => import("./editorial/composition").then((module) => module.EditorialComposition),
  { loading: CompositionLoading },
);

const NocturneComposition = dynamic(
  () => import("./nocturne/composition").then((module) => module.NocturneComposition),
  { loading: CompositionLoading },
);

const compositionLoaders: Record<string, ComponentType<SlideshowCompositionProps>> = {
  "cinematic@1": CinematicComposition,
  "editorial@1": EditorialComposition,
  "nocturne@1": NocturneComposition,
};

export function SlideshowComposition(
  props: SlideshowCompositionProps & {
    templateId: SlideshowTemplateId;
    templateVersion?: number;
  },
) {
  const {
    templateId,
    templateVersion = slideshowTemplateById[templateId].version,
    ...compositionProps
  } = props;
  if (!isSupportedSlideshowTemplateVersion(templateId, templateVersion)) {
    throw new Error(`Unsupported slideshow template: ${templateId}@${templateVersion}`);
  }
  const component = compositionLoaders[
    slideshowTemplateVersionKey(templateId, templateVersion)
  ];
  if (!component) {
    throw new Error(`Missing slideshow composition: ${templateId}@${templateVersion}`);
  }
  return createElement(component, compositionProps);
}

function CompositionLoading() {
  return (
    <div
      className="absolute inset-0 animate-pulse bg-[#24241f] motion-reduce:animate-none"
      aria-hidden="true"
    />
  );
}
