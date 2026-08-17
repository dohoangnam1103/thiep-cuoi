// Forest prototype scene.
// Demonstrates the proposed visual upgrade: cross-quad grass tufts, layered
// conifer billboards, a continuous hedge wall, baked hedge occlusion, rim
// lighting, and tumbling petals. No shadow maps, no post-processing.

import * as THREE from "./three.module.js";
import {
  createGrassTexture,
  createConiferTexture,
  createBarkTexture,
  createPetalTexture,
  createBlobShadowTexture,
} from "./textures.js";
import {
  createGrassClumpGeometry,
  createTrunkGeometry,
  createBranchTierGeometry,
  createGroundGeometry,
} from "./geometry.js";
import {
  FOLIAGE_VERTEX_SHADER,
  FOLIAGE_FRAGMENT_SHADER,
  PETAL_VERTEX_SHADER,
  PETAL_FRAGMENT_SHADER,
} from "./shaders.js";

const SUN_DIRECTION = new THREE.Vector3(0.62, 0.55, -0.56).normalize();
const RIM_COLOR = new THREE.Color(0xffe9b0);
const HEDGE_DISTANCE = 15;
const PETAL_FALL_SPAN = 14;

function mulberry32(seed) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(0x9e3779b9);

// ---------------------------------------------------------------------------
// Renderer, scene, camera
// ---------------------------------------------------------------------------

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8c4a0);
scene.fog = new THREE.Fog(0xb4cdaa, 26, 62);

const camera = new THREE.PerspectiveCamera(
  46,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 1.68, 9.5);
camera.lookAt(0, 1.5, -2);

// ---------------------------------------------------------------------------
// Lighting. Matched to the late-afternoon reference: warm key, cool green fill.
// ---------------------------------------------------------------------------

const hemisphere = new THREE.HemisphereLight(0xfff2cd, 0x44543c, 1.18);
scene.add(hemisphere);

const ambient = new THREE.AmbientLight(0xfff0d2, 0.34);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffe6ae, 2.1);
sun.position.copy(SUN_DIRECTION).multiplyScalar(24);
scene.add(sun);

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------

const grassTexture = createGrassTexture(512);
const coniferTexture = createConiferTexture(512);
const barkTexture = createBarkTexture(256, 512);
const petalTexture = createPetalTexture(256);
const blobShadowTexture = createBlobShadowTexture(128);

// ---------------------------------------------------------------------------
// Ground with baked hedge occlusion
// ---------------------------------------------------------------------------

const ground = new THREE.Mesh(
  createGroundGeometry({ size: 70, segments: 110, hedgeDistance: HEDGE_DISTANCE }),
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.97,
    metalness: 0,
  }),
);
scene.add(ground);

// Helper: sample the undulating ground height so props sit on the surface.
function groundHeightAt(x, z) {
  return (
    Math.sin(x * 0.16) * 0.16 +
    Math.cos(z * 0.13) * 0.14 +
    Math.sin((x + z) * 0.07) * 0.1
  );
}

// ---------------------------------------------------------------------------
// Shared foliage material factory
// ---------------------------------------------------------------------------

function createFoliageMaterial(map, { ambientOcclusion = 0.45, rimStrength = 0.85 } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: FOLIAGE_VERTEX_SHADER,
    fragmentShader: FOLIAGE_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
    transparent: false,
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uWindStrength: { value: 0.16 },
      uSunDirection: { value: SUN_DIRECTION },
      uRimColor: { value: RIM_COLOR },
      uRimStrength: { value: rimStrength },
      uAmbientOcclusion: { value: ambientOcclusion },
    },
  });
}

// Attach the per-instance attributes both foliage shaders expect.
function attachFoliageAttributes(geometry, count, { tints, stiffnessRange }) {
  const tintArray = new Float32Array(count * 3);
  const phaseArray = new Float32Array(count);
  const stiffnessArray = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    color.setHex(tints[Math.floor(random() * tints.length)]);
    // Slight per-instance variation avoids a flat wall of identical colour.
    color.offsetHSL((random() - 0.5) * 0.02, (random() - 0.5) * 0.08, (random() - 0.5) * 0.07);
    color.toArray(tintArray, index * 3);
    phaseArray[index] = random() * Math.PI * 2;
    stiffnessArray[index] =
      stiffnessRange[0] + random() * (stiffnessRange[1] - stiffnessRange[0]);
  }

  geometry.setAttribute("instanceTint", new THREE.InstancedBufferAttribute(tintArray, 3));
  geometry.setAttribute("instancePhase", new THREE.InstancedBufferAttribute(phaseArray, 1));
  geometry.setAttribute(
    "instanceStiffness",
    new THREE.InstancedBufferAttribute(stiffnessArray, 1),
  );
}

// ---------------------------------------------------------------------------
// Grass carpet
// ---------------------------------------------------------------------------

const GRASS_COUNT = 2600;
const GRASS_TINTS = [0x7d9a63, 0x8aa66c, 0x94ad74, 0x6f8d58];

const grassGeometry = createGrassClumpGeometry({ planes: 3, width: 0.72, height: 0.62 });
attachFoliageAttributes(grassGeometry, GRASS_COUNT, {
  tints: GRASS_TINTS,
  stiffnessRange: [0.7, 1.25],
});

const grassMaterial = createFoliageMaterial(grassTexture, {
  ambientOcclusion: 0.38,
  rimStrength: 0.7,
});
const grassMesh = new THREE.InstancedMesh(grassGeometry, grassMaterial, GRASS_COUNT);
grassMesh.frustumCulled = false;

{
  const dummy = new THREE.Object3D();
  for (let index = 0; index < GRASS_COUNT; index += 1) {
    // Denser near the camera, thinning toward the hedge.
    const x = (random() - 0.5) * 44;
    const z = -8 + random() * 22;
    const scale = 0.72 + random() * 0.85;
    dummy.position.set(x, groundHeightAt(x, z) - 0.04, z);
    dummy.rotation.set(
      (random() - 0.5) * 0.16,
      random() * Math.PI * 2,
      (random() - 0.5) * 0.2,
    );
    dummy.scale.set(scale, scale * (0.85 + random() * 0.5), scale);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(index, dummy.matrix);
  }
}
scene.add(grassMesh);

// ---------------------------------------------------------------------------
// Hedge wall. The single biggest contributor to the reference look.
// ---------------------------------------------------------------------------

const HEDGE_LAYERS = 4;
const HEDGE_CARDS_PER_LAYER = 46;
const HEDGE_COUNT = HEDGE_LAYERS * HEDGE_CARDS_PER_LAYER;
const HEDGE_TINTS = [0x2f4a2c, 0x38553a, 0x2a4227, 0x415f3f];

const hedgeGeometry = new THREE.PlaneGeometry(3.4, 7.2, 1, 4);
hedgeGeometry.translate(0, 3.6, 0);
attachFoliageAttributes(hedgeGeometry, HEDGE_COUNT, {
  tints: HEDGE_TINTS,
  stiffnessRange: [0.18, 0.42],
});

const hedgeMaterial = createFoliageMaterial(coniferTexture, {
  ambientOcclusion: 0.22,
  rimStrength: 1.45,
});
const hedgeMesh = new THREE.InstancedMesh(hedgeGeometry, hedgeMaterial, HEDGE_COUNT);
hedgeMesh.frustumCulled = false;

{
  const dummy = new THREE.Object3D();
  let instance = 0;
  for (let layer = 0; layer < HEDGE_LAYERS; layer += 1) {
    // Each layer sits further back and slightly higher, building depth.
    const layerZ = -HEDGE_DISTANCE - layer * 2.6;
    const layerScale = 1 + layer * 0.16;
    for (let card = 0; card < HEDGE_CARDS_PER_LAYER; card += 1) {
      const x = -46 + (card / (HEDGE_CARDS_PER_LAYER - 1)) * 92 + (random() - 0.5) * 2.4;
      const z = layerZ + (random() - 0.5) * 1.8;
      dummy.position.set(x, groundHeightAt(x, z) - 0.3, z);
      dummy.rotation.set(0, (random() - 0.5) * 0.34, (random() - 0.5) * 0.06);
      const scale = layerScale * (0.86 + random() * 0.42);
      dummy.scale.set(scale, scale * (0.9 + random() * 0.5), scale);
      dummy.updateMatrix();
      hedgeMesh.setMatrixAt(instance, dummy.matrix);
      instance += 1;
    }
  }
}
scene.add(hedgeMesh);

// ---------------------------------------------------------------------------
// Hero conifer: trunk plus five tiers of billboard branch cards
// ---------------------------------------------------------------------------

const heroTree = new THREE.Group();
heroTree.position.set(-4.6, groundHeightAt(-4.6, -3.2), -3.2);
scene.add(heroTree);

const trunkMaterial = new THREE.MeshStandardMaterial({
  map: barkTexture,
  roughness: 0.94,
  metalness: 0,
});
barkTexture.repeat.set(1.4, 2.6);

const trunk = new THREE.Mesh(
  createTrunkGeometry({ height: 6.4, radiusBottom: 0.46, radiusTop: 0.15, lean: 0.2 }),
  trunkMaterial,
);
heroTree.add(trunk);

const TIER_COUNT = 5;
const TREE_TINTS = [0x3c5a38, 0x466744, 0x517350, 0x395434];

for (let tier = 0; tier < TIER_COUNT; tier += 1) {
  const t = tier / (TIER_COUNT - 1);
  // Cards narrow and rise as the tier index increases: classic conifer cone.
  const cards = 9 - tier;
  const tierGeometry = createBranchTierGeometry({
    cards,
    radius: 1.9 - t * 1.25,
    cardWidth: 2.5 - t * 1.35,
    cardHeight: 1.9 - t * 0.95,
    droop: 0.3 - t * 0.14,
  });
  attachFoliageAttributes(tierGeometry, 1, {
    tints: TREE_TINTS,
    stiffnessRange: [0.3, 0.55],
  });
  const tierMaterial = createFoliageMaterial(coniferTexture, {
    ambientOcclusion: 0.3 + t * 0.22,
    rimStrength: 1.05 + t * 0.35,
  });
  const tierMesh = new THREE.InstancedMesh(tierGeometry, tierMaterial, 1);
  const dummy = new THREE.Object3D();
  dummy.position.set(0, 1.9 + t * 4.1, 0);
  dummy.rotation.y = tier * 0.7;
  dummy.updateMatrix();
  tierMesh.setMatrixAt(0, dummy.matrix);
  tierMesh.frustumCulled = false;
  heroTree.add(tierMesh);
}

// Blob contact shadow anchors the trunk to the ground.
const trunkShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.5, 24),
  new THREE.MeshBasicMaterial({
    map: blobShadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  }),
);
trunkShadow.rotation.x = -Math.PI * 0.5;
trunkShadow.position.y = 0.03;
heroTree.add(trunkShadow);

// A couple of smaller trees for depth cueing.
for (const [x, z, scale] of [
  [5.4, -6.5, 0.72],
  [-9.2, -8.4, 0.6],
]) {
  const smallTree = heroTree.clone(true);
  smallTree.position.set(x, groundHeightAt(x, z), z);
  smallTree.scale.setScalar(scale);
  smallTree.rotation.y = random() * Math.PI * 2;
  scene.add(smallTree);
}

// ---------------------------------------------------------------------------
// Falling petals
// ---------------------------------------------------------------------------

const PETAL_COUNT = 130;
const petalGeometry = new THREE.PlaneGeometry(0.3, 0.42);

{
  const phaseArray = new Float32Array(PETAL_COUNT);
  const speedArray = new Float32Array(PETAL_COUNT);
  const scaleArray = new Float32Array(PETAL_COUNT);
  for (let index = 0; index < PETAL_COUNT; index += 1) {
    phaseArray[index] = random() * Math.PI * 2;
    speedArray[index] = 0.55 + random() * 0.85;
    scaleArray[index] = 0.72 + random() * 0.75;
  }
  petalGeometry.setAttribute(
    "instancePhase",
    new THREE.InstancedBufferAttribute(phaseArray, 1),
  );
  petalGeometry.setAttribute(
    "instanceFallSpeed",
    new THREE.InstancedBufferAttribute(speedArray, 1),
  );
  petalGeometry.setAttribute(
    "instanceScale",
    new THREE.InstancedBufferAttribute(scaleArray, 1),
  );
}

const petalMaterial = new THREE.ShaderMaterial({
  vertexShader: PETAL_VERTEX_SHADER,
  fragmentShader: PETAL_FRAGMENT_SHADER,
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  uniforms: {
    uMap: { value: petalTexture },
    uTime: { value: 0 },
    uFallSpan: { value: PETAL_FALL_SPAN },
    uWarmLight: { value: RIM_COLOR },
  },
});

const petalMesh = new THREE.InstancedMesh(petalGeometry, petalMaterial, PETAL_COUNT);
petalMesh.frustumCulled = false;
{
  const dummy = new THREE.Object3D();
  for (let index = 0; index < PETAL_COUNT; index += 1) {
    dummy.position.set(
      (random() - 0.5) * 26,
      random() * PETAL_FALL_SPAN,
      -12 + random() * 20,
    );
    dummy.updateMatrix();
    petalMesh.setMatrixAt(index, dummy.matrix);
  }
}
scene.add(petalMesh);

// ---------------------------------------------------------------------------
// Comparison: the current lab primitives, shown side by side on request
// ---------------------------------------------------------------------------

const currentGroup = new THREE.Group();
currentGroup.visible = false;
scene.add(currentGroup);

{
  // Grass as a 3-sided cone, exactly as the lab does today.
  const coneGeometry = new THREE.ConeGeometry(0.12, 0.66, 3);
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: 0x718c5e,
    roughness: 0.9,
    flatShading: true,
  });
  const coneMesh = new THREE.InstancedMesh(coneGeometry, coneMaterial, 900);
  const dummy = new THREE.Object3D();
  const coneRandom = mulberry32(0x1234abcd);
  for (let index = 0; index < 900; index += 1) {
    const x = (coneRandom() - 0.5) * 30;
    const z = -6 + coneRandom() * 16;
    dummy.position.set(x, groundHeightAt(x, z) + 0.33, z);
    dummy.rotation.y = coneRandom() * Math.PI;
    dummy.scale.setScalar(0.8 + coneRandom() * 0.6);
    dummy.updateMatrix();
    coneMesh.setMatrixAt(index, dummy.matrix);
  }
  currentGroup.add(coneMesh);

  // Tree as a cylinder plus dodecahedron canopies.
  const oldTree = new THREE.Group();
  oldTree.position.set(-4.6, groundHeightAt(-4.6, -3.2), -3.2);
  const oldTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.36, 4.45, 7),
    new THREE.MeshStandardMaterial({ color: 0x6b543d, roughness: 1, flatShading: true }),
  );
  oldTrunk.position.y = 2.2;
  oldTree.add(oldTrunk);
  for (const [ox, oy, oz, r] of [
    [0, 4.3, 0, 1.5],
    [-0.9, 3.6, 0.4, 1.15],
    [0.85, 3.9, -0.3, 1.05],
  ]) {
    const canopy = new THREE.Mesh(
      new THREE.DodecahedronGeometry(r, 0),
      new THREE.MeshStandardMaterial({ color: 0x557958, roughness: 1, flatShading: true }),
    );
    canopy.position.set(ox, oy, oz);
    oldTree.add(canopy);
  }
  currentGroup.add(oldTree);
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

const state = {
  wind: 0.16,
  showCurrent: false,
  orbit: true,
  pointerX: 0,
  pointerY: 0,
};

const foliageMaterials = [grassMaterial, hedgeMaterial];
heroTree.traverse((child) => {
  if (child.isInstancedMesh && child.material.uniforms?.uWindStrength) {
    foliageMaterials.push(child.material);
  }
});
scene.traverse((child) => {
  if (
    child.isInstancedMesh &&
    child.material.uniforms?.uWindStrength &&
    !foliageMaterials.includes(child.material)
  ) {
    foliageMaterials.push(child.material);
  }
});

document.getElementById("wind").addEventListener("input", (event) => {
  state.wind = Number(event.target.value) / 100;
});

const toggleButton = document.getElementById("toggle");
toggleButton.addEventListener("click", () => {
  state.showCurrent = !state.showCurrent;
  currentGroup.visible = state.showCurrent;
  grassMesh.visible = !state.showCurrent;
  hedgeMesh.visible = !state.showCurrent;
  petalMesh.visible = !state.showCurrent;
  heroTree.visible = !state.showCurrent;
  scene.traverse((child) => {
    if (child !== heroTree && child.isGroup && child.parent === scene && child !== currentGroup) {
      child.visible = !state.showCurrent;
    }
  });
  toggleButton.textContent = state.showCurrent
    ? "Xem bản đề xuất"
    : "Xem bản hiện tại";
  document.getElementById("label").textContent = state.showCurrent
    ? "Hiện tại: nón 3 mặt + khối đa diện"
    : "Đề xuất: cross-quad + billboard nhiều lớp";
});

document.getElementById("orbit").addEventListener("click", (event) => {
  state.orbit = !state.orbit;
  event.target.textContent = state.orbit ? "Dừng xoay" : "Tự xoay";
});

window.addEventListener("pointermove", (event) => {
  state.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  state.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();
let frameCount = 0;
let fpsAccumulator = 0;
const fpsLabel = document.getElementById("fps");

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  for (const material of foliageMaterials) {
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uWindStrength.value = state.wind;
  }
  petalMaterial.uniforms.uTime.value = elapsed;

  if (state.orbit) {
    const angle = elapsed * 0.075;
    camera.position.x = Math.sin(angle) * 5.5;
    camera.position.z = 9.5 + Math.cos(angle) * 1.4;
  }
  camera.position.y = 1.68 + state.pointerY * -0.35;
  camera.lookAt(state.pointerX * 1.6, 1.6, -3);

  renderer.render(scene, camera);

  fpsAccumulator += delta;
  frameCount += 1;
  if (fpsAccumulator >= 0.5) {
    const fps = Math.round(frameCount / fpsAccumulator);
    const info = renderer.info.render;
    fpsLabel.textContent = `${fps} fps · ${info.triangles.toLocaleString("vi-VN")} tam giác · ${info.calls} draw call`;
    fpsAccumulator = 0;
    frameCount = 0;
  }

  requestAnimationFrame(animate);
}

animate();
