import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type Vec3 = [number, number, number];
interface Burst {
  id: number;
  pos: Vec3;
  color: string;
  count: number;
  born: number;
  life: number;
  vel: Float32Array;
}
interface Ring {
  id: number;
  pos: Vec3;
  color: string;
  born: number;
}
interface FloatText {
  id: number;
  pos: Vec3;
  text: string;
  color: string;
  born: number;
}

let nextId = 1;
const pending: { bursts: Burst[]; rings: Ring[]; texts: FloatText[] } = { bursts: [], rings: [], texts: [] };
let now = 0;

/** Bụi vàng / tia lửa bắn ra từ một điểm. */
export function burst(pos: Vec3, color = '#f6d27a', count = 40, life = 1.4) {
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const up = 0.6 + Math.random() * 1.8;
    const sp = 0.6 + Math.random() * 1.8;
    vel[i * 3] = Math.cos(a) * sp;
    vel[i * 3 + 1] = up;
    vel[i * 3 + 2] = Math.sin(a) * sp;
  }
  pending.bursts.push({ id: nextId++, pos, color, count, born: -1, life, vel });
}

/** Vòng sóng toả ra (Tuyệt kỹ). */
export function ring(pos: Vec3, color = '#f6d27a') {
  pending.rings.push({ id: nextId++, pos, color, born: -1 });
}

/** Chữ bay lên (ví dụ +3🌾). */
export function floatText(pos: Vec3, text: string, color = '#f6d27a') {
  pending.texts.push({ id: nextId++, pos, text, color, born: -1 });
}

let dotTexture: THREE.Texture | null = null;
function getDot(): THREE.Texture {
  if (dotTexture) return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,240,200,0.8)');
  grd.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new THREE.CanvasTexture(c);
  return dotTexture;
}

function BurstPoints({ b }: { b: Burst }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b.count * 3), 3));
    return g;
  }, [b.count]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: b.color,
        size: 0.22,
        map: getDot(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [b.color],
  );
  useFrame(() => {
    const t = now - b.born;
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < b.count; i++) {
      pos[i * 3] = b.pos[0] + b.vel[i * 3] * t;
      pos[i * 3 + 1] = b.pos[1] + b.vel[i * 3 + 1] * t - 2.2 * t * t;
      pos[i * 3 + 2] = b.pos[2] + b.vel[i * 3 + 2] * t;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - t / b.life);
  });
  return <points geometry={geo} material={mat} />;
}

function RingMesh({ r }: { r: Ring }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    const t = now - r.born;
    const s = 0.3 + t * 4.5;
    ref.current.scale.set(s, s, s);
    mat.current.opacity = Math.max(0, 0.9 - t / 1.3);
  });
  return (
    <mesh ref={ref} position={r.pos} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.06, 8, 64]} />
      <meshBasicMaterial ref={mat} color={r.color} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function FloatLabel({ f }: { f: FloatText }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    const t = now - f.born;
    ref.current.position.set(f.pos[0], f.pos[1] + t * 0.9, f.pos[2]);
  });
  return (
    <group ref={ref} position={f.pos}>
      <Html center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <div className="float-text" style={{ color: f.color }}>
          {f.text}
        </div>
      </Html>
    </group>
  );
}

/** Lớp hiệu ứng tạm thời (tự dọn khi hết thời gian sống). */
export function FxLayer() {
  const [, force] = useState(0);
  const live = useRef<{ bursts: Burst[]; rings: Ring[]; texts: FloatText[] }>({ bursts: [], rings: [], texts: [] });
  useFrame((state) => {
    now = state.clock.elapsedTime;
    let changed = false;
    const L = live.current;
    for (const k of ['bursts', 'rings', 'texts'] as const) {
      if (pending[k].length) {
        for (const it of pending[k]) it.born = now;
        (L[k] as unknown[]).push(...pending[k]);
        pending[k].length = 0;
        changed = true;
      }
    }
    const before = L.bursts.length + L.rings.length + L.texts.length;
    L.bursts = L.bursts.filter((b) => now - b.born < b.life);
    L.rings = L.rings.filter((r) => now - r.born < 1.3);
    L.texts = L.texts.filter((f) => now - f.born < 1.8);
    if (L.bursts.length + L.rings.length + L.texts.length !== before) changed = true;
    if (changed) force((x) => x + 1);
  });
  const L = live.current;
  return (
    <group>
      {L.bursts.map((b) => (
        <BurstPoints key={b.id} b={b} />
      ))}
      {L.rings.map((r) => (
        <RingMesh key={r.id} r={r} />
      ))}
      {L.texts.map((f) => (
        <FloatLabel key={f.id} f={f} />
      ))}
    </group>
  );
}
