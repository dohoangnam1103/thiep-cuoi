"use client";

import {
  FOREST_PROP_SURFACE_POLICIES,
  type ForestPropSurface,
} from "./photoreal/forest-prop-material-policy";

type PropMaterialProps = {
  readonly color: string;
  readonly metalness: number;
  readonly opacity?: number;
  readonly roughness: number;
  readonly transparent?: true;
};

/**
 * Resolves a scene prop's colour plus the shared surface policy into
 * `meshStandardMaterial` props. Every authored prop goes through here so the
 * whole wedding set shares one roughness/metalness world and nothing reaches
 * for emissive paint to fake being lit.
 */
export function forestPropMaterial(
  surface: ForestPropSurface,
  color: string,
  opacity?: number,
): PropMaterialProps {
  const policy = FOREST_PROP_SURFACE_POLICIES[surface];
  const base = {
    color,
    metalness: policy.metalness,
    roughness: policy.roughness,
  };

  return opacity === undefined
    ? base
    : { ...base, opacity, transparent: true as const };
}
