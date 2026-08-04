import type { MeshStandardMaterial } from "three";

export type ForestWindUniforms = {
  readonly uTime: { value: number };
  readonly uWindHeight: { value: number };
  readonly uWindStrength: { value: number };
};

/**
 * Injects a per-instance sway into a standard material without leaving the
 * lit PBR path. `instanceWindPhase` decorrelates neighbours; `uWindHeight`
 * caps how far up the sway ramps so trunk bases stay planted.
 */
export function attachForestWind(
  material: MeshStandardMaterial,
  windHeight: number,
): ForestWindUniforms {
  const uniforms: ForestWindUniforms = {
    uTime: { value: 0 },
    uWindHeight: { value: windHeight },
    uWindStrength: { value: 0 },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWindHeight = uniforms.uWindHeight;
    shader.uniforms.uWindStrength = uniforms.uWindStrength;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float instanceWindPhase;
uniform float uTime;
uniform float uWindHeight;
uniform float uWindStrength;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float forestWindRamp = clamp(transformed.y / max(uWindHeight, 0.0001), 0.0, 1.0);
forestWindRamp *= forestWindRamp;
float forestWindSway = sin(uTime * 0.74 + instanceWindPhase)
  + 0.42 * sin(uTime * 1.63 + instanceWindPhase * 1.7);
transformed.x += forestWindSway * uWindStrength * forestWindRamp * uWindHeight;
transformed.z += cos(uTime * 0.61 + instanceWindPhase)
  * uWindStrength * forestWindRamp * uWindHeight * 0.55;`,
      );
  };

  material.customProgramCacheKey = () => "forest-wind";
  return uniforms;
}

export function driveForestWind(
  uniforms: ForestWindUniforms | null,
  time: number,
  strength: number,
  reducedMotion: boolean,
) {
  if (!uniforms) return;
  if (reducedMotion) {
    uniforms.uTime.value = 0;
    uniforms.uWindStrength.value = 0;
    return;
  }

  uniforms.uTime.value = time;
  uniforms.uWindStrength.value = strength;
}
