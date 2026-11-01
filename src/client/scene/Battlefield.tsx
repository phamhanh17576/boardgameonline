// Sa bàn chiến trường giữa bàn: dựng theo địa hình của từng trận, tô kiểu tranh Đông Hồ.
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BATTLES, enemyStrength, type BattleTerrain, type GameState, type GameView } from '../../engine';
import { CHAM, DIEP, HOE, INK, LA, SON } from '../theme';
import { burst } from './Fx';
import { useFxEvents } from './fxHooks';
import { canvasTexture, cloud, Ink, speckle, toon } from './toon';

const W = 11.4; // bề ngang sa bàn
const D = 7.2; // bề sâu
const HIGH = 0.06; // mặt nước lúc triều lên
const LOW = -0.32; // lúc triều rút
const STAKE_BATTLES = new Set(['bachDang938', 'bachDang1288', 'chiLang981']);

type Anim = { t0: number; won: boolean; active: boolean };

export function Battlefield({ view, low }: { view: GameView; low: boolean }) {
  const def = BATTLES[view.battle.id];
  const anim = useRef<Anim>({ t0: 0, won: false, active: false });
  const clock = useRef(0);
  const enemy = enemyStrength(view as unknown as GameState).base;
  const goCommitted = Object.values(view.battle.tactic).reduce((a, r) => a + (r?.go ?? 0), 0);
  const stakes = STAKE_BATTLES.has(def.id) ? Math.min(30, 6 + goCommitted * 3) : 0;

  useFxEvents((e) => {
    if (e.type === 'battleStart') anim.current = { t0: clock.current, won: false, active: false };
    if (e.type === 'battleResolved') {
      const won = !!e.data?.won;
      anim.current = { t0: clock.current, won, active: true };
      const n = low ? 3 : 6;
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          const x = (Math.random() - 0.5) * W * 0.7;
          const z = won ? -1 + Math.random() * 1.6 : 0.8 + Math.random() * 1.6;
          burst([x, 0.6, z], won ? 'paper' : 'ink', low ? 24 : 48);
        }, 1500 + i * 240);
      }
    }
  });
  useFrame((s) => {
    clock.current = s.clock.elapsedTime;
  });
  // đổi trận: đặt lại hoạt cảnh
  useMemo(() => {
    anim.current = { t0: clock.current, won: false, active: false };
  }, [def.id]);

  const water = def.terrain === 'river' || def.terrain === 'marsh';
  const enemyCount = Math.max(5, Math.min(18, Math.round(enemy / 3)));

  return (
    <group key={def.id}>
      <Diorama terrain={def.terrain} />
      <BackPeaks seed={def.sortYear} />
      {water && <Water terrain={def.terrain} anim={anim} clock={clock} red={def.id === 'bachDang1288'} />}
      {def.terrain === 'marsh' && <Reeds low={low} />}
      {stakes > 0 && <Stakes count={stakes} anim={anim} clock={clock} />}
      {def.terrain === 'pass' && <Pass />}
      {def.terrain === 'citadel' && <Citadel anim={anim} clock={clock} />}
      {def.terrain === 'plain' && <Fields />}
      {!water && <Trees seed={def.sortYear} />}
      <Enemy count={enemyCount} onWater={water} anim={anim} clock={clock} />
      {water && <OurBoats />}
    </group>
  );
}

/* ---------- đế sa bàn ---------- */

const LAND_BASE: Record<BattleTerrain, string> = {
  river: '#c9b27a',
  marsh: '#a9a56c',
  pass: '#b9a27c',
  citadel: '#cdb688',
  plain: '#d3bb6e',
};

function Diorama({ terrain }: { terrain: BattleTerrain }) {
  const tex = useMemo(
    () =>
      canvasTexture(1024, 648, (g) => {
        const w = 1024;
        const h = 648;
        g.fillStyle = LAND_BASE[terrain];
        g.fillRect(0, 0, w, h);
        speckle(g, w, h, 9000, 'rgba(60,40,10,0.12)');
        // nét cỏ khắc gỗ
        g.strokeStyle = 'rgba(40,50,20,0.45)';
        g.lineWidth = 2;
        for (let i = 0; i < 260; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(x + 3, y - 8, x + 6, y - 12);
          g.moveTo(x + 4, y);
          g.quadraticCurveTo(x + 8, y - 6, x + 12, y - 9);
          g.stroke();
        }
        if (terrain === 'pass' || terrain === 'citadel') {
          // đường đất uốn qua giữa
          g.strokeStyle = '#a07a4a';
          g.lineWidth = 70;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(w * 0.5, h + 20);
          g.bezierCurveTo(w * 0.35, h * 0.65, w * 0.65, h * 0.4, w * 0.5, -20);
          g.stroke();
          g.strokeStyle = INK;
          g.lineWidth = 3;
          g.setLineDash([16, 12]);
          g.stroke();
          g.setLineDash([]);
        }
        if (terrain === 'plain') {
          cloud(g, w * 0.82, h * 0.18, 1.1, DIEP);
        }
        // viền khung tranh
        g.strokeStyle = INK;
        g.lineWidth = 10;
        g.strokeRect(5, 5, w - 10, h - 10);
      }),
    [terrain],
  );
  return (
    <group>
      <mesh position={[0, -0.3, 0]} receiveShadow castShadow material={toon('#7a4b2a')}>
        <boxGeometry args={[W + 0.5, 0.5, D + 0.5]} />
        <Ink w={1.5} />
      </mesh>
      <mesh position={[0, -0.045, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshToonMaterial map={tex} />
      </mesh>
    </group>
  );
}

/* ---------- núi đá vôi ---------- */

const karstGeo = (() => {
  const pts: THREE.Vector2[] = [];
  const prof = [
    [0.0, 1.0],
    [0.18, 0.96],
    [0.32, 0.82],
    [0.36, 0.62],
    [0.46, 0.44],
    [0.5, 0.2],
    [0.56, 0.0],
  ];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 7);
})();

export function Karst({ position, scale = 1, color = '#7f8a6a' }: { position: [number, number, number]; scale?: number | [number, number, number]; color?: string }) {
  return (
    <mesh position={position} scale={scale} geometry={karstGeo} material={toon(color)} castShadow receiveShadow>
      <Ink w={1.2} />
    </mesh>
  );
}

function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function BackPeaks({ seed }: { seed: number }) {
  const peaks = useMemo(() => {
    const r = rand(seed + 7);
    return Array.from({ length: 8 }, (_, i) => ({
      x: -W / 2 + 0.7 + i * ((W - 1.4) / 7) + (r() - 0.5) * 0.5,
      z: -3.1 + r() * 0.25,
      s: 0.9 + r() * 0.9,
      c: r() > 0.5 ? '#7f8a6a' : '#6f7d63',
    }));
  }, [seed]);
  return (
    <group>
      {peaks.map((p, i) => (
        <Karst key={i} position={[p.x, -0.05, p.z]} scale={[p.s * 0.9, p.s * 1.5, p.s * 0.8]} color={p.c} />
      ))}
    </group>
  );
}

/* ---------- nước ---------- */

function Water({
  terrain,
  anim,
  clock,
  red,
}: {
  terrain: BattleTerrain;
  anim: React.MutableRefObject<Anim>;
  clock: React.MutableRefObject<number>;
  red: boolean;
}) {
  const marsh = terrain === 'marsh';
  const base = marsh ? '#4f6a4c' : '#2f5d86';
  const tex = useMemo(() => {
    const t = canvasTexture(512, 256, (g) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 512, 256);
      g.strokeStyle = marsh ? 'rgba(230,220,170,0.55)' : 'rgba(246,239,223,0.7)';
      g.lineWidth = 3;
      // sóng vảy cá
      for (let row = 0; row < 9; row++) {
        const y = 16 + row * 28;
        const off = row % 2 ? 16 : 0;
        for (let x = -32 + off; x < 540; x += 32) {
          g.beginPath();
          g.arc(x, y, 14, Math.PI, 0);
          g.stroke();
        }
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 1.4);
    return t;
  }, [base, marsh]);
  const surf = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshToonMaterial>(null!);
  const baseCol = useMemo(() => new THREE.Color('#ffffff'), []);
  const redCol = useMemo(() => new THREE.Color('#d98b7a'), []);
  const depth = marsh ? 3.6 : 2.9;
  useFrame((_, dt) => {
    tex.offset.x += dt * 0.05;
    const a = anim.current;
    const t = clock.current - a.t0;
    let y = HIGH;
    if (a.active) {
      const p = Math.min(1, t / 2.4);
      const e = p * p * (3 - 2 * p);
      y = HIGH + ((marsh ? -0.1 : LOW) - HIGH) * e;
    }
    surf.current.position.y = y;
    if (red && a.active && a.won) {
      const p = Math.min(1, Math.max(0, (t - 1) / 2));
      mat.current.color.lerpColors(baseCol, redCol, p);
    } else mat.current.color.copy(baseCol);
  });
  return (
    <group>
      {/* lòng sông */}
      <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, depth]} />
        <meshToonMaterial color="#6b5a3e" />
      </mesh>
      <mesh ref={surf} position={[0, HIGH, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, depth]} />
        <meshToonMaterial ref={mat} map={tex} transparent opacity={0.94} />
      </mesh>
      {/* nét mực bờ sông */}
      {[-depth / 2, depth / 2].map((z) => (
        <mesh key={z} position={[0, 0.0, z]} material={toon(INK)}>
          <boxGeometry args={[W, 0.08, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

function Reeds({ low }: { low: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = low ? 90 : 180;
  const geo = useMemo(() => new THREE.CylinderGeometry(0.01, 0.018, 0.5, 4).translate(0, 0.25, 0), []);
  useLayoutEffect(() => {
    {
      if (!ref.current) return;
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const r = rand(42);
      for (let i = 0; i < count; i++) {
        const x = (r() - 0.5) * W * 0.95;
        const z = (r() - 0.5) * 3.4;
        q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4));
        const s = 0.6 + r() * 0.8;
        m.compose(new THREE.Vector3(x, -0.05, z), q, new THREE.Vector3(1, s, 1));
        ref.current.setMatrixAt(i, m);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [count]);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.8) * 0.01;
  });
  return <instancedMesh ref={ref} args={[geo, toon('#6f7d3a'), count]} />;
}

/* ---------- cọc gỗ ---------- */

function Stakes({ count, anim, clock }: { count: number; anim: React.MutableRefObject<Anim>; clock: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null!);
  const items = useMemo(() => {
    const out: [number, number][] = [];
    const rows = 2;
    const per = Math.ceil(count / rows);
    for (let i = 0; i < count; i++) {
      const row = i % rows;
      const k = Math.floor(i / rows);
      out.push([-W / 2 + 0.8 + (k + row * 0.5) * ((W - 1.6) / per), -0.35 + row * 0.35]);
    }
    return out;
  }, [count]);
  useFrame(() => {
    // khi triều rút, đầu cọc lộ ra (cọc đứng yên, nước hạ)
    const a = anim.current;
    if (!ref.current) return;
    ref.current.position.y = a.active ? 0 : -0.08;
    void clock;
  });
  return (
    <group ref={ref}>
      {items.map(([x, z], i) => (
        <mesh key={i} position={[x, -0.1, z]} rotation={[0.25, 0, (i % 3) * 0.05]} material={toon('#5a3a1e')} castShadow>
          <coneGeometry args={[0.06, 0.62, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- ải núi ---------- */

function Pass() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Karst position={[side * 2.6, -0.05, -0.6]} scale={[1.6, 2.1, 1.4]} />
          <Karst position={[side * 3.9, -0.05, 0.6]} scale={[1.3, 1.6, 1.2]} color="#6f7d63" />
          <Karst position={[side * 4.8, -0.05, -1.4]} scale={[1.1, 1.9, 1.1]} />
        </group>
      ))}
      {/* cổng ải */}
      <group position={[0, 0, -1.6]}>
        {[-0.75, 0.75].map((x) => (
          <mesh key={x} position={[x, 0.45, 0]} material={toon('#9a9284')} castShadow>
            <boxGeometry args={[0.5, 0.9, 0.5]} />
            <Ink />
          </mesh>
        ))}
        <mesh position={[0, 0.98, 0]} material={toon('#9a9284')} castShadow>
          <boxGeometry args={[2.0, 0.24, 0.55]} />
          <Ink />
        </mesh>
        <Roof position={[0, 1.1, 0]} w={2.3} d={0.8} h={0.42} color={SON} />
      </group>
    </group>
  );
}

/* ---------- thành ---------- */

function Citadel({ anim, clock }: { anim: React.MutableRefObject<Anim>; clock: React.MutableRefObject<number> }) {
  const enemyFlag = useRef<THREE.Group>(null!);
  const ourFlag = useRef<THREE.Group>(null!);
  useFrame(() => {
    const a = anim.current;
    const t = clock.current - a.t0;
    const p = a.active && a.won ? Math.min(1, Math.max(0, (t - 1.8) / 1.2)) : 0;
    if (enemyFlag.current) enemyFlag.current.scale.setScalar(Math.max(0.001, 1 - p));
    if (ourFlag.current) ourFlag.current.scale.setScalar(Math.max(0.001, p));
  });
  const wallMat = toon('#a69a82');
  const cw = 6;
  const cd = 2.6;
  const z0 = -1.3;
  return (
    <group position={[0, 0, z0]}>
      {/* bốn mặt tường */}
      {[
        [0, -cd / 2, cw, 0.3],
        [-cw / 2, 0, 0.3, cd],
        [cw / 2, 0, 0.3, cd],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.35, z]} material={wallMat} castShadow receiveShadow>
          <boxGeometry args={[w, 0.7, d]} />
          <Ink />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (cw / 4 + 0.5), 0.35, cd / 2]} material={wallMat} castShadow>
          <boxGeometry args={[cw / 2 - 1, 0.7, 0.3]} />
          <Ink />
        </mesh>
      ))}
      {/* tháp góc */}
      {[
        [-cw / 2, -cd / 2],
        [cw / 2, -cd / 2],
        [-cw / 2, cd / 2],
        [cw / 2, cd / 2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} material={wallMat} castShadow>
            <boxGeometry args={[0.6, 1.0, 0.6]} />
            <Ink />
          </mesh>
          <Roof position={[0, 1.0, 0]} w={0.9} d={0.9} h={0.35} color={CHAM} />
        </group>
      ))}
      {/* cổng hai tầng mái */}
      <group position={[0, 0, cd / 2]}>
        <mesh position={[0, 0.45, 0]} material={wallMat} castShadow>
          <boxGeometry args={[2, 0.9, 0.5]} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.3, 0.26]} material={toon(INK)}>
          <boxGeometry args={[0.6, 0.6, 0.02]} />
        </mesh>
        <Roof position={[0, 0.9, 0]} w={2.3} d={0.8} h={0.35} color={SON} />
        <mesh position={[0, 1.3, 0]} material={toon('#c9a77a')}>
          <boxGeometry args={[1.0, 0.25, 0.4]} />
        </mesh>
        <Roof position={[0, 1.42, 0]} w={1.4} d={0.6} h={0.3} color={SON} />
      </group>
      {/* nhà trong thành */}
      <House position={[-1.3, 0, -0.3]} />
      <House position={[1.2, 0, -0.5]} roof={CHAM} />
      {/* cờ */}
      <group ref={enemyFlag} position={[0, 1.8, -0.4]}>
        <Flag color="#4a5560" />
      </group>
      <group ref={ourFlag} position={[0, 1.8, -0.4]} scale={0.001}>
        <Flag color={SON} />
      </group>
    </group>
  );
}

/* ---------- đồng bằng ---------- */

function Fields() {
  const plots = useMemo(() => {
    const out: { x: number; z: number; c: string }[] = [];
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 2; j++) out.push({ x: -4.4 + i * 1.75, z: 0.9 + j * 1.25, c: (i + j) % 3 === 0 ? LA : (i + j) % 3 === 1 ? HOE : '#b7c35a' });
    return out;
  }, []);
  return (
    <group>
      {plots.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, -0.02, 0]} material={toon(p.c)} receiveShadow>
            <boxGeometry args={[1.55, 0.06, 1.05]} />
            <Ink w={0.8} />
          </mesh>
          {[-0.3, 0, 0.3].map((dz) => (
            <mesh key={dz} position={[0, 0.02, dz]} material={toon(INK)}>
              <boxGeometry args={[1.3, 0.01, 0.02]} />
            </mesh>
          ))}
        </group>
      ))}
      <House position={[-4.2, 0, -0.4]} />
      <House position={[-3.2, 0, -0.9]} roof={CHAM} />
      {/* lều trại giặc */}
      {[-0.5, 0.8, 2.1, 3.3].map((x, i) => (
        <mesh key={x} position={[x, 0.3, -1.6 + (i % 2) * 0.5]} material={toon(i % 2 ? '#d7cdb5' : '#c2b89f')} castShadow>
          <coneGeometry args={[0.45, 0.65, 4]} />
          <Ink />
        </mesh>
      ))}
    </group>
  );
}

function Trees({ seed }: { seed: number }) {
  const trees = useMemo(() => {
    const r = rand(seed + 3);
    const out: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      out.push([side * (W / 2 - 0.4 - r() * 1.2), -2.4 + r() * 5, 0.7 + r() * 0.5]);
    }
    return out;
  }, [seed]);
  return (
    <group>
      {trees.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.2, 0]} material={toon('#5a3a1e')}>
            <cylinderGeometry args={[0.04, 0.06, 0.4, 5]} />
          </mesh>
          <mesh position={[0, 0.52, 0]} material={toon(i % 3 ? LA : '#3f6633')} castShadow>
            <sphereGeometry args={[0.26, 10, 8]} />
            <Ink w={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- mái cong, nhà, lính, thuyền, cờ ---------- */

const roofCache = new Map<string, THREE.BufferGeometry>();
function roofGeo(w: number, h: number, d: number) {
  const key = `${w}|${h}|${d}`;
  let g = roofCache.get(key);
  if (g) return g;
  // mặt cắt mái: hai mái dốc lõm, đầu đao vểnh ở hai đầu
  const s = new THREE.Shape();
  const hw = w / 2;
  s.moveTo(-hw - 0.12, h * 0.28);
  s.quadraticCurveTo(-hw * 0.7, -0.02, -hw * 0.45, 0.02);
  s.lineTo(hw * 0.45, 0.02);
  s.quadraticCurveTo(hw * 0.7, -0.02, hw + 0.12, h * 0.28);
  s.quadraticCurveTo(hw * 0.5, h * 0.35, 0, h);
  s.quadraticCurveTo(-hw * 0.5, h * 0.35, -hw - 0.12, h * 0.28);
  g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  roofCache.set(key, g);
  return g;
}

export function Roof({ position, w, d, h, color = SON, rotY = 0 }: { position: [number, number, number]; w: number; d: number; h: number; color?: string; rotY?: number }) {
  return (
    <mesh position={position} rotation={[0, rotY, 0]} geometry={roofGeo(w, h, d)} material={toon(color)} castShadow>
      <Ink />
    </mesh>
  );
}

export function House({ position, roof = SON, scale = 1 }: { position: [number, number, number]; roof?: string; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} material={toon('#e6d6b0')} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.5]} />
        <Ink />
      </mesh>
      <mesh position={[0, 0.15, 0.26]} material={toon(INK)}>
        <boxGeometry args={[0.16, 0.26, 0.01]} />
      </mesh>
      <Roof position={[0, 0.4, 0]} w={0.85} d={0.66} h={0.32} color={roof} />
    </group>
  );
}

/** Lính gỗ. `lite` bỏ bớt viền mực cho nhẹ khi có nhiều quân. */
export function Soldier({ body, hat = HOE, flag, scale = 1, lite = false }: { body: string; hat?: string; flag?: string; scale?: number; lite?: boolean }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.12, 0]} material={toon(body)} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.24, 8]} />
        <Ink w={0.6} />
      </mesh>
      <mesh position={[0, 0.29, 0]} material={toon('#e8c9a0')}>
        <sphereGeometry args={[0.065, 10, 8]} />
        {!lite && <Ink w={0.5} />}
      </mesh>
      <mesh position={[0, 0.355, 0]} material={toon(hat)}>
        <coneGeometry args={[0.12, 0.06, 12]} />
        <Ink w={0.5} />
      </mesh>
      <mesh position={[0.09, 0.22, 0]} material={toon('#5a3a1e')}>
        <cylinderGeometry args={[0.008, 0.008, 0.46, 4]} />
      </mesh>
      <mesh position={[0.09, 0.47, 0]} material={toon('#8c8c8c')}>
        <coneGeometry args={[0.018, 0.06, 4]} />
      </mesh>
      {flag && (
        <mesh position={[0.15, 0.4, 0]} material={toon(flag)}>
          <boxGeometry args={[0.12, 0.09, 0.005]} />
        </mesh>
      )}
    </group>
  );
}

const shipHullGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.55, 0.16);
  s.quadraticCurveTo(-0.45, -0.02, -0.2, -0.04);
  s.lineTo(0.25, -0.04);
  s.quadraticCurveTo(0.5, -0.02, 0.62, 0.2);
  s.lineTo(0.45, 0.1);
  s.lineTo(-0.42, 0.1);
  s.lineTo(-0.55, 0.16);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: false });
  g.translate(0, 0, -0.16);
  return g;
})();

function Ship({ sail = '#6e6a62' }: { sail?: string }) {
  return (
    <group>
      <mesh geometry={shipHullGeo} material={toon('#3a3029')} castShadow>
        <Ink w={0.8} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={toon('#5a3a1e')}>
        <cylinderGeometry args={[0.015, 0.02, 0.75, 5]} />
      </mesh>
      <mesh position={[0.02, 0.48, 0]} material={toon(sail)} castShadow>
        <boxGeometry args={[0.36, 0.48, 0.01]} />
        <Ink w={0.5} />
      </mesh>
      {[0.32, 0.44, 0.56, 0.68].map((y) => (
        <mesh key={y} position={[0.02, y, 0.007]} material={toon(INK)}>
          <boxGeometry args={[0.37, 0.012, 0.004]} />
        </mesh>
      ))}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.14, 0]} material={toon('#c8b07a')}>
          <boxGeometry args={[0.12, 0.08, 0.14]} />
        </mesh>
      ))}
    </group>
  );
}

export function Flag({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -0.4, 0]} material={toon('#5a3a1e')}>
        <cylinderGeometry args={[0.015, 0.015, 0.9, 5]} />
      </mesh>
      <mesh position={[0.2, -0.1, 0]} material={toon(color)} castShadow>
        <boxGeometry args={[0.38, 0.26, 0.01]} />
        <Ink w={0.5} />
      </mesh>
    </group>
  );
}

/* ---------- quân giặc ---------- */

function Enemy({
  count,
  onWater,
  anim,
  clock,
}: {
  count: number;
  onWater: boolean;
  anim: React.MutableRefObject<Anim>;
  clock: React.MutableRefObject<number>;
}) {
  const units = useMemo(() => {
    const n = onWater ? Math.max(3, Math.min(9, Math.round(count / 2))) : count;
    const r = rand(count * 13 + (onWater ? 1 : 0));
    return Array.from({ length: n }, (_, i) => {
      const cols = onWater ? Math.min(5, n) : 6;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * (onWater ? 1.7 : 1.1) + (r() - 0.5) * 0.3;
      const z = onWater ? -0.6 - row * 0.8 + (r() - 0.5) * 0.2 : -0.4 - row * 0.5;
      return { x, z, delay: r() * 0.9, side: r() > 0.5 ? 1 : -1 };
    });
  }, [count, onWater]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    const a = anim.current;
    const t = clock.current - a.t0;
    units.forEach((u, i) => {
      const g = refs.current[i];
      if (!g) return;
      const bob = onWater ? Math.sin(s.clock.elapsedTime * 1.4 + i) * 0.02 : 0;
      g.position.set(u.x, (onWater ? HIGH : 0) + bob, u.z);
      g.rotation.set(0, onWater ? Math.PI / 2 : 0, 0);
      if (!a.active) return;
      const p = Math.min(1, Math.max(0, (t - 0.8 - u.delay) / 1.2));
      const e = p * p * (3 - 2 * p);
      if (a.won) {
        if (onWater) {
          g.rotation.z = u.side * 1.0 * e;
          g.position.y = HIGH + (LOW - 0.25 - HIGH) * e;
        } else {
          g.rotation.x = -1.45 * e;
        }
      } else {
        g.position.z = u.z + 1.6 * e;
      }
    });
  });
  return (
    <group>
      {units.map((u, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[u.x, 0, u.z]}>
          {onWater ? <Ship /> : <Soldier body="#4a5560" hat="#2a2a2a" scale={1.6} flag={i % 4 === 0 ? '#2a2a2a' : undefined} />}
        </group>
      ))}
    </group>
  );
}

function OurBoats() {
  const xs = [-4.2, -2.4, -0.6, 1.2, 3.0, 4.6];
  const ref = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (ref.current) ref.current.position.y = HIGH + Math.sin(s.clock.elapsedTime * 1.2) * 0.015;
  });
  return (
    <group ref={ref}>
      {xs.map((x, i) => (
        <group key={x} position={[x, 0, 1.0 + (i % 2) * 0.3]} rotation={[0, Math.PI / 2 + (i % 2 ? 0.2 : -0.2), 0]}>
          <mesh material={toon(SON)} castShadow>
            <boxGeometry args={[0.18, 0.08, 0.7]} />
            <Ink w={0.6} />
          </mesh>
          {[-0.18, 0.18].map((z) => (
            <mesh key={z} position={[0, 0.1, z]} material={toon(HOE)}>
              <coneGeometry args={[0.07, 0.05, 10]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

