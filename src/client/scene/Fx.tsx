// Hiệu ứng ngắn: giấy màu bung ra, vòng sóng, chữ bay lên. Không phát sáng — màu phẳng như tranh in.
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CHAM, HOE, INK, LA, SON } from '../theme';

type Vec3 = [number, number, number];
/** 'paper' = giấy màu (son, hoè, chàm, lá); 'ink' = mực đen; hoặc một mã màu. */
export type BurstColor = 'paper' | 'ink' | string;

interface Burst {
  id: number;
  pos: Vec3;
  color: BurstColor;
  count: number;
  born: number;
  life: number;
  vel: Float32Array;
  spin: Float32Array;
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

/** Bung một nắm giấy màu / mực từ một điểm. */
export function burst(pos: Vec3, color: BurstColor = 'paper', count = 40, life = 1.6) {
  const vel = new Float32Array(count * 3);
  const spin = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const up = 1.2 + Math.random() * 2.2;
    const sp = 0.5 + Math.random() * 1.6;
    vel[i * 3] = Math.cos(a) * sp;
    vel[i * 3 + 1] = up;
    vel[i * 3 + 2] = Math.sin(a) * sp;
    spin[i * 3] = (Math.random() - 0.5) * 12;
    spin[i * 3 + 1] = (Math.random() - 0.5) * 12;
    spin[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  pending.bursts.push({ id: nextId++, pos, color, count, born: -1, life, vel, spin });
}

/** Vòng sóng toả ra mặt bàn (Tuyệt kỹ). */
export function ring(pos: Vec3, color = SON) {
  pending.rings.push({ id: nextId++, pos, color, born: -1 });
}

/** Chữ bay lên (ví dụ "+3 Lúa"). */
export function floatText(pos: Vec3, text: string, color = '') {
  pending.texts.push({ id: nextId++, pos, text, color, born: -1 });
}

const PAPER_COLORS = [SON, HOE, CHAM, LA, SON, HOE];
const chipGeo = new THREE.PlaneGeometry(0.11, 0.075);
const chipMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true });

function BurstChips({ b }: { b: Burst }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const mat = useMemo(() => chipMat.clone(), []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1) }), []);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    for (let i = 0; i < b.count; i++) {
      c.set(b.color === 'paper' ? PAPER_COLORS[i % PAPER_COLORS.length] : b.color === 'ink' ? INK : b.color);
      ref.current.setColorAt(i, c);
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [b]);
  useFrame(() => {
    const t = now - b.born;
    const drag = 1 / (1 + t * 0.9); // giấy rơi chậm, lả lướt
    for (let i = 0; i < b.count; i++) {
      const vx = b.vel[i * 3];
      const vy = b.vel[i * 3 + 1];
      const vz = b.vel[i * 3 + 2];
      tmp.p.set(
        b.pos[0] + vx * t * drag + Math.sin(t * 3 + i) * 0.06,
        b.pos[1] + vy * t * drag - 1.6 * t * t * 0.6,
        b.pos[2] + vz * t * drag,
      );
      tmp.e.set(b.spin[i * 3] * t, b.spin[i * 3 + 1] * t, b.spin[i * 3 + 2] * t);
      tmp.q.setFromEuler(tmp.e);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      ref.current.setMatrixAt(i, tmp.m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    mat.opacity = Math.max(0, Math.min(1, (b.life - t) / 0.4));
  });
  return <instancedMesh ref={ref} args={[chipGeo, mat, b.count]} frustumCulled={false} />;
}

function RingMesh({ r }: { r: Ring }) {
  const ref = useRef<THREE.Group>(null!);
  const mats = useMemo(
    () => [new THREE.MeshBasicMaterial({ color: r.color, transparent: true, depthWrite: false }), new THREE.MeshBasicMaterial({ color: INK, transparent: true, depthWrite: false })],
    [r.color],
  );
  useFrame(() => {
    const t = now - r.born;
    const s = 0.3 + t * 4.2;
    ref.current.scale.set(s, s, s);
    const o = Math.max(0, 1 - t / 1.3);
    mats[0].opacity = o;
    mats[1].opacity = o;
  });
  return (
    <group ref={ref} position={r.pos} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh material={mats[0]}>
        <ringGeometry args={[0.9, 1, 48]} />
      </mesh>
      <mesh material={mats[1]}>
        <ringGeometry args={[1, 1.03, 48]} />
      </mesh>
    </group>
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
      <Html center zIndexRange={[4, 2]} style={{ pointerEvents: 'none' }}>
        <div className="float-text" style={f.color ? { background: f.color } : undefined}>
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
        <BurstChips key={b.id} b={b} />
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
