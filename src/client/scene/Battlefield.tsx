import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BATTLES, type BattleId, type GameView } from '../../engine';
import { GOLD } from '../theme';
import { useFxEvents } from './fxHooks';
import { burst } from './Fx';

const HIGH_TIDE = 0.18;
const LOW_TIDE = -0.42;
const RIVER_W = 11;
const RIVER_D = 3.0;

function makeWater() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#0d2d4a') },
      uShallow: { value: new THREE.Color('#2a6f8f') },
      uGold: { value: new THREE.Color('#f2c46a') },
      uRed: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying float vH;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec3 p = position;
        float h = sin(p.x * 2.1 + uTime * 1.3) * 0.035 + sin(p.y * 3.7 - uTime * 1.7) * 0.025 + sin((p.x + p.y) * 5.0 + uTime * 2.3) * 0.012;
        p.z += h;
        vH = h;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uGold;
      uniform float uTime;
      uniform float uRed;
      varying vec2 vUv;
      varying float vH;
      varying vec3 vWorld;
      void main() {
        float edge = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);
        vec3 col = mix(uShallow, uDeep, edge);
        float glint = pow(max(0.0, sin(vWorld.x * 1.7 + uTime * 0.9 + sin(vWorld.z * 2.3)) * sin(vWorld.z * 2.6 - uTime * 0.7)), 18.0);
        float ripple = smoothstep(0.02, 0.05, vH);
        col += uGold * (glint * 0.4 + ripple * 0.08);
        col = mix(col, vec3(0.42, 0.04, 0.03), uRed * 0.5 * edge);
        float fres = pow(1.0 - abs(normalize(cameraPosition - vWorld).y), 2.0);
        col += vec3(0.25, 0.2, 0.1) * fres * 0.35;
        gl_FragColor = vec4(col, 0.86);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

interface AnimState {
  start: number;
  won: boolean;
  battleId: BattleId;
  active: boolean;
}

export function Battlefield({ view, low }: { view: GameView; low: boolean }) {
  const water = useMemo(makeWater, []);
  const waterRef = useRef<THREE.Mesh>(null!);
  const stakesRef = useRef<THREE.Group>(null!);
  const shipsRef = useRef<THREE.Group>(null!);
  const anim = useRef<AnimState>({ start: 0, won: false, battleId: view.battle.id, active: view.phase === 'battleResult' });
  const clock = useRef(0);
  const def = BATTLES[view.battle.id];
  const isBachDang = def.id === 'bachDang1288';

  const goCommitted = Object.values(view.battle.tactic).reduce((s, r) => s + r.go, 0);
  const stakeCount = isBachDang ? Math.min(36, 6 + goCommitted * 3) : 0;
  const enemyGuess = def.strengthPerPlayer * view.players.length + def.strengthBase + view.battle.enemyMod;
  const shipCount = Math.max(3, Math.min(9, Math.round(enemyGuess / 6)));

  useFxEvents((e) => {
    if (e.type === 'battleResolved') {
      anim.current = { start: clock.current, won: !!e.data?.won, battleId: view.battle.id, active: true };
      // Bọt nước và lửa dọc sông
      for (let i = 0; i < (low ? 3 : 7); i++) {
        setTimeout(() => burst([(-4 + Math.random() * 8), 0.2, (Math.random() - 0.5) * 1.6], e.data?.won ? '#ff8a3a' : '#9fd3ff', low ? 20 : 45), 1600 + i * 260);
      }
    }
    if (e.type === 'battleStart') anim.current = { start: clock.current, won: false, battleId: (e.data?.battleId as BattleId) ?? view.battle.id, active: false };
  });

  useFrame((_, dt) => {
    clock.current += dt;
    const t = clock.current;
    water.uniforms.uTime.value = t;
    const a = anim.current;
    const since = a.active ? t - a.start : 0;
    // Thủy triều: rút xuống khi giải quyết trận
    const tideP = a.active ? Math.min(1, since / 2.4) : 0;
    const ease = tideP * tideP * (3 - 2 * tideP);
    const tide = isBachDang ? HIGH_TIDE + (LOW_TIDE - HIGH_TIDE) * ease : HIGH_TIDE - 0.12 * ease;
    waterRef.current.position.y = tide;
    const red = a.active && a.won && isBachDang ? Math.min(1, Math.max(0, (since - 2.2) / 2)) : 0;
    water.uniforms.uRed.value += (red - water.uniforms.uRed.value) * Math.min(1, dt * 2);

    // Thuyền giặc
    shipsRef.current.children.forEach((ship, i) => {
      const baseX = -4.6 + (i * 9.2) / Math.max(1, shipsRef.current.children.length - 1);
      const bob = Math.sin(t * 1.4 + i) * 0.04;
      let x = baseX + Math.sin(t * 0.25 + i * 1.7) * 0.25;
      let z = -0.6 + (i % 2) * 0.5;
      let y = tide + 0.05 + bob;
      let tilt = Math.sin(t + i) * 0.04;
      if (a.active) {
        const p = Math.min(1, Math.max(0, (since - 0.6) / 2.6));
        if (a.won) {
          // dụ vào bãi cọc rồi mắc kẹt, lật đổ
          z += p * 0.9;
          const sink = Math.max(0, (since - 2.0) / 2.2);
          y = Math.max(LOW_TIDE - 0.25, tide + 0.05 - Math.min(1, sink) * 0.35);
          tilt = Math.min(1.1, sink * 0.9) * (i % 2 ? 1 : -1);
        } else {
          z += p * 2.2;
        }
      }
      ship.position.set(x, y, z);
      ship.rotation.set(tilt * 0.6, Math.PI / 2 + Math.sin(t * 0.3 + i) * 0.05, tilt);
    });

    // Cọc lộ dần khi nước rút
    if (stakesRef.current) stakesRef.current.position.y = -0.05;
  });

  const stakes = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < stakeCount; i++) {
      const col = i % 12;
      const row = Math.floor(i / 12);
      out.push([-4.4 + col * 0.8 + (row % 2) * 0.4, -0.25 + row * 0.42]);
    }
    return out;
  }, [stakeCount]);

  return (
    <group>
      {/* Lòng sông */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RIVER_W, RIVER_D + 0.6]} />
        <meshStandardMaterial color="#2b2118" roughness={0.9} />
      </mesh>
      {/* Mặt nước */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} material={water}>
        <planeGeometry args={[RIVER_W, RIVER_D, low ? 60 : 140, low ? 16 : 36]} />
      </mesh>
      {/* Bờ gần (quân ta) và bờ xa */}
      <Bank z={2.75} depth={2.5} color="#3b4a2a" />
      <Bank z={-2.85} depth={2.7} color="#2f3b24" />
      <Mountains />
      {!isBachDang && <Islands />}
      <Reeds low={low} />
      {/* Bãi cọc gỗ */}
      <group ref={stakesRef}>
        {stakes.map(([x, z], i) => (
          <mesh key={i} position={[x, -0.25, z]} rotation={[0.25 * (i % 2 ? 1 : -1), 0, 0.2 * ((i % 3) - 1)]} castShadow>
            <cylinderGeometry args={[0.035, 0.055, 0.75, 6]} />
            <meshStandardMaterial color="#5a3b1e" roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* Thuyền giặc */}
      <group ref={shipsRef}>
        {Array.from({ length: shipCount }, (_, i) => (
          <Ship key={i} grain={!isBachDang || i % 3 === 0} />
        ))}
      </group>
      {/* Thuyền nhẹ quân ta nấp ven bờ */}
      {[-3.6, -1.2, 1.4, 3.8].map((x, i) => (
        <group key={i} position={[x, HIGH_TIDE + 0.02, 1.25]} rotation={[0, Math.PI / 2, 0]} scale={0.55}>
          <mesh>
            <boxGeometry args={[0.32, 0.12, 1.1]} />
            <meshPhysicalMaterial color="#7a1712" clearcoat={1} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

let lacquerTex: THREE.CanvasTexture | null = null;
/** Hoa văn mây và sóng vẽ vàng trên nền sơn mài (tạo bằng canvas, không cần tải ảnh). */
function lacquerTexture(): THREE.CanvasTexture {
  if (lacquerTex) return lacquerTex;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#2c3a22');
  grd.addColorStop(1, '#1b2414');
  g.fillStyle = grd;
  g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = 'rgba(232, 184, 90, 0.55)';
  g.lineWidth = 2.2;
  // mây cuộn
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 72 + (i % 2) * 20;
    const y = 70 + (i % 3) * 55;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.arc(x + k * 16, y, 9 + k * 3, Math.PI * 0.9, Math.PI * 2.4);
      g.stroke();
    }
  }
  // sóng nước
  g.strokeStyle = 'rgba(232, 184, 90, 0.35)';
  g.lineWidth = 1.6;
  for (let row = 0; row < 3; row++) {
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) g.lineTo(x, 225 + row * 9 + Math.sin(x / 22 + row) * 4);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  lacquerTex = t;
  return t;
}

function Bank({ z, depth, color }: { z: number; depth: number; color: string }) {
  const tex = useMemo(lacquerTexture, []);
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[RIVER_W, 0.5, depth]} />
        <meshPhysicalMaterial color={color} roughness={0.55} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, z > 0 ? 0 : Math.PI]} receiveShadow>
        <planeGeometry args={[RIVER_W, depth]} />
        <meshPhysicalMaterial map={tex} roughness={0.4} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      <mesh position={[0, 0.105, (z > 0 ? -1 : 1) * (depth / 2 - 0.03)]}>
        <boxGeometry args={[RIVER_W, 0.02, 0.05]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} emissive="#5a3a00" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Mountains() {
  const peaks = useMemo(
    () => [
      [-4.6, -3.4, 1.5],
      [-3.4, -3.7, 1.1],
      [-1.9, -3.5, 1.7],
      [0.3, -3.8, 1.25],
      [2.2, -3.4, 1.9],
      [3.9, -3.7, 1.35],
      [5.2, -3.3, 1.0],
    ],
    [],
  );
  return (
    <group>
      {peaks.map(([x, z, h], i) => (
        <group key={i} position={[x, 0.1, z]}>
          <mesh castShadow>
            <coneGeometry args={[h * 0.62, h, 6]} />
            <meshStandardMaterial color={i % 2 ? '#2f4a3a' : '#3c5444'} flatShading roughness={0.8} />
          </mesh>
          <mesh position={[0, h * 0.36, 0]}>
            <coneGeometry args={[h * 0.18, h * 0.28, 6]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} emissive="#6a4000" emissiveIntensity={0.35} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Islands() {
  return (
    <group>
      {[
        [-2.6, -0.2, 0.55],
        [0.8, 0.35, 0.42],
        [3.1, -0.4, 0.6],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, -0.1, z]} scale={[s, s * 1.2, s * 0.8]} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#4a5a48" flatShading roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Reeds({ low }: { low: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = low ? 60 : 160;
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: -5.8 + Math.random() * 11.6,
        z: i % 2 ? 1.35 + Math.random() * 0.25 : -1.35 - Math.random() * 0.25,
        h: 0.25 + Math.random() * 0.35,
        p: Math.random() * 6,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(s.x, s.h / 2, s.z);
      dummy.rotation.set(Math.sin(t * 1.2 + s.p) * 0.12, 0, Math.cos(t + s.p) * 0.1);
      dummy.scale.set(1, s.h, 1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.02, 1, 0.02]} />
      <meshStandardMaterial color="#9a8a3a" roughness={0.7} />
    </instancedMesh>
  );
}

function Ship({ grain }: { grain: boolean }) {
  return (
    <group scale={0.62}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.22, 1.5]} />
        <meshStandardMaterial color="#2a1f1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.06, 0.78]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.46, 0.18, 0.3]} />
        <meshStandardMaterial color="#2a1f1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.2, 5]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      <mesh position={[0, 0.72, 0.02]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.9, 0.85]} />
        <meshStandardMaterial color="#3d3530" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.3]} />
        <meshStandardMaterial color="#c9b26a" />
      </mesh>
      {grain &&
        [-0.35, 0, 0.35].map((z, i) => (
          <mesh key={i} position={[0, 0.19, z]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshStandardMaterial color="#c8a86a" roughness={0.9} />
          </mesh>
        ))}
    </group>
  );
}
