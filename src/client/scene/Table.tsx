import { useMemo } from 'react';
import * as THREE from 'three';
import { CHAM, DIEP, HOE, INK, LA, PAPER, SON } from '../theme';
import { canvasTexture, cloud, Ink, speckle, toon } from './toon';

/** Bàn gỗ trải một tờ bản đồ in khắc trên giấy dó. */
export function Table() {
  const map = useMemo(
    () =>
      canvasTexture(2048, 2048, (g) => {
        const S = 2048;
        g.fillStyle = PAPER;
        g.fillRect(0, 0, S, S);
        speckle(g, S, S, 26000);
        speckle(g, S, S, 6000, 'rgba(255,255,255,0.22)'); // điệp lấp lánh
        const c = S / 2;
        // khung tròn hai lớp như mép tranh
        g.strokeStyle = INK;
        g.lineWidth = 10;
        g.beginPath();
        g.arc(c, c, S * 0.475, 0, Math.PI * 2);
        g.stroke();
        g.lineWidth = 3;
        g.beginPath();
        g.arc(c, c, S * 0.455, 0, Math.PI * 2);
        g.stroke();
        // dải hoa văn sóng nước quanh viền
        g.lineWidth = 3.5;
        for (let i = 0; i < 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          const r = S * 0.465;
          const x = c + Math.cos(a) * r;
          const y = c + Math.sin(a) * r;
          g.save();
          g.translate(x, y);
          g.rotate(a + Math.PI / 2);
          g.strokeStyle = i % 2 ? CHAM : SON;
          g.beginPath();
          g.arc(0, 0, 10, Math.PI, 0);
          g.stroke();
          g.restore();
        }
        // mây cuộn ở bốn góc trong
        const clouds: [number, number, string][] = [
          [0.24, 0.26, HOE],
          [0.74, 0.22, SON],
          [0.2, 0.74, LA],
          [0.78, 0.76, CHAM],
        ];
        for (const [x, y, col] of clouds) cloud(g, x * S, y * S, 1.6, col);
      }),
    [],
  );
  return (
    <group>
      {/* mặt bàn gỗ */}
      <mesh position={[0, -0.55, 0]} receiveShadow material={toon('#8a5a32')}>
        <cylinderGeometry args={[16.6, 16.9, 0.9, 64]} />
        <Ink w={2} />
      </mesh>
      {/* tờ bản đồ */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[16, 96]} />
        <meshToonMaterial map={map} color={DIEP} />
      </mesh>
    </group>
  );
}

export { THREE };
