"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toCanvas } from "html-to-image";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  LinearFilter,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Group,
  type Texture,
} from "three";

type Envelope3DProps = {
  renderCard: (onOpen: () => void) => ReactNode;
  onOpen: () => void;
  paperColor: string;
  accentColor: string;
};

// Vùng nút trong hệ UV mặt trước (0–1), gốc dưới-trái (three UV convention).
type BtnUV = { u0: number; u1: number; v0: number; v1: number };

// Đo box nút [data-open-btn] so với card root → chuyển sang UV mặt trước.
// DOM: top→bottom, y xuống. UV three: v đi lên → v = 1 - (y/height).
function measureButtonUV(root: HTMLElement): BtnUV | null {
  const btn = root.querySelector<HTMLElement>("[data-open-btn]");
  if (!btn) return null;
  const r = root.getBoundingClientRect();
  const b = btn.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  // Nới nhẹ 6% mỗi phía cho dễ chạm trên mobile.
  const padX = (b.width * 0.06) / r.width;
  const padY = (b.height * 0.06) / r.height;
  const u0 = (b.left - r.left) / r.width - padX;
  const u1 = (b.right - r.left) / r.width + padX;
  const yTop = (b.top - r.top) / r.height;
  const yBot = (b.bottom - r.top) / r.height;
  return { u0, u1, v0: 1 - yBot - padY, v1: 1 - yTop + padY };
}

// Card DOM chụp thành texture rồi dán lên plane phủ đúng mặt box CARD_W.
// Hẹp chiều ngang (420px) để card cao/dọc hơn — dễ xem trên điện thoại.
const CARD_PX = 420;
const CARD_W = 3;
// Đích chung: card chiếu ra màn đúng TARGET_PX bất kể chiều cao viewport (màn cao
// không làm box bự). Demo dùng CÙNG số này cho DOM lúc mở → swap 3D→DOM không giật.
export const TARGET_PX = 340;
// Fallback aspect (H/W) khi chưa chụp xong; sau khi chụp lấy tỉ lệ thật từ canvas.
const FALLBACK_RATIO = 1.35;
const DEPTH = 0.008; // giấy mỏng, chỉ đủ dày để có mặt bên
const CORNER = 0.08; // bo góc mặt phẳng, độc lập DEPTH

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

// Mặt trước = card DOM chụp thành texture (frontTex), mặt sau = backTexture.
// Cả 2 đều là plane WebGL cùng hệ chiếu three.js → không lệch nhau khi xoay
// (bug cũ: mặt trước là drei <Html transform>/CSS3D, mặt sau WebGL — 2 hệ
// perspective khác nhau nên trôi tách rời trên iOS Safari/Chrome).
function Envelope({
  onOpen,
  paperColor,
  accentColor,
  frontTex,
  ratio,
  btnUV,
}: {
  onOpen: () => void;
  paperColor: string;
  accentColor: string;
  frontTex: Texture | null;
  ratio: number;
  btnUV: BtnUV | null;
}) {
  const groupRef = useRef<Group>(null);
  const cardH = CARD_W * ratio;

  // Scale box sao cho chiều ngang CARD_W (world) chiếu ra đúng TARGET_PX trên màn,
  // bất kể chiều cao viewport → màn desktop cao không làm thiệp bự. worldPerPx =
  // viewport.width/size.width (world unit trên 1 px màn ở z=0).
  const { viewport, size } = useThree();
  const scale = (TARGET_PX * (viewport.width / size.width)) / CARD_W;

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

  // Drag xoay (OrbitControls) kết thúc bằng pointerup → trình duyệt tính là click,
  // làm mở thiệp ngoài ý muốn. Lưu điểm pointerdown, chỉ mở nếu con trỏ gần như
  // đứng yên (< 6px) → phân biệt tap thật với kéo xoay.
  const downPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };

  // Mở CHỈ khi tap gần như đứng yên (phân biệt kéo xoay) VÀ điểm chạm rơi trong
  // vùng nút theo UV mặt trước. e.uv có sẵn vì raycast trúng mesh có texture.
  const handleFacePointerUp = (e: ThreeEvent<PointerEvent>) => {
    const start = downPos.current;
    downPos.current = null;
    if (!start || !btnUV || !e.uv) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (moved > 6) return; // kéo xoay → không mở
    const u = e.uv.x;
    const v = e.uv.y;
    if (u < btnUV.u0 || u > btnUV.u1 || v < btnUV.v0 || v > btnUV.v1) return;
    e.stopPropagation();
    onOpen();
  };

  return (
    <group ref={groupRef} scale={scale} onPointerDown={handlePointerDown}>
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

      {/* Mặt sau: 1 plane mang texture phong bì vẽ sẵn, đặt sát mặt -z của box. */}
      {back && (
        <mesh position={[0, 0, BACK_Z - 0.002]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_W, cardH]} />
          <meshBasicMaterial map={back} side={DoubleSide} />
        </mesh>
      )}

      {/* Mặt trước: card DOM đã chụp, dán sát mặt +z. Dùng faceGeometry bo tròn
          (không plane chữ nhật) → khớp mép box, hết góc thừa. */}
      {frontTex && (
        <mesh geometry={faceGeometry} position={[0, 0, DEPTH / 2 + 0.002]} onPointerUp={handleFacePointerUp}>
          <meshBasicMaterial map={frontTex} toneMapped={false} transparent />
        </mesh>
      )}
    </group>
  );
}

export default function Envelope3D({
  renderCard,
  onOpen,
  paperColor,
  accentColor,
}: Envelope3DProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [frontTex, setFrontTex] = useState<Texture | null>(null);
  const [ratio, setRatio] = useState(FALLBACK_RATIO);
  // Vùng nút "Mở thiệp" trong hệ UV mặt trước (0–1). Đo runtime từ DOM đã chụp
  // → hit-test tap theo UV, mở đúng khi chạm nút bất kể card đang xoay góc nào.
  const [btnUV, setBtnUV] = useState<BtnUV | null>(null);

  // Chụp card DOM (ẩn ngoài màn) → CanvasTexture cho mặt trước 3D.
  useEffect(() => {
    let cancelled = false;
    const node = captureRef.current;
    if (!node) return;

    const capture = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        // 2 lượt: html-to-image đôi khi trượt ảnh/font ở lượt đầu (cache lạnh).
        await toCanvas(node, { pixelRatio: 2, cacheBust: true });
        const canvas = await toCanvas(node, { pixelRatio: 2, cacheBust: true });
        if (cancelled) return;
        const tex = new CanvasTexture(canvas);
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 4;
        tex.minFilter = LinearFilter;
        tex.needsUpdate = true;
        if (canvas.width > 0) setRatio(canvas.height / canvas.width);
        setFrontTex(tex);
        setBtnUV(measureButtonUV(node));
      } catch {
        // Chụp lỗi → mặt trước để trống (box giấy vẫn hiện), user vẫn mở được.
      }
    };
    capture();
    return () => {
      cancelled = true;
    };
  }, []);

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
          width: CARD_PX,
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
          style={{ width: CARD_PX, background: paperColor }}
        >
          {/* Safari/iOS: html-to-image render box-shadow lệch → ghost mờ bên phải
              trên texture. Tắt shadow trong node chụp; khối depth do box 3D lo. */}
          <style>{".envelope3d-capture-root *{box-shadow:none!important;filter:none!important}"}</style>
          {renderCard(() => {})}
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* ambient cao giữ tông giấy đều; 2 directional yếu chỉ thêm khối nhẹ +
            sáng mặt sau (-z) khi xoay tới, không làm xám. */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[4, 6, 5]} intensity={0.5} />
        <directionalLight position={[-3, 4, -5]} intensity={0.4} />
        <Envelope
          onOpen={onOpen}
          paperColor={paperColor}
          accentColor={accentColor}
          frontTex={frontTex}
          ratio={ratio}
          btnUV={btnUV}
        />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3.5}
          maxDistance={9}
        />
      </Canvas>
    </>
  );
}
