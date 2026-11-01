// Bàn của mỗi người chơi: khay gỗ lục giác, ô đất tô màu Đông Hồ, tượng đứng in tranh anh hùng.
import { Html, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HEROES, allCells, type HeroId, type Terrain } from '../../engine';
import { AVATAR } from '../art';
import { CHAM, DIEP, INK, LA, PAPER_DARK, SON, TERRAIN_COLOR } from '../theme';
import { Avatar } from '../ui/common';
import { Icon } from '../ui/Icon';
import { House, Karst } from './Battlefield';
import { HEX_SIZE, hexToLocal } from './layout';
import { Ink, toon } from './toon';

type ViewPlayer = {
  id: string;
  name: string;
  heroId: HeroId;
  star: number;
  longDan: number;
  territory: Record<string, Terrain>;
  isBot: boolean;
};

const trayGeo = new THREE.CylinderGeometry(2.75, 2.9, 0.22, 6);
const inlayGeo = new THREE.CylinderGeometry(2.58, 2.58, 0.02, 6);
const emptyGeo = new THREE.CylinderGeometry(HEX_SIZE * 0.9, HEX_SIZE * 0.9, 0.02, 6);
const emptyRingGeo = new THREE.RingGeometry(HEX_SIZE * 0.86, HEX_SIZE * 0.92, 6, 1);
const tileGeo = new THREE.CylinderGeometry(HEX_SIZE * 0.93, HEX_SIZE * 0.97, 0.2, 6);
const turnRingGeo = new THREE.RingGeometry(2.98, 3.2, 6, 1);

export function PlayerBoard({
  p,
  position,
  rotation,
  active,
  isMe,
  ghost,
  low,
}: {
  p: ViewPlayer;
  position: [number, number, number];
  rotation: number;
  active: boolean;
  isMe: boolean;
  ghost: { cell: string; terrain: Terrain }[];
  low: boolean;
}) {
  const hero = HEROES[p.heroId];
  const turn = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!turn.current) return;
    const m = turn.current.material as THREE.MeshBasicMaterial;
    m.opacity = active ? 0.75 + Math.sin(state.clock.elapsedTime * 3) * 0.25 : 0;
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* khay gỗ */}
      <mesh geometry={trayGeo} position={[0, 0.0, 0]} rotation={[0, Math.PI / 6, 0]} material={toon('#8a5a32')} receiveShadow castShadow={!low}>
        <Ink w={1.4} />
      </mesh>
      <mesh geometry={inlayGeo} position={[0, 0.115, 0]} rotation={[0, Math.PI / 6, 0]} material={toon(PAPER_DARK)} receiveShadow />
      {/* vạch lượt đi: viền son quanh khay */}
      <mesh ref={turn} geometry={turnRingGeo} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <meshBasicMaterial color={SON} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* ô trống */}
      {allCells().map((k) => {
        if (p.territory[k]) return null;
        const [x, z] = hexToLocal(k);
        return (
          <group key={k} position={[x, 0.13, z]}>
            <mesh geometry={emptyGeo} material={toon('#c4ad80')} receiveShadow />
            <mesh geometry={emptyRingGeo} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]} material={toon('#8d7650')} />
          </group>
        );
      })}
      {Object.entries(p.territory).map(([k, t]) => (
        <HexTile key={k} cell={k} terrain={t} low={low} />
      ))}
      {ghost.map((g) => (
        <HexTile key={`ghost-${g.cell}`} cell={g.cell} terrain={g.terrain} low={low} ghost />
      ))}
      {/* tượng đứng in tranh */}
      <Standee heroId={p.heroId} active={active} position={[0, 0.12, 2.4]} />
      <Html position={[0, 2.25, 2.4]} center distanceFactor={14} zIndexRange={[3, 1]} style={{ pointerEvents: 'none' }}>
        <div className={`name-plate${active ? ' active' : ''}${isMe ? ' me' : ''}`}>
          <Avatar heroId={p.heroId} size={30} />
          <div>
            <div className="np-name">{p.name}</div>
            <div className="np-stats">
              <Icon name="star" size={11} /> {p.star} <Icon name="dan" size={11} /> {p.longDan} · {hero.name}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

/** Tấm tranh khắc in avatar dựng trên đế gỗ, luôn quay về phía người xem. */
function Standee({ heroId, active, position }: { heroId: HeroId; active: boolean; position: [number, number, number] }) {
  const tex = useTexture(AVATAR[heroId]);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
  }, [tex]);
  const lift = useRef<THREE.Group>(null!);
  const face = useRef<THREE.Group>(null!);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((s, dt) => {
    if (!lift.current || !face.current) return;
    const target = active ? 0.12 + Math.sin(s.clock.elapsedTime * 3) * 0.04 : 0;
    lift.current.position.y += (target - lift.current.position.y) * Math.min(1, dt * 8);
    // chỉ xoay quanh trục đứng để mặt tranh luôn hướng về người xem
    const parent = face.current.parent;
    if (!parent) return;
    tmp.copy(s.camera.position);
    parent.worldToLocal(tmp);
    face.current.rotation.y = Math.atan2(tmp.x, tmp.z);
  });
  const S = 1.25;
  const color = HEROES[heroId].color;
  return (
    <group position={position}>
      {/* đế gỗ */}
      <mesh position={[0, 0.08, 0]} material={toon('#6b4424')} castShadow>
        <cylinderGeometry args={[0.5, 0.56, 0.16, 20]} />
        <Ink />
      </mesh>
      <mesh position={[0, 0.17, 0]} material={toon(color)}>
        <cylinderGeometry args={[0.44, 0.46, 0.04, 20]} />
      </mesh>
      <group ref={face}>
        <group ref={lift}>
          <group position={[0, 0.2 + S / 2 + 0.06, 0]}>
            {/* khung mực + viền màu anh hùng */}
            <mesh position={[0, 0, -0.03]} material={toon(INK)} castShadow>
              <boxGeometry args={[S + 0.16, S + 0.16, 0.05]} />
            </mesh>
            <mesh position={[0, 0, -0.001]} material={toon(color)}>
              <boxGeometry args={[S + 0.08, S + 0.08, 0.01]} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <planeGeometry args={[S, S]} />
              <meshBasicMaterial map={tex} />
            </mesh>
            {/* lưng tấm tranh: giấy dó */}
            <mesh position={[0, 0, -0.058]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[S + 0.16, S + 0.16]} />
              <meshBasicMaterial color={DIEP} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function HexTile({ cell, terrain, low, ghost = false }: { cell: string; terrain: Terrain; low: boolean; ghost?: boolean }) {
  const [x, z] = hexToLocal(cell);
  const ref = useRef<THREE.Group>(null!);
  const born = useRef<number | null>(null);
  useFrame((state) => {
    if (born.current === null) born.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - born.current;
    if (ghost) {
      ref.current.position.y = 0.42 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      return;
    }
    const p = Math.min(1, t / 0.55);
    const bounce = p < 1 ? (1 - p) * 2.4 - Math.sin(p * Math.PI) * 0.15 : 0;
    ref.current.position.y = 0.22 + Math.max(-0.05, bounce);
    ref.current.scale.setScalar(0.6 + 0.4 * Math.min(1, p * 1.4));
  });
  const mat = ghost ? toon(TERRAIN_COLOR[terrain], { transparent: true, opacity: 0.6 }) : toon(TERRAIN_COLOR[terrain]);
  return (
    <group ref={ref} position={[x, 0.22, z]}>
      <mesh geometry={tileGeo} material={mat} castShadow={!low && !ghost} receiveShadow>
        {!ghost && <Ink w={0.7} />}
      </mesh>
      {!ghost && <TileDecor terrain={terrain} seed={x * 7 + z * 13} />}
    </group>
  );
}

function TileDecor({ terrain, seed }: { terrain: Terrain; seed: number }) {
  const flip = Math.sin(seed) > 0 ? 1 : -1;
  switch (terrain) {
    case 'ruong':
      return (
        <group position={[0, 0.105, 0]} rotation={[0, (Math.PI / 3) * (flip > 0 ? 0 : 1), 0]}>
          {[-0.2, -0.07, 0.07, 0.2].map((z) => (
            <mesh key={z} position={[0, 0, z]} material={toon(INK)}>
              <boxGeometry args={[0.52, 0.012, 0.018]} />
            </mesh>
          ))}
          {[-0.14, 0.14].map((x) => (
            <mesh key={x} position={[x, 0.05, 0.13 * flip]} material={toon(LA)}>
              <coneGeometry args={[0.04, 0.1, 5]} />
            </mesh>
          ))}
        </group>
      );
    case 'rung':
      return (
        <group position={[0, 0.1, 0]}>
          {(
            [
              [-0.15, -0.08, 1],
              [0.16, 0.02, 0.85],
              [-0.02, 0.19, 0.75],
            ] as const
          ).map(([tx, tz, s], i) => (
            <group key={i} position={[tx * flip, 0, tz]} scale={s}>
              <mesh position={[0, 0.1, 0]} material={toon('#5a3a1e')}>
                <cylinderGeometry args={[0.025, 0.035, 0.2, 5]} />
              </mesh>
              <mesh position={[0, 0.27, 0]} material={toon(i === 1 ? '#3f6633' : '#2f5428')}>
                <sphereGeometry args={[0.14, 10, 8]} />
                <Ink w={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'nui':
      return (
        <group position={[0, 0.1, 0]}>
          <Karst position={[-0.08 * flip, 0, -0.02]} scale={[0.55, 0.62, 0.5]} color="#7d7360" />
          <Karst position={[0.17 * flip, 0, 0.12]} scale={[0.36, 0.4, 0.34]} color="#6d6452" />
        </group>
      );
    case 'lang':
      return (
        <group position={[0, 0.1, 0]}>
          <House position={[-0.06, 0, -0.04]} scale={0.48} roof={flip > 0 ? CHAM : INK} />
          <mesh position={[0.22, 0.12, 0.16]} material={toon(LA)}>
            <sphereGeometry args={[0.09, 8, 6]} />
          </mesh>
        </group>
      );
    case 'song':
      return (
        <group position={[0, 0.103, 0]}>
          {[
            [-0.16, -0.12],
            [0.1, -0.12],
            [-0.02, 0.06],
            [-0.18, 0.2],
            [0.16, 0.2],
          ].map(([sx, sz], i) => (
            <mesh key={i} position={[sx, 0, sz]} rotation={[-Math.PI / 2, 0, 0]} material={toon(DIEP)}>
              <ringGeometry args={[0.06, 0.085, 10, 1, 0, Math.PI]} />
            </mesh>
          ))}
        </group>
      );
  }
}

