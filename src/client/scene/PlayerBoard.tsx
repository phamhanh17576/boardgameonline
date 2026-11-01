import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { HEROES, allCells, type HeroId, type Terrain } from '../../engine';
import { GOLD, LACQUER_RED, TERRAIN_COLOR } from '../theme';
import { HEX_SIZE, hexToLocal } from './layout';

type ViewPlayer = {
  id: string;
  name: string;
  heroId: HeroId;
  star: number;
  longDan: number;
  territory: Record<string, Terrain>;
  isBot: boolean;
};

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
  const glow = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!glow.current) return;
    const t = state.clock.elapsedTime;
    const m = glow.current.material as THREE.MeshBasicMaterial;
    m.opacity = active ? 0.45 + Math.sin(t * 3) * 0.25 : 0;
    glow.current.rotation.z = t * 0.4;
  });
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3, emissive: '#3a2400', emissiveIntensity: 0.3 }), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Đế lục giác sơn son */}
      <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI / 6, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.75, 2.9, 0.16, 6]} />
        <meshPhysicalMaterial color={LACQUER_RED} roughness={0.32} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]} material={goldMat}>
        <torusGeometry args={[2.72, 0.035, 4, 6]} />
      </mesh>
      {/* Vòng sáng lượt chơi */}
      <mesh ref={glow} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.95, 3.25, 6]} />
        <meshBasicMaterial color={hero.color} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Ô trống */}
      {allCells().map((k) => {
        if (p.territory[k]) return null;
        const [x, z] = hexToLocal(k);
        return (
          <mesh key={k} position={[x, 0.11, z]}>
            <cylinderGeometry args={[HEX_SIZE * 0.9, HEX_SIZE * 0.9, 0.02, 6]} />
            <meshStandardMaterial color="#3a0d0a" roughness={0.6} />
          </mesh>
        );
      })}
      {Object.entries(p.territory).map(([k, t]) => (
        <HexTile key={k} cell={k} terrain={t} low={low} />
      ))}
      {ghost.map((g) => (
        <HexTile key={`ghost-${g.cell}`} cell={g.cell} terrain={g.terrain} low={low} ghost />
      ))}
      {/* Tượng anh hùng */}
      <group position={[0, 0.1, 2.35]}>
        <HeroStatue heroId={p.heroId} color={hero.color} />
      </group>
      <Html position={[0, 2.2, 2.35]} center distanceFactor={14} zIndexRange={[15, 5]} style={{ pointerEvents: 'none' }}>
        <div className={`name-plate${active ? ' active' : ''}${isMe ? ' me' : ''}`} style={{ borderColor: hero.color }}>
          <div className="np-name">{p.name}</div>
          <div className="np-hero">{hero.name}</div>
          <div className="np-stats">
            ★ {p.star} · Lòng dân {p.longDan}
          </div>
        </div>
      </Html>
    </group>
  );
}

const tileGeo = new THREE.CylinderGeometry(HEX_SIZE * 0.93, HEX_SIZE * 0.97, 0.2, 6);

function HexTile({ cell, terrain, low, ghost = false }: { cell: string; terrain: Terrain; low: boolean; ghost?: boolean }) {
  const [x, z] = hexToLocal(cell);
  const ref = useRef<THREE.Group>(null!);
  const born = useRef<number | null>(null);
  useFrame((state) => {
    if (born.current === null) born.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - born.current;
    if (ghost) {
      ref.current.position.y = 0.32 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      return;
    }
    const p = Math.min(1, t / 0.55);
    const bounce = p < 1 ? (1 - p) * 2.4 - Math.sin(p * Math.PI) * 0.15 : 0;
    ref.current.position.y = 0.2 + Math.max(-0.05, bounce);
    const s = 0.6 + 0.4 * Math.min(1, p * 1.4);
    ref.current.scale.setScalar(s);
  });
  const color = TERRAIN_COLOR[terrain];
  return (
    <group ref={ref} position={[x, 0.2, z]}>
      <mesh geometry={tileGeo} castShadow={!low} receiveShadow>
        <meshPhysicalMaterial color={color} roughness={terrain === 'song' ? 0.1 : 0.35} clearcoat={1} clearcoatRoughness={0.12} transparent={ghost} opacity={ghost ? 0.55 : 1} />
      </mesh>
      <TileDecor terrain={terrain} />
    </group>
  );
}

function TileDecor({ terrain }: { terrain: Terrain }) {
  const gold = <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} emissive="#4a2e00" emissiveIntensity={0.3} />;
  switch (terrain) {
    case 'ruong':
      return (
        <group position={[0, 0.105, 0]}>
          {[-0.18, 0, 0.18].map((z) => (
            <mesh key={z} position={[0, 0, z]}>
              <boxGeometry args={[0.5, 0.012, 0.03]} />
              {gold}
            </mesh>
          ))}
        </group>
      );
    case 'rung':
      return (
        <group position={[0, 0.1, 0]}>
          {[
            [-0.14, -0.08, 0.32],
            [0.15, 0.04, 0.26],
            [-0.02, 0.18, 0.22],
          ].map(([x, z, h], i) => (
            <mesh key={i} position={[x, h / 2, z]}>
              <coneGeometry args={[0.1, h, 6]} />
              <meshStandardMaterial color="#1d4a35" flatShading />
            </mesh>
          ))}
        </group>
      );
    case 'nui':
      return (
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.28, 0.36, 5]} />
            <meshStandardMaterial color="#5c5550" flatShading />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <coneGeometry args={[0.09, 0.11, 5]} />
            {gold}
          </mesh>
        </group>
      );
    case 'lang':
      return (
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.26, 0.16, 0.2]} />
            <meshStandardMaterial color="#e8d8b0" />
          </mesh>
          <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.24, 0.16, 4]} />
            <meshStandardMaterial color="#5a1a12" />
          </mesh>
        </group>
      );
    case 'song':
      return (
        <mesh position={[0, 0.104, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.14, 0.17, 6]} />
          <meshStandardMaterial color="#9fd3ff" emissive="#2a6f9f" emissiveIntensity={0.6} />
        </mesh>
      );
  }
}

/** Tượng gỗ chạm của anh hùng, mỗi người một dáng. */
export function HeroStatue({ heroId, color }: { heroId: HeroId; color: string }) {
  const wood = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#6b3f1f', roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.2 }), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3, emissive: '#3a2400', emissiveIntensity: 0.3 }), []);
  const sash = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), [color]);
  const ref = useRef<THREE.Group>(null!);
  useFrame((s) => {
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.5) * 0.15;
  });

  const figure = (x: number, scale = 1, hat: 'helmet' | 'crown' | 'scholar' | 'non' | 'official' = 'helmet') => (
    <group position={[x, 0, 0]} scale={scale}>
      <mesh position={[0, 0.45, 0]} material={wood} castShadow>
        <cylinderGeometry args={[0.13, 0.26, 0.7, 10]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={sash}>
        <torusGeometry args={[0.17, 0.035, 6, 14]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={wood} castShadow>
        <sphereGeometry args={[0.13, 14, 12]} />
      </mesh>
      {hat === 'helmet' && (
        <mesh position={[0, 1.04, 0]} material={gold}>
          <coneGeometry args={[0.15, 0.2, 8]} />
        </mesh>
      )}
      {hat === 'crown' && (
        <mesh position={[0, 1.05, 0]} material={gold}>
          <cylinderGeometry args={[0.1, 0.13, 0.12, 8]} />
        </mesh>
      )}
      {hat === 'scholar' && (
        <mesh position={[0, 1.06, 0]} material={sash}>
          <boxGeometry args={[0.24, 0.1, 0.18]} />
        </mesh>
      )}
      {hat === 'non' && (
        <mesh position={[0, 1.03, 0]} material={gold}>
          <coneGeometry args={[0.26, 0.12, 14]} />
        </mesh>
      )}
      {hat === 'official' && (
        <mesh position={[0, 1.1, 0]} material={wood}>
          <cylinderGeometry args={[0.09, 0.11, 0.22, 8]} />
        </mesh>
      )}
    </group>
  );

  let body: ReactNode;
  switch (heroId) {
    case 'haiBaTrung':
      body = (
        <>
          {figure(-0.2, 0.9, 'crown')}
          {figure(0.2, 0.85, 'crown')}
        </>
      );
      break;
    case 'baTrieu':
      body = (
        <group>
          <mesh position={[0, 0.38, 0]} material={wood} castShadow>
            <boxGeometry args={[0.5, 0.32, 0.75]} />
          </mesh>
          {[-0.17, 0.17].flatMap((x) => [-0.25, 0.25].map((z) => [x, z])).map(([x, z], i) => (
            <mesh key={i} position={[x, 0.12, z]} material={wood}>
              <cylinderGeometry args={[0.06, 0.07, 0.25, 6]} />
            </mesh>
          ))}
          <mesh position={[0, 0.42, 0.48]} rotation={[0.9, 0, 0]} material={wood}>
            <cylinderGeometry args={[0.04, 0.07, 0.4, 6]} />
          </mesh>
          <mesh position={[0, 0.55, 0]} material={sash}>
            <boxGeometry args={[0.52, 0.04, 0.4]} />
          </mesh>
          <group position={[0, 0.25, -0.05]} scale={0.7}>
            {figure(0, 1, 'helmet')}
          </group>
        </group>
      );
      break;
    case 'nguyenTrai':
      body = (
        <>
          {figure(0, 1, 'scholar')}
          <mesh position={[0.22, 0.55, 0.12]} rotation={[0, 0, Math.PI / 2]} material={gold}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          </mesh>
        </>
      );
      break;
    case 'tranQuocToan':
      body = (
        <>
          {figure(0, 0.92, 'helmet')}
          <mesh position={[0.25, 0.75, 0]} material={wood}>
            <cylinderGeometry args={[0.015, 0.015, 1.5, 5]} />
          </mesh>
          <mesh position={[0.45, 1.3, 0]}>
            <planeGeometry args={[0.38, 0.5]} />
            <meshStandardMaterial color="#c0392b" side={THREE.DoubleSide} emissive="#5a0a00" emissiveIntensity={0.4} />
          </mesh>
        </>
      );
      break;
    case 'tranKhanhDu':
      body = (
        <>
          {figure(0, 1, 'non')}
          <mesh position={[0.25, 0.55, 0]} rotation={[0, 0, 0.4]} material={wood}>
            <cylinderGeometry args={[0.02, 0.02, 1.1, 5]} />
          </mesh>
        </>
      );
      break;
    case 'tranThuDo':
      body = figure(0, 1.05, 'official');
      break;
    default:
      body = (
        <>
          {figure(0, 1.05, 'helmet')}
          <mesh position={[0.24, 0.8, 0]} material={wood}>
            <cylinderGeometry args={[0.015, 0.015, 1.6, 5]} />
          </mesh>
          <mesh position={[0.24, 1.62, 0]} material={gold}>
            <coneGeometry args={[0.04, 0.16, 6]} />
          </mesh>
        </>
      );
  }

  return (
    <group ref={ref}>
      <mesh position={[0, 0.06, 0]} material={gold} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.12, 24]} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.38, 0.4, 0.06, 24]} />
        <meshPhysicalMaterial color="#140b08" clearcoat={1} roughness={0.2} />
      </mesh>
      <group position={[0, 0.16, 0]}>{body}</group>
    </group>
  );
}
