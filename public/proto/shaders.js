// Custom shaders for wind response and rim lighting.
// These mirror what would go into the production instanced materials.

export const FOLIAGE_VERTEX_SHADER = /* glsl */ `
  attribute vec3 instanceTint;
  attribute float instancePhase;
  attribute float instanceStiffness;

  uniform float uTime;
  uniform float uWindStrength;
  uniform vec3 uSunDirection;

  varying vec2 vUv;
  varying vec3 vTint;
  varying float vRim;
  varying float vHeight;

  void main() {
    vUv = uv;
    vTint = instanceTint;

    // uv.y is 0 at the base of the card, so wind only bends the upper part.
    float bendWeight = pow(uv.y, 1.6) * instanceStiffness;
    vHeight = uv.y;

    vec3 transformed = position;
    float wave =
      sin(uTime * 1.35 + instancePhase) * 0.62 +
      sin(uTime * 2.7 + instancePhase * 1.7) * 0.24;
    transformed.x += wave * bendWeight * uWindStrength;
    transformed.z += cos(uTime * 1.1 + instancePhase * 0.8) * bendWeight * uWindStrength * 0.45;

    vec4 instancePosition = instanceMatrix * vec4(transformed, 1.0);
    vec4 worldPosition = modelMatrix * instancePosition;

    // Approximate card normal in world space for the rim term.
    vec3 worldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
    float facing = 1.0 - abs(dot(worldNormal, viewDirection));
    float sunAlignment = max(dot(normalize(uSunDirection), worldNormal), 0.0);
    vRim = pow(facing, 2.0) * sunAlignment;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const FOLIAGE_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uRimColor;
  uniform float uRimStrength;
  uniform float uAmbientOcclusion;

  varying vec2 vUv;
  varying vec3 vTint;
  varying float vRim;
  varying float vHeight;

  void main() {
    vec4 texel = texture2D(uMap, vUv);
    if (texel.a < 0.35) discard;

    // Base darkens toward the ground: cheap stand-in for baked occlusion.
    float occlusion = mix(uAmbientOcclusion, 1.0, vHeight);
    vec3 color = texel.rgb * vTint * occlusion;

    // Sun-facing edges glow, which is what sells the late-afternoon look.
    color += uRimColor * vRim * uRimStrength;

    gl_FragColor = vec4(color, texel.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const PETAL_VERTEX_SHADER = /* glsl */ `
  attribute float instancePhase;
  attribute float instanceFallSpeed;
  attribute float instanceScale;

  uniform float uTime;
  uniform float uFallSpan;

  varying vec2 vUv;
  varying float vFacing;

  mat3 rotationMatrix(vec3 axis, float angle) {
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * a.x * a.x + c,       oc * a.x * a.y - a.z * s, oc * a.z * a.x + a.y * s,
      oc * a.x * a.y + a.z * s, oc * a.y * a.y + c,       oc * a.y * a.z - a.x * s,
      oc * a.z * a.x - a.y * s, oc * a.y * a.z + a.x * s, oc * a.z * a.z + c
    );
  }

  void main() {
    vUv = uv;

    // Independent tumble on all three axes stops the loop from reading.
    float spin = uTime * instanceFallSpeed;
    mat3 tumble =
      rotationMatrix(vec3(0.0, 1.0, 0.0), spin * 1.7 + instancePhase) *
      rotationMatrix(vec3(1.0, 0.0, 0.3), spin * 1.15 + instancePhase * 1.3) *
      rotationMatrix(vec3(0.0, 0.0, 1.0), sin(spin * 0.9 + instancePhase) * 0.8);

    vec3 transformed = tumble * (position * instanceScale);

    vec4 instancePosition = instanceMatrix * vec4(transformed, 1.0);

    // Long fall span plus per-petal drift; wraps far outside the view frustum.
    float fall = mod(
      instancePosition.y - uTime * instanceFallSpeed * 0.55 + instancePhase * 7.0,
      uFallSpan
    );
    instancePosition.y = fall;
    instancePosition.x += sin(uTime * 0.42 + instancePhase * 3.1) * 0.55;
    instancePosition.z += cos(uTime * 0.31 + instancePhase * 2.3) * 0.42;

    vec4 worldPosition = modelMatrix * instancePosition;
    vec3 worldNormal = normalize(mat3(modelMatrix) * tumble * normal);
    vFacing = abs(dot(worldNormal, normalize(cameraPosition - worldPosition.xyz)));

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const PETAL_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uWarmLight;

  varying vec2 vUv;
  varying float vFacing;

  void main() {
    vec4 texel = texture2D(uMap, vUv);
    if (texel.a < 0.2) discard;

    // Edge-on petals catch more light: a poor man's translucency.
    float translucency = pow(1.0 - vFacing, 2.5);
    vec3 color = texel.rgb + uWarmLight * translucency * 0.5;

    gl_FragColor = vec4(color, texel.a * 0.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
