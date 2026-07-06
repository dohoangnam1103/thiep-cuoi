"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo, useRef, type ReactNode } from "react";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Shape,
  type Group,
  type Mesh,
} from "three";

type Envelope3DProps = {
  renderCard: (onOpen: () => void) => ReactNode;
  onOpen: () => void;
  paperColor: string;
  accentColor: string;
};

// Card thiết kế ở 560px. drei Html transform dùng CSS scale literal (không map
// thẳng px→world), nên cần hệ số hiệu chỉnh để 560px phủ đúng mặt box CARD_W.
const CARD_PX = 560;
const CARD_W = 3;
const CARD_H = 2.81; // card DOM 560×524 → giữ đúng aspect 0.936
const DEPTH = 0.008; // giấy mỏng, chỉ đủ dày để có mặt bên
const CORNER = 0.08; // bo góc mặt phẳng, độc lập DEPTH
const HTML_SCALE = 0.214;

const BACK_Z = -(DEPTH / 2);

// Mặt sau vẽ nguyên bằng CanvasTexture (4 nắp + seam + bóng + wax seal) → không
// phụ thuộc góc đèn/camera, luôn nét, giữ giấy mỏng (không cần chóp hình học).
function backTexture(paper: string, accent: string) {
  if (typeof document === "undefined") return null;
  const w = 600;
  const h = Math.round(w * (CARD_H / CARD_W)); // giữ aspect mặt box
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

  // Thân phong bì: nền phẳng tối hơn để nắp trên nổi lên.
  ctx.fillStyle = shade(0.78);
  ctx.fillRect(0, 0, w, h);

  // 1 nắp trên: tam giác lớn TL→TR→tâm (đỉnh chúc xuống), gấp từ mép trên.
  // Gradient từ mép trên (sáng) xuống đỉnh (tối) → cảm giác gấp nghiêng.
  const flapGrad = ctx.createLinearGradient(0, 0, 0, cy);
  flapGrad.addColorStop(0, shade(1.08));
  flapGrad.addColorStop(1, shade(0.86));
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
  sealGrad.addColorStop(0, acc.clone().multiplyScalar(1.4).getStyle());
  sealGrad.addColorStop(1, acc.clone().multiplyScalar(0.7).getStyle());
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sealGrad;
  ctx.fill();
  ctx.lineWidth = r * 0.12;
  ctx.strokeStyle = acc.clone().multiplyScalar(0.6).getStyle();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = acc.clone().multiplyScalar(1.5).getStyle();
  ctx.font = `bold ${r * 1.05}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("囍", cx, cy + r * 0.04);

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function Envelope({ renderCard, onOpen, paperColor, accentColor }: Envelope3DProps) {
  const groupRef = useRef<Group>(null);
  const boxRef = useRef<Mesh>(null!);

  // Giấy phong bì tông ấm, đậm hơn card → tương phản với mặt thiệp gần trắng.
  const envColor = useMemo(
    () => new Color(paperColor).multiplyScalar(0.86).getStyle(),
    [paperColor],
  );

  const back = useMemo(
    () => backTexture(paperColor, accentColor),
    [paperColor, accentColor],
  );

  // Rounded-rect extrude: bo góc mặt phẳng (CORNER) độc lập với độ dày (DEPTH),
  // nên giữ giấy mỏng mà 4 góc vẫn bo. RoundedBox không làm được vì radius uniform.
  const geometry = useMemo(() => {
    const shape = new Shape();
    const hw = CARD_W / 2;
    const hh = CARD_H / 2;
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
    const geo = new ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -DEPTH / 2); // extrude chạy 0→depth, dời để tâm ở z=0
    return geo;
  }, []);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useFrame((_, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={boxRef} geometry={geometry}>
        <meshStandardMaterial color={envColor} roughness={0.85} metalness={0} />
      </mesh>

      {/* Mặt sau: 1 plane mang texture phong bì vẽ sẵn, đặt sát mặt -z của box. */}
      {back && (
        <mesh position={[0, 0, BACK_Z - 0.002]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshStandardMaterial
            map={back}
            roughness={0.8}
            metalness={0}
            side={DoubleSide}
          />
        </mesh>
      )}

      {/* Mặt thiệp = DOM thật áp phẳng lên mặt trước. occlude={[boxRef]}: khi box
          nằm giữa camera↔card (xoay ra sau) thì thân giấy che card → hết ảnh gương. */}
      <Html
        transform
        occlude={[boxRef]}
        position={[0, 0, DEPTH / 2 + 0.01]}
        scale={HTML_SCALE}
        style={{
          width: CARD_PX,
          pointerEvents: "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        zIndexRange={[10, 0]}
      >
        <div style={{ width: CARD_PX }}>{renderCard(onOpen)}</div>
      </Html>
    </group>
  );
}

export default function Envelope3D(props: Envelope3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* ambient thấp để directional tạo tương phản khối flap; thêm đèn phía sau
          để mặt phong bì (-z) luôn có sáng khi xoay tới. */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-3, 4, -5]} intensity={0.9} />
      <Envelope {...props} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.5}
        maxDistance={9}
      />
    </Canvas>
  );
}
