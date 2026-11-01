import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GOLD, LACQUER_BLACK, LACQUER_RED } from '../theme';

/** Mặt bàn sơn mài: nền đen bóng, viền son đỏ, nẹp vàng. */
export function Table({ low }: { low: boolean }) {
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.28, emissive: '#3a2400', emissiveIntensity: 0.25 }), []);
  return (
    <group>
      {/* Mặt bàn */}
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <cylinderGeometry args={[15.5, 15.8, 0.6, 96]} />
        <meshPhysicalMaterial color={LACQUER_BLACK} roughness={0.25} metalness={0.1} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      {/* Lớp son đỏ */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[12.6, 15.1, 128]} />
        <meshPhysicalMaterial color={LACQUER_RED} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      {/* Nẹp vàng */}
      {[12.55, 15.1, 15.6].map((r, i) => (
        <mesh key={i} position={[0, i === 2 ? -0.05 : 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={goldMat}>
          <torusGeometry args={[r, i === 2 ? 0.09 : 0.045, 8, 160]} />
        </mesh>
      ))}
      {/* Hoa văn vàng trên viền: các ô "triện" */}
      <Ornaments goldMat={goldMat} />
      {!low && <GoldLeaf count={110} />}
    </group>
  );
}

function Ornaments({ goldMat }: { goldMat: THREE.Material }) {
  const items = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = [];
    const n = 36;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push({ pos: [Math.cos(a) * 13.85, 0.01, Math.sin(a) * 13.85], rot: -a });
    }
    return out;
  }, []);
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={it.pos} rotation={[0, it.rot, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={goldMat}>
            <torusGeometry args={[0.32, 0.03, 4, 4]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={goldMat}>
            <circleGeometry args={[0.07, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Lá vàng bay lơ lửng trên sa bàn. */
function GoldLeaf({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 9 + 0.5,
        z: (Math.random() - 0.5) * 26,
        s: 0.05 + Math.random() * 0.09,
        sp: 0.15 + Math.random() * 0.35,
        rx: Math.random() * 6,
        ry: Math.random() * 6,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      s.y -= s.sp * dt * 0.6;
      if (s.y < 0.1) s.y = 9 + Math.random() * 2;
      dummy.position.set(s.x + Math.sin(t * 0.4 + i) * 0.6, s.y, s.z + Math.cos(t * 0.3 + i) * 0.5);
      dummy.rotation.set(s.rx + t * s.sp * 2, s.ry + t * 0.7, t * 0.5);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 0.7]} />
      <meshStandardMaterial color="#f3cf6b" metalness={1} roughness={0.25} emissive="#a06a10" emissiveIntensity={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
