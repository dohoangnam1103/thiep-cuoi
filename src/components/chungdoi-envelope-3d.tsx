"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { toCanvas } from "html-to-image";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  LinearFilter,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type Mesh,
  type Texture,
  type WebGLRenderer,
} from "three";

import {
  ENVELOPE_TARGET_PX,
  fitEnvelopeWidth,
  responsiveEnvelopeWidth,
} from "@/components/chungdoi-envelope-constants";
import {
  beginEnvelopePointerGesture,
  shouldOpenEnvelopeFromGesture,
  updateEnvelopePointerGesture,
  type EnvelopeButtonUv,
  type EnvelopePointerGesture,
} from "@/lib/envelope-gesture";

type EnvelopeSizing = "fixed" | "responsive-natural";

type Envelope3DProps = {
  renderCard: (onOpen: () => void) => ReactNode;
  // Overlay alpha chỉ chứa text/nút/seal. Dùng cùng một lớp decor nguyên vẹn
  // phía dưới rồi phủ content lên trên → hoa liền mạch, content vẫn luôn nổi.
  renderOverlay?: () => ReactNode;
  onOpen: () => void;
  paperColor: string;
  accentColor: string;
  // Hoa tràn ra ngoài mép card được chụp nguyên vẹn trên nền trong suốt và đặt
  // giữa front texture với content overlay. Không cắt/ghép tại biên card.
  renderDecor?: () => ReactNode;
  sizing?: EnvelopeSizing;
  onProjectedSizeChange?: (size: { width: number; height: number }) => void;
  onReadyChange?: (ready: boolean) => void;
  decorVisible?: boolean;
  buttonShineEnabled?: boolean;
};

type CaptureState = "capturing" | "ready" | "failed";

type MeasuredButtonUv = {
  hitArea: EnvelopeButtonUv;
  visual: EnvelopeButtonUv;
};

// Đo box nút [data-open-btn] so với card root → chuyển sang UV mặt trước.
// DOM: top→bottom, y xuống. UV three: v đi lên → v = 1 - (y/height).
function measureButtonUV(root: HTMLElement): MeasuredButtonUv | null {
  const btn = root.querySelector<HTMLElement>("[data-open-btn]");
  if (!btn) return null;
  const r = root.getBoundingClientRect();
  const b = btn.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  const visual = {
    u0: (b.left - r.left) / r.width,
    u1: (b.right - r.left) / r.width,
    v0: 1 - (b.bottom - r.top) / r.height,
    v1: 1 - (b.top - r.top) / r.height,
  };
  // Nới nhẹ 6% mỗi phía cho dễ chạm trên mobile; lớp sáng dùng visual UV chính
  // xác để luôn bị cắt đúng trong hình pill của nút.
  const padX = (b.width * 0.06) / r.width;
  const padY = (b.height * 0.06) / r.height;
  return {
    hitArea: {
      u0: visual.u0 - padX,
      u1: visual.u1 + padX,
      v0: visual.v0 - padY,
      v1: visual.v1 + padY,
    },
    visual,
  };
}

// Card DOM chụp thành texture rồi dán lên plane phủ đúng mặt box CARD_W.
// Hẹp chiều ngang (420px) để card cao/dọc hơn — dễ xem trên điện thoại.
const CARD_PX = 420;
const CARD_W = 3;
// Đích chung: card chiếu ra màn đúng ENVELOPE_TARGET_PX bất kể chiều cao viewport
// (màn cao không làm box bự). Fallback DOM dùng cùng số để lúc tải không đổi cỡ.
// Fallback aspect (H/W) khi chưa chụp xong; sau khi chụp lấy tỉ lệ thật từ canvas.
const FALLBACK_RATIO = 1.35;
const DEPTH = 0.008; // giấy mỏng, chỉ đủ dày để có mặt bên
const CORNER = 0.08; // bo góc mặt phẳng, độc lập DEPTH
// Vùng chụp hoa rộng hơn card mỗi phía (px) để chứa phần hoa translate ra ngoài
// mép. Card region nằm giữa, hoa trồi vào vùng pad này → không bị crop.
const DECOR_PAD_PX = 220;
const BACK_Z = -(DEPTH / 2);

// Mặt sau vẽ nguyên bằng CanvasTexture (4 nắp + seam + bóng + wax seal) → không
// phụ thuộc góc đèn/camera, luôn nét, giữ giấy mỏng (không cần chóp hình học).
function backTexture(paper: string, accent: string, ratio: number) {
  if (typeof document === "undefined") return null;
  const w = 600;
  const h = Math.round(w * ratio); // giữ aspect mặt box (ratio = H/W)
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const base = new Color(paper);
  const shade = (m: number) => base.clone().multiplyScalar(m).getStyle();

  const cx = w / 2;
  const cy = h / 2;
  const TL: [number, number] = [0, 0];
  const TR: [number, number] = [w, 0];

  // Thân phong bì: nền phẳng ngang màu giấy gốc (khớp mặt trước), chỉ hơi tối.
  ctx.fillStyle = shade(0.96);
  ctx.fillRect(0, 0, w, h);

  // 1 nắp trên: tam giác lớn TL→TR→tâm (đỉnh chúc xuống), gấp từ mép trên.
  // Gradient nhẹ quanh màu gốc → cảm giác gấp nghiêng mà không lệch tông.
  const flapGrad = ctx.createLinearGradient(0, 0, 0, cy);
  flapGrad.addColorStop(0, shade(1.04));
  flapGrad.addColorStop(1, shade(0.92));
  ctx.beginPath();
  ctx.moveTo(TL[0], TL[1]);
  ctx.lineTo(TR[0], TR[1]);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = flapGrad;
  ctx.fill();

  // seam 2 cạnh nắp trên (tâm→TL, tâm→TR): đường tối lõm + highlight → emboss.
  const seam = (to: [number, number]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(to[0], to[1]);
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 1.5, cy + 1.5);
    ctx.lineTo(to[0] + 1.5, to[1] + 1.5);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  [TL, TR].forEach(seam);

  // wax seal ở đỉnh nắp trên (tâm) nơi nắp dán xuống thân.
  const acc = new Color(accent);
  const r = w * 0.11;
  const sealGrad = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.3,
    r * 0.15,
    cx,
    cy,
    r,
  );
  sealGrad.addColorStop(0, acc.clone().multiplyScalar(1.15).getStyle());
  sealGrad.addColorStop(1, acc.clone().multiplyScalar(0.85).getStyle());
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sealGrad;
  ctx.fill();
  // viền trong: sáng hơn nền seal → gờ nổi, tách chữ khỏi nền.
  ctx.lineWidth = r * 0.1;
  ctx.strokeStyle = acc.clone().multiplyScalar(1.35).getStyle();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.76, 0, Math.PI * 2);
  ctx.stroke();
  // chữ 囍 màu vàng kem sáng → tương phản mạnh trên nền đỏ, dễ đọc.
  ctx.fillStyle = "#f3e3c0";
  ctx.font = `bold ${r * 1.05}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("囍", cx, cy + r * 0.04);

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Bóng đổ của bìa. Không dùng box-shadow CSS được: card DOM bị html-to-image
// chụp thành texture và mọi shadow đã bị tắt trong capture root (Safari render
// lệch thành vệt ghost). Nên bóng phải là hình học WebGL riêng.
const SHADOW_PAD = 0.44; // world units mỗi phía = tầm loang tối đa của bóng
// Lệch xuống khá nhiều để bóng CÓ HƯỚNG. Vầng tối đều 4 phía đọc ra thành viền
// outline chứ không phải bóng; ở đây mép trên chỉ còn PAD-DROP còn mép dưới là
// PAD+DROP, nên mắt hiểu là thiệp đang nổi lên chứ không phải bị kẻ viền.
const SHADOW_DROP = 0.2;
const SHADOW_GAP = 0.05; // khoảng hở sau bìa, đủ để bóng không z-fight với mặt sau
const SHADOW_EDGE_ALPHA = 0.3; // độ tối ngay sát mép bìa
const SHADOW_FALLOFF = 2.2; // số mũ tắt dần; càng cao càng tan nhanh ra biên

// Khoảng cách có dấu tới hình chữ nhật bo góc. Cho phép tính alpha TỪNG PIXEL
// nên gradient hoàn toàn trơn, thay vì xếp nhiều rounded-rect rồi để alpha cộng
// dồn — cách đó dồn hết độ tối vào sát mép và thành viền đen. Cũng không dùng
// ctx.filter = blur() vì iOS Safari < 17 chưa có, ở đó blur bị bỏ qua lặng lẽ.
function roundedRectDistance(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  radius: number,
) {
  const qx = Math.abs(px) - halfW + radius;
  const qy = Math.abs(py) - halfH + radius;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - radius;
}

function shadowTexture(ratio: number) {
  if (typeof document === "undefined") return null;
  const cardPx = 256;
  const padPx = Math.round((cardPx * SHADOW_PAD) / CARD_W);
  const cardHPx = Math.round(cardPx * ratio);
  const width = cardPx + padPx * 2;
  const height = cardHPx + padPx * 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Texture đối xứng quanh bìa; hướng của bóng do vị trí mesh (SHADOW_DROP) lo,
  // nên đổi độ lệch không phải sinh lại texture.
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const halfW = cardPx / 2;
  const halfH = cardHPx / 2;
  const radius = (CORNER * cardPx) / CARD_W;

  for (let y = 0; y < height; y++) {
    const py = y + 0.5 - height / 2;
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - width / 2;
      const d = roundedRectDistance(px, py, halfW, halfH, radius);
      const t = Math.min(Math.max(d, 0) / padPx, 1);
      const alpha = SHADOW_EDGE_ALPHA * Math.pow(1 - t, SHADOW_FALLOFF);
      data[(y * width + x) * 4 + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(image, 0, 0);

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Bóng là con của group bìa nên luôn dính theo bìa khi xoay. Phải tự lật sang
// phía đối diện camera: nếu để cố định ở -z, khi user xoay quá 90° bóng nằm
// TRƯỚC mặt sau và phủ một khối tối lên đó.
function EnvelopeCardShadow({ cardH, ratio }: { cardH: number; ratio: number }) {
  const tex = useMemo(() => shadowTexture(ratio), [ratio]);
  useEffect(() => () => tex?.dispose(), [tex]);
  const meshRef = useRef<Mesh | null>(null);
  const cameraLocal = useRef(new Vector3());
  const offsetZ = DEPTH / 2 + SHADOW_GAP;

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    const parent = mesh?.parent;
    if (!mesh || !parent) return;
    cameraLocal.current.copy(camera.position);
    parent.worldToLocal(cameraLocal.current);
    mesh.position.z = cameraLocal.current.z >= 0 ? -offsetZ : offsetZ;
  });

  if (!tex) return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, -SHADOW_DROP, -offsetZ]}
      raycast={() => null}
      renderOrder={-1}
    >
      <planeGeometry args={[CARD_W + SHADOW_PAD * 2, cardH + SHADOW_PAD * 2]} />
      {/* Alpha đã nằm sẵn trong texture nên material giữ opacity 1 — chỉ một chỗ
          điều khiển độ tối, khỏi phải nhân hai hệ số rồi đoán kết quả. */}
      <meshBasicMaterial
        map={tex}
        color="#000000"
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// Shape bo tròn dùng chung: box extrude VÀ mặt trước phẳng đều dùng nó → mép bo
// khớp nhau, hết 4 góc plane thò ra ngoài silhouette box gây viền mờ.
function roundedRectShape(cardH: number) {
  const shape = new Shape();
  const hw = CARD_W / 2;
  const hh = cardH / 2;
  const rad = CORNER;
  shape.moveTo(-hw + rad, -hh);
  shape.lineTo(hw - rad, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + rad);
  shape.lineTo(hw, hh - rad);
  shape.quadraticCurveTo(hw, hh, hw - rad, hh);
  shape.lineTo(-hw + rad, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - rad);
  shape.lineTo(-hw, -hh + rad);
  shape.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  return shape;
}

const BUTTON_SHINE_CYCLE_SECONDS = 3;

const BUTTON_SHINE_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BUTTON_SHINE_FRAGMENT_SHADER = `
  uniform float uTime;
  varying vec2 vUv;

  float easeInOut(float value) {
    return value * value * (3.0 - 2.0 * value);
  }

  void main() {
    // Quét trong nửa đầu chu kỳ 3s rồi nghỉ ngoài mép, giống nút tham chiếu.
    float phase = mod(uTime, 3.0) / 3.0;
    float travel = easeInOut(clamp(phase * 2.0, 0.0, 1.0));
    float center = mix(-0.2, 1.2, travel);
    float distanceToCenter = abs(vUv.x - center);
    float softBeam = 1.0 - smoothstep(0.0, 0.16, distanceToCenter);
    float brightCore = 1.0 - smoothstep(0.0, 0.045, distanceToCenter);
    float alpha = softBeam * 0.22 + brightCore * 0.26;

    gl_FragColor = vec4(vec3(1.0), alpha);
  }
`;

function roundedPillShape(width: number, height: number) {
  const shape = new Shape();
  const hw = width / 2;
  const hh = height / 2;
  const radius = Math.min(hw, hh);
  shape.moveTo(-hw + radius, -hh);
  shape.lineTo(hw - radius, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);
  shape.lineTo(hw, hh - radius);
  shape.quadraticCurveTo(hw, hh, hw - radius, hh);
  shape.lineTo(-hw + radius, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);
  shape.lineTo(-hw, -hh + radius);
  shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
  return shape;
}

// Tia sáng là mesh WebGL độc lập thay vì CSS animation trong node capture: nhờ
// vậy nó chạy liên tục và xoay đúng theo bìa, không bị toCanvas() chụp thành ảnh tĩnh.
function EnvelopeButtonShine({
  buttonUV,
  cardH,
}: {
  buttonUV: EnvelopeButtonUv;
  cardH: number;
}) {
  const materialRef = useRef<ShaderMaterial | null>(null);
  const elapsedRef = useRef(0);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const { width, height, x, y } = useMemo(() => {
    const width = (buttonUV.u1 - buttonUV.u0) * CARD_W;
    const height = (buttonUV.v1 - buttonUV.v0) * cardH;
    return {
      width,
      height,
      x: ((buttonUV.u0 + buttonUV.u1) / 2 - 0.5) * CARD_W,
      y: ((buttonUV.v0 + buttonUV.v1) / 2 - 0.5) * cardH,
    };
  }, [buttonUV, cardH]);
  const geometry = useMemo(() => {
    const geo = new ShapeGeometry(roundedPillShape(width, height));
    const uv = geo.attributes.uv;
    const hw = width / 2;
    const hh = height / 2;
    for (let i = 0; i < uv.count; i++) {
      const x = uv.getX(i);
      const y = uv.getY(i);
      uv.setXY(i, (x + hw) / width, (y + hh) / height);
    }
    uv.needsUpdate = true;
    return geo;
  }, [height, width]);

  useFrame((_, delta) => {
    elapsedRef.current = (elapsedRef.current + delta) % BUTTON_SHINE_CYCLE_SECONDS;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = elapsedRef.current;
    }
  });

  return (
    <mesh
      geometry={geometry}
      position={[x, y, DEPTH / 2 + 0.008]}
      raycast={() => null}
      renderOrder={2}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={BUTTON_SHINE_VERTEX_SHADER}
        fragmentShader={BUTTON_SHINE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// Mặt trước = card DOM chụp thành texture (frontTex), mặt sau = backTexture.
// Cả 2 đều là plane WebGL cùng hệ chiếu three.js → không lệch nhau khi xoay
// (bug cũ: mặt trước là drei <Html transform>/CSS3D, mặt sau WebGL — 2 hệ
// perspective khác nhau nên trôi tách rời trên iOS Safari/Chrome).
function Envelope({
  onOpen,
  paperColor,
  accentColor,
  frontTex,
  decorTex,
  decorVisible,
  overlayTex,
  ratio,
  btnUV,
  buttonVisualUV,
  buttonShineEnabled,
  captureWidth,
  targetWidth,
  fitToViewport,
  onProjectedSizeChange,
}: {
  onOpen: () => void;
  paperColor: string;
  accentColor: string;
  frontTex: Texture | null;
  decorTex: Texture | null;
  decorVisible: boolean;
  overlayTex: Texture | null;
  ratio: number;
  btnUV: EnvelopeButtonUv | null;
  buttonVisualUV: EnvelopeButtonUv | null;
  buttonShineEnabled: boolean;
  captureWidth: number;
  targetWidth: number;
  fitToViewport: boolean;
  onProjectedSizeChange?: (size: { width: number; height: number }) => void;
}) {
  const cardH = CARD_W * ratio;
  // Mặt trước là plane RỘNG HƠN card (thêm padW mỗi phía) để chứa hoa tràn ra
  // ngoài mép — hoa nằm cùng plane với card nên xoay chung với box (3D thật).
  // Vùng card nằm CHÍNH GIỮA plane, padding trong suốt → hoa trồi ra hết box.
  const padW = (CARD_W * DECOR_PAD_PX) / captureWidth;
  const faceW = CARD_W + 2 * padW;
  const faceH = cardH + 2 * padW;

  // Scale box về target px. Mẫu opt-in còn thu đồng đều trên viewport quá thấp;
  // các mẫu mặc định giữ nguyên đúng behavior 340px hiện tại.
  const { viewport, size } = useThree();
  const projectedWidth = fitToViewport
    ? fitEnvelopeWidth({
        targetWidth,
        ratio,
        viewportWidth: size.width,
        viewportHeight: size.height,
      })
    : targetWidth;
  const scale = (projectedWidth * (viewport.width / size.width)) / CARD_W;

  useEffect(() => {
    onProjectedSizeChange?.({
      width: projectedWidth,
      height: projectedWidth * ratio,
    });
  }, [onProjectedSizeChange, projectedWidth, ratio]);

  const envColor = useMemo(
    () => new Color(paperColor).multiplyScalar(0.96).getStyle(),
    [paperColor],
  );

  const back = useMemo(
    () => backTexture(paperColor, accentColor, ratio),
    [paperColor, accentColor, ratio],
  );

  // Rounded-rect extrude: bo góc mặt phẳng (CORNER) độc lập với độ dày (DEPTH),
  // nên giữ giấy mỏng mà 4 góc vẫn bo. RoundedBox không làm được vì radius uniform.
  const geometry = useMemo(() => {
    const geo = new ExtrudeGeometry(roundedRectShape(cardH), {
      depth: DEPTH,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -DEPTH / 2); // extrude chạy 0→depth, dời để tâm ở z=0
    return geo;
  }, [cardH]);

  // Mặt trước dùng CÙNG shape bo tròn (không phải plane chữ nhật) → texture bị cắt
  // đúng theo mép bo của box, hết 4 góc thò ra ngoài silhouette gây viền mờ.
  // ShapeGeometry sinh UV theo toạ độ world nên phải remap về 0–1 cho khớp texture.
  const faceGeometry = useMemo(() => {
    const geo = new ShapeGeometry(roundedRectShape(cardH));
    const uv = geo.attributes.uv;
    const hw = CARD_W / 2;
    const hh = cardH / 2;
    for (let i = 0; i < uv.count; i++) {
      const x = uv.getX(i);
      const y = uv.getY(i);
      uv.setXY(i, (x + hw) / CARD_W, (y + hh) / cardH);
    }
    uv.needsUpdate = true;
    return geo;
  }, [cardH]);

  // Theo dõi độ lệch LỚN NHẤT trong cả gesture. Chỉ so điểm đầu-cuối là chưa đủ:
  // user có thể kéo xa rồi quay về gần điểm cũ và bị nhận nhầm thành một tap.
  const pointerGestureRef = useRef<EnvelopePointerGesture | null>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!e.isPrimary) {
      const gesture = pointerGestureRef.current;
      if (gesture) {
        pointerGestureRef.current = updateEnvelopePointerGesture(gesture, {
          pointerId: e.pointerId,
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
      return;
    }

    pointerGestureRef.current = beginEnvelopePointerGesture({
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      uv: e.object.name === "envelope-front-face" && e.uv
        ? { u: e.uv.x, v: e.uv.y }
        : null,
      button: btnUV,
    });
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const gesture = pointerGestureRef.current;
    if (!gesture) return;
    pointerGestureRef.current = updateEnvelopePointerGesture(gesture, {
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  // Mở chỉ khi pointer nhấn xuống VÀ nhả lên trong vùng nút, chưa từng kéo quá
  // ngưỡng, và không có pointer thứ hai tham gia (pinch zoom).
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    const gesture = pointerGestureRef.current;
    pointerGestureRef.current = null;
    if (
      e.object.name !== "envelope-front-face" ||
      !shouldOpenEnvelopeFromGesture({
        gesture,
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
        uv: e.uv ? { u: e.uv.x, v: e.uv.y } : null,
        button: btnUV,
      })
    ) {
      return;
    }

    e.stopPropagation();
    onOpen();
  };

  return (
    <group scale={scale}>
      <EnvelopeCardShadow cardH={cardH} ratio={ratio} />

      <mesh geometry={geometry}>
        {/* emissive = màu paper ở cường độ thấp → nền tông giấy không phụ thuộc
            đèn, directional chỉ thêm khối nhẹ, hết bị xám khi xoay ra sau. */}
        <meshStandardMaterial
          color={envColor}
          emissive={envColor}
          emissiveIntensity={0.35}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* Mặt sau dùng cùng silhouette bo tròn với thân/mặt trước. Nếu dùng plane
          chữ nhật, texture opaque sẽ lộ ra ở bốn góc khi bìa xoay. */}
      {back && (
        <mesh
          geometry={faceGeometry}
          position={[0, 0, BACK_Z - 0.002]}
          rotation={[0, Math.PI, 0]}
        >
          <meshBasicMaterial map={back} side={DoubleSide} />
        </mesh>
      )}

      {/* Mặt trước: card DOM đã chụp, dán sát mặt +z. Dùng faceGeometry bo tròn
          (không plane chữ nhật) → khớp mép box, hết góc thừa. */}
      {frontTex && (
        <mesh
          name="envelope-front-face"
          geometry={faceGeometry}
          position={[0, 0, DEPTH / 2 + 0.002]}
          onPointerCancel={() => {
            pointerGestureRef.current = null;
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <meshBasicMaterial map={frontTex} toneMapped={false} transparent />
        </mesh>
      )}

      {/* Lớp hoa: plane RỘNG HƠN card (faceW×faceH), nền trong suốt, đặt ngay
          trước mặt card. Là con của group nên xoay CÙNG box → hoa tràn ra ngoài
          mép mà vẫn "3D thật". raycast tắt để không chặn tap nút "Mở thiệp". */}
      {decorVisible && decorTex && (
        <mesh position={[0, 0, DEPTH / 2 + 0.004]} raycast={() => null}>
          <planeGeometry args={[faceW, faceH]} />
          <meshBasicMaterial map={decorTex} toneMapped={false} transparent depthWrite={false} />
        </mesh>
      )}

      {/* Text/nút/seal alpha nằm trên hoa. Cùng faceGeometry và UV với front
          texture nên khớp tuyệt đối ở mọi góc xoay, không tạo đường may. */}
      {overlayTex && (
        <mesh
          geometry={faceGeometry}
          position={[0, 0, DEPTH / 2 + 0.006]}
          raycast={() => null}
        >
          <meshBasicMaterial map={overlayTex} toneMapped={false} transparent depthWrite={false} />
        </mesh>
      )}

      {buttonShineEnabled && buttonVisualUV ? (
        <EnvelopeButtonShine buttonUV={buttonVisualUV} cardH={cardH} />
      ) : null}
    </group>
  );
}

const ENVELOPE_BREAKPOINTS = [
  "(min-width: 640px)",
  "(min-width: 768px)",
  "(min-width: 1024px)",
] as const;

function subscribeEnvelopeWidth(onStoreChange: () => void): () => void {
  const queries = ENVELOPE_BREAKPOINTS.map((query) => window.matchMedia(query));
  for (const query of queries) query.addEventListener("change", onStoreChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onStoreChange);
  };
}

function getResponsiveEnvelopeWidth(): number {
  return responsiveEnvelopeWidth(window.innerWidth);
}

function getServerEnvelopeWidth(): number {
  return ENVELOPE_TARGET_PX;
}

export default function Envelope3D({
  renderCard,
  renderOverlay,
  onOpen,
  paperColor,
  accentColor,
  renderDecor,
  decorVisible = true,
  sizing = "fixed",
  onProjectedSizeChange,
  onReadyChange,
  buttonShineEnabled = true,
}: Envelope3DProps) {
  const responsiveWidth = useSyncExternalStore(
    subscribeEnvelopeWidth,
    getResponsiveEnvelopeWidth,
    getServerEnvelopeWidth,
  );
  const naturalSizing = sizing === "responsive-natural";
  const captureWidth = naturalSizing ? responsiveWidth : CARD_PX;
  const targetWidth = naturalSizing ? responsiveWidth : ENVELOPE_TARGET_PX;
  const captureRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [frontTex, setFrontTex] = useState<Texture | null>(null);
  const [decorTex, setDecorTex] = useState<Texture | null>(null);
  const [overlayTex, setOverlayTex] = useState<Texture | null>(null);
  const frontTexRef = useRef<Texture | null>(null);
  const decorTexRef = useRef<Texture | null>(null);
  const overlayTexRef = useRef<Texture | null>(null);
  const [ratio, setRatio] = useState(FALLBACK_RATIO);
  const [captureState, setCaptureState] = useState<CaptureState>("capturing");
  // Vùng nút "Mở thiệp" trong hệ UV mặt trước (0–1). Đo runtime từ DOM đã chụp
  // → hit-test tap theo UV, mở đúng khi chạm nút bất kể card đang xoay góc nào;
  // giữ thêm visual UV không padding để cắt tia sáng đúng theo hình nút.
  const [buttonUv, setButtonUv] = useState<MeasuredButtonUv | null>(null);
  // WebGL context loss handling: iOS Safari drops context when screen off.
  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Trigger re-capture when context is restored
  const [captureTrigger, setCaptureTrigger] = useState(0);

  useEffect(() => {
    onReadyChange?.(captureState !== "capturing");
  }, [captureState, onReadyChange]);

  // Chụp card DOM (ẩn ngoài màn) → CanvasTexture cho mặt trước 3D.
  // This effect re-runs when captureState becomes "capturing" (after context loss/restore)
  // or when captureWidth/naturalSizing changes, or when captureTrigger increments.
  useEffect(() => {
    let cancelled = false;
    let pendingFrontTexture: Texture | null = null;
    let pendingDecorTexture: Texture | null = null;
    let pendingOverlayTexture: Texture | null = null;
    const node = captureRef.current;
    if (!node) return;

    const capture = async () => {
      try {
        await Promise.resolve();
        if (cancelled) return;
        frontTexRef.current?.dispose();
        frontTexRef.current = null;
        setFrontTex(null);
        decorTexRef.current?.dispose();
        decorTexRef.current = null;
        setDecorTex(null);
        overlayTexRef.current?.dispose();
        overlayTexRef.current = null;
        setOverlayTex(null);
        setButtonUv(null);

        if (document.fonts?.ready) await document.fonts.ready;
        // 2 lượt: html-to-image đôi khi trượt ảnh/font ở lượt đầu (cache lạnh).
        await toCanvas(node, { pixelRatio: 2, cacheBust: true });
        const canvas = await toCanvas(node, { pixelRatio: 2, cacheBust: true });
        if (cancelled) return;
        pendingFrontTexture = new CanvasTexture(canvas);
        pendingFrontTexture.colorSpace = SRGBColorSpace;
        pendingFrontTexture.anisotropy = 4;
        pendingFrontTexture.minFilter = LinearFilter;
        pendingFrontTexture.needsUpdate = true;
        const nextRatio = canvas.width > 0 ? canvas.height / canvas.width : FALLBACK_RATIO;
        const nextButtonUV = measureButtonUV(node);

        // Lớp hoa chụp riêng: nền trong suốt, vùng rộng hơn card (padding) để
        // chứa phần hoa tràn mép. Map lên plane lớn hơn trong group xoay.
        const decorNode = decorRef.current;
        if (decorNode) {
          const decorCard = decorNode.querySelector<HTMLElement>("[data-envelope-decor-card]");
          if (decorCard && naturalSizing) {
            decorCard.style.height = `${node.getBoundingClientRect().height}px`;
            decorCard.style.aspectRatio = "auto";
          }
          const decorCanvas = await toCanvas(decorNode, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: undefined,
          });
          if (cancelled) return;

          pendingDecorTexture = new CanvasTexture(decorCanvas);
          pendingDecorTexture.colorSpace = SRGBColorSpace;
          pendingDecorTexture.anisotropy = 4;
          pendingDecorTexture.minFilter = LinearFilter;
          pendingDecorTexture.needsUpdate = true;
        }

        const overlayNode = overlayRef.current;
        if (overlayNode) {
          const overlayCanvas = await toCanvas(overlayNode, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: undefined,
          });
          if (cancelled) return;
          pendingOverlayTexture = new CanvasTexture(overlayCanvas);
          pendingOverlayTexture.colorSpace = SRGBColorSpace;
          pendingOverlayTexture.anisotropy = 4;
          pendingOverlayTexture.minFilter = LinearFilter;
          pendingOverlayTexture.needsUpdate = true;
        }

        if (cancelled || !pendingFrontTexture) return;
        frontTexRef.current = pendingFrontTexture;
        setFrontTex(pendingFrontTexture);
        pendingFrontTexture = null;
        if (pendingDecorTexture) {
          decorTexRef.current = pendingDecorTexture;
          setDecorTex(pendingDecorTexture);
          pendingDecorTexture = null;
        }
        if (pendingOverlayTexture) {
          overlayTexRef.current = pendingOverlayTexture;
          setOverlayTex(pendingOverlayTexture);
          pendingOverlayTexture = null;
        }
        setRatio(nextRatio);
        setButtonUv(nextButtonUV);
        setCaptureState("ready");
      } catch {
        pendingFrontTexture?.dispose();
        pendingFrontTexture = null;
        pendingDecorTexture?.dispose();
        pendingDecorTexture = null;
        pendingOverlayTexture?.dispose();
        pendingOverlayTexture = null;
        // Capture lỗi thì hiện card DOM có thể bấm mở, thay vì để cover vô hình.
        if (!cancelled) setCaptureState("failed");
      }
    };
    capture();
    return () => {
      cancelled = true;
      pendingFrontTexture?.dispose();
      pendingDecorTexture?.dispose();
      pendingOverlayTexture?.dispose();
    };
  }, [captureWidth, naturalSizing, captureState, captureTrigger]);

  useEffect(() => () => {
    frontTexRef.current?.dispose();
    decorTexRef.current?.dispose();
    overlayTexRef.current?.dispose();
  }, []);

  // Handle WebGL context loss (iOS Safari drops context when screen off)
  // and visibility change (tab backgrounded). Re-capture DOM on restore.
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let contextLostHandled = false;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (contextLostHandled) return;
      contextLostHandled = true;
      setContextLost(true);
      setCaptureState("capturing");
      setFrontTex(null);
      setDecorTex(null);
      setOverlayTex(null);
      setButtonUv(null);
      frontTexRef.current?.dispose();
      decorTexRef.current?.dispose();
      overlayTexRef.current?.dispose();
      frontTexRef.current = null;
      decorTexRef.current = null;
      overlayTexRef.current = null;
    };

    const handleContextRestored = () => {
      contextLostHandled = false;
      setContextLost(false);
      // Trigger re-capture by setting capturing state
      setCaptureState("capturing");
      // Increment trigger to force effect to re-run
      setCaptureTrigger(prev => prev + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible - trigger re-capture if textures are missing
        // This handles iOS Safari which may not fire webglcontextrestored
        if (frontTex === null && captureState !== "capturing") {
          setCaptureState("capturing");
          setCaptureTrigger(prev => prev + 1);
        }
      }
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const hasFrontTexture = frontTex !== null;
  const showEnvelope = captureState === "ready" && hasFrontTexture;
  const showCaptureFallback = captureState === "failed";

  return (
    <>
      {/* Node chụp: render thật để có layout/font, nhưng đẩy ra ngoài viewport
          và ẩn khỏi a11y. Không display:none (html-to-image cần layout thật). */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: -99999,
          width: captureWidth,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        {/* Nền giấy đặc: card bo rounded-lg nên 4 góc ngoài radius trong suốt khi
            chụp → front plane transparent để lộ đen. Tô nền paper → góc thành màu
            giấy, mép bo vẫn do box 3D (ExtrudeGeometry CORNER) lo. */}
        <div
          ref={captureRef}
          className="envelope3d-capture-root"
          data-envelope-capture-root={sizing}
          data-envelope-target-width={targetWidth}
          style={{ width: captureWidth, background: paperColor }}
        >
          {/* Safari/iOS rasterize DOM qua SVG foreignObject và vẽ box-shadow lệch
              → vệt tối bên phải nút "Mở thiệp". Nên KHÔNG có box-shadow nào sống
              sót vào texture, kể cả inset. Độ nổi của nút thay bằng background
              gradient (foreignObject vẽ background đúng ở mọi engine) và của bìa
              thay bằng mesh bóng WebGL riêng — xem shadowTexture/EnvelopeCardShadow.
              filter cũng tắt vì blur trong foreignObject không đáng tin.
              Tia sáng tắt ở đây vì bản WebGL chạy riêng phía trên texture. */}
          <style>{`
            .envelope3d-capture-root * { box-shadow: none !important; filter: none !important; }
            .envelope3d-capture-root [data-open-btn] {
              background-image: linear-gradient(to bottom, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%) !important;
            }
            .envelope3d-capture-root .demo-shine::after { content: none !important; animation: none !important; }
          `}</style>
          {renderCard(() => {})}
        </div>
      </div>

      {/* Node chụp hoa RIÊNG: vùng rộng hơn card DECOR_PAD_PX mỗi phía, nền trong
          suốt. Card ảo (kích thước captureWidth, trong suốt) đặt giữa qua padding →
          hoa translate ngoài mép card rơi vào vùng pad, không bị crop. Map lên
          plane faceW×faceH khớp đúng vì cùng tỉ lệ pad/card. */}
      {renderDecor ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: -99999,
            width: captureWidth + 2 * DECOR_PAD_PX,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          {/* padding (không margin) trên chính node chụp → tránh margin-collapse
              làm card ảo dồn lên đỉnh, lệch cả lớp hoa. box-sizing border-box để
              vùng nội dung = captureWidth, card nằm CHÍNH GIỮA vùng pad. */}
          <div
            ref={decorRef}
            style={{
              boxSizing: "border-box",
              width: captureWidth + 2 * DECOR_PAD_PX,
              padding: DECOR_PAD_PX,
            }}
          >
            {/* Node này cũng đi qua toCanvas() nên chịu đúng bug foreignObject của
                Safari. Chặn sẵn box-shadow/filter kể cả khi hiện chưa mẫu nào dùng,
                để một artwork thêm sau không lặng lẽ tạo lại vệt ghost. */}
            <style>{`
              [data-envelope-decor-card] * { box-shadow: none !important; filter: none !important; }
            `}</style>
            <div
              data-envelope-decor-card
              data-envelope-decor-compositing="full-layer"
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: naturalSizing ? undefined : "3 / 4.5",
              }}
            >
              {renderDecor()}
            </div>
          </div>
        </div>
      ) : null}

      {/* Content overlay trong suốt có cùng width/height card. Không nền, không
          decor; chỉ text/nút/seal để luôn nằm trên plane hoa nguyên vẹn. */}
      {renderOverlay ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: -99999,
            width: captureWidth,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <div
            ref={overlayRef}
            data-envelope-content-overlay-root
            style={{ width: captureWidth }}
          >
            {/* Cùng lý do như capture root: không box-shadow, độ nổi của nút do
                gradient. Overlay là lớp nằm trên cùng nên nút người dùng thấy
                chính là bản này — phải khớp hệt bản trong front texture. */}
            <style>{`
              [data-envelope-content-overlay-root] * { box-shadow: none !important; filter: none !important; }
              [data-envelope-content-overlay-root] [data-open-btn] {
                background-image: linear-gradient(to bottom, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%) !important;
              }
              [data-envelope-content-overlay-root] .demo-shine::after { content: none !important; animation: none !important; }
            `}</style>
            {renderOverlay()}
          </div>
        </div>
      ) : null}

      {showCaptureFallback ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          data-envelope-capture-fallback
        >
          <div style={{ width: targetWidth }}>
            {renderCard(onOpen)}
          </div>
        </div>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 40 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{
            width: "100%",
            height: "100%",
            opacity: showEnvelope ? 1 : 0,
            pointerEvents: showEnvelope ? "auto" : "none",
            transition: "opacity 160ms ease-out",
          }}
          onCreated={({ gl }) => {
            canvasRef.current = gl.domElement;
          }}
        >
          {/* ambient cao giữ tông giấy đều; 2 directional yếu chỉ thêm khối nhẹ +
              sáng mặt sau (-z) khi xoay tới, không làm xám. */}
          <ambientLight intensity={1.0} />
          <directionalLight position={[4, 6, 5]} intensity={0.5} />
          <directionalLight position={[-3, 4, -5]} intensity={0.4} />
          {showEnvelope ? (
            <Envelope
              onOpen={onOpen}
              paperColor={paperColor}
              accentColor={accentColor}
              frontTex={frontTex}
              decorTex={decorTex}
              decorVisible={decorVisible}
              overlayTex={overlayTex}
              ratio={ratio}
              btnUV={buttonUv?.hitArea ?? null}
              buttonVisualUV={buttonUv?.visual ?? null}
              buttonShineEnabled={buttonShineEnabled}
              captureWidth={captureWidth}
              targetWidth={targetWidth}
              fitToViewport={naturalSizing}
              onProjectedSizeChange={onProjectedSizeChange}
            />
          ) : null}
          {showEnvelope ? (
            <OrbitControls
              autoRotate={false}
              enableRotate
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minDistance={3.5}
              maxDistance={9}
            />
          ) : null}
        </Canvas>
      )}
    </>
  );
}
