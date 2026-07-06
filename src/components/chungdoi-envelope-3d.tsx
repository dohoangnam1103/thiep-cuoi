"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, type ReactNode } from "react";
import { Color, type Group, type Mesh } from "three";

type Envelope3DProps = {
  renderCard: (onOpen: () => void) => ReactNode;
  onOpen: () => void;
  paperColor: string;
};

// Card thiết kế ở 560px. drei Html transform dùng CSS scale literal (không map
// thẳng px→world), nên cần hệ số hiệu chỉnh để 560px phủ đúng mặt box CARD_W.
const CARD_PX = 560;
const CARD_W = 3;
const CARD_H = 2.81; // card DOM 560×524 → giữ đúng aspect 0.936
const DEPTH = 0.02; // mỏng như 1 tờ giấy
const HTML_SCALE = 0.214;

// Đường gấp mặt sau: 4 nắp tam giác từ 4 cạnh chụm về tâm (kiểu phong bì).
const HW = CARD_W / 2;
const HH = CARD_H / 2;
const BACK_Z = -(DEPTH / 2 + 0.002);
const FOLD_POINTS: [number, number, number][][] = [
  [[-HW, HH, BACK_Z], [0, 0, BACK_Z]],
  [[HW, HH, BACK_Z], [0, 0, BACK_Z]],
  [[-HW, -HH, BACK_Z], [0, 0, BACK_Z]],
  [[HW, -HH, BACK_Z], [0, 0, BACK_Z]],
];

function Envelope({ renderCard, onOpen, paperColor }: Envelope3DProps) {
  const groupRef = useRef<Group>(null);
  const boxRef = useRef<Mesh>(null!);

  // Đường gấp = màu giấy tối hơn để thấy nếp gợi phong bì.
  const foldColor = useMemo(
    () => new Color(paperColor).multiplyScalar(0.72).getStyle(),
    [paperColor],
  );

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
      <RoundedBox ref={boxRef} args={[CARD_W, CARD_H, DEPTH]} radius={0.06} smoothness={4}>
        <meshBasicMaterial color={paperColor} toneMapped={false} />
      </RoundedBox>

      {/* Mặt sau: 4 đường gấp chụm về tâm gợi nắp phong bì. */}
      {FOLD_POINTS.map((points, i) => (
        <Line key={i} points={points} color={foldColor} lineWidth={1.2} />
      ))}

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
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, 3]} intensity={0.4} />
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
