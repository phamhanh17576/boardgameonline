import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HEROES, type HeroId } from '../../engine';
import { GOLD } from '../theme';
import { battleSlot, boardToWorld, reserveSlotLocal } from './layout';

type V3 = [number, number, number];

interface TokenAnim {
  from: THREE.Vector3;
  to: THREE.Vector3;
  cur: THREE.Vector3;
  t: number;
  key: string;
}

/** Quân lính bằng gỗ của một người: tự bay vòng cung khi đổi chỗ (trong tay ↔ chiến trường). */
export function PlayerTroops({
  heroId,
  index,
  n,
  reserve,
  atBattle,
  boardPos,
  rotation,
}: {
  heroId: HeroId;
  index: number;
  n: number;
  reserve: number;
  atBattle: number;
  boardPos: V3;
  rotation: number;
}) {
  const total = Math.min(18, reserve + atBattle);
  const color = HEROES[heroId].color;
  const targets = useMemo(() => {
    const out: { pos: V3; key: string }[] = [];
    for (let k = 0; k < total; k++) {
      if (k < atBattle) out.push({ pos: battleSlot(index, n, k), key: `b${k}` });
      else out.push({ pos: boardToWorld(boardPos, rotation, reserveSlotLocal(k - atBattle)), key: `r${k - atBattle}` });
    }
    return out;
  }, [total, atBattle, index, n, boardPos, rotation]);

  const anims = useRef<TokenAnim[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // đồng bộ số lượng token
  while (anims.current.length < total) {
    const tgt = targets[anims.current.length];
    const spawn = new THREE.Vector3(...boardToWorld(boardPos, rotation, [0, 1.6, 2.35]));
    anims.current.push({ from: spawn.clone(), to: new THREE.Vector3(...tgt.pos), cur: spawn.clone(), t: 0, key: tgt.key });
  }
  if (anims.current.length > total) anims.current.length = total;
  targets.forEach((tg, i) => {
    const a = anims.current[i];
    if (a.key !== tg.key || a.to.distanceToSquared(new THREE.Vector3(...tg.pos)) > 1e-4) {
      a.from.copy(a.cur);
      a.to.set(...tg.pos);
      a.t = 0;
      a.key = tg.key;
    }
  });

  useFrame((_, dt) => {
    anims.current.forEach((a, i) => {
      const g = groupRefs.current[i];
      if (!g) return;
      if (a.t < 1) {
        a.t = Math.min(1, a.t + dt / (0.75 + (i % 5) * 0.08));
        const e = 1 - Math.pow(1 - a.t, 3);
        a.cur.lerpVectors(a.from, a.to, e);
        const dist = a.from.distanceTo(a.to);
        a.cur.y += Math.sin(Math.PI * a.t) * Math.min(2.4, 0.3 + dist * 0.18);
      } else a.cur.copy(a.to);
      g.position.copy(a.cur);
    });
  });

  const body = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), [color]);
  const wood = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#7a4a24', roughness: 0.5, clearcoat: 0.6 }), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.35 }), []);

  return (
    <group>
      {anims.current.map((a, i) => (
        <group key={i} ref={(el) => (groupRefs.current[i] = el)} position={a.cur} scale={1.5}>
          <mesh position={[0, 0.12, 0]} material={body} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.24, 8]} />
          </mesh>
          <mesh position={[0, 0.29, 0]} material={wood}>
            <sphereGeometry args={[0.065, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.355, 0]} material={gold}>
            <coneGeometry args={[0.12, 0.06, 12]} />
          </mesh>
          <mesh position={[0.09, 0.22, 0]} material={wood}>
            <cylinderGeometry args={[0.008, 0.008, 0.46, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
