import { CameraControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HEROES, type GameView, type Terrain } from '../../engine';
import { useStore } from '../store';
import { useUi } from '../ui/uiStore';
import { Battlefield } from './Battlefield';
import { burst, floatText, FxLayer, ring } from './Fx';
import { useFxEvents } from './fxHooks';
import { boardToWorld, seatPosition, seatRotation } from './layout';
import { PlayerBoard } from './PlayerBoard';
import { Table } from './Table';
import { PlayerTroops } from './Troops';
import { HOE, PAPER_DARK, RES_NAME, SON } from '../theme';
import { InkCtx } from './toon';

const OVERVIEW: [number, number, number, number, number, number] = [0, 23, 15.5, 0, 0, 3.4];
const BATTLE_VIEW: [number, number, number, number, number, number] = [0, 8.5, 9.5, 0, 0, 0.6];

export function GameScene({ view, low }: { view: GameView; low: boolean }) {
  return (
    <Canvas
      flat
      shadows={!low}
      dpr={low ? [1, 1.5] : [1, 2]}
      camera={{ position: [OVERVIEW[0], OVERVIEW[1], OVERVIEW[2]], fov: 42, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
    >
      <color attach="background" args={[PAPER_DARK]} />
      <fog attach="fog" args={[PAPER_DARK, 30, 62]} />
      <InkCtx.Provider value={!low}>
        <Suspense fallback={null}>
          <Lights low={low} />
          <Table />
          <Battlefield view={view} low={low} />
          <Boards view={view} low={low} />
          <FxLayer />
          <FxDirector view={view} low={low} />
          <CameraRig view={view} />
        </Suspense>
      </InkCtx.Provider>
    </Canvas>
  );
}

/** Ánh sáng ban ngày ấm, bóng đổ mềm; chất liệu toon tự chia 3 mảng sáng tối. */
function Lights({ low }: { low: boolean }) {
  return (
    <>
      <hemisphereLight args={['#fff6e2', '#9a7a52', 1.6]} />
      <directionalLight
        position={[7, 18, 10]}
        intensity={2.1}
        color="#fff1d6"
        castShadow={!low}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </>
  );
}

function useSeats(view: GameView) {
  const you = useStore((s) => s.you);
  const n = view.players.length;
  const mySeat = view.players.find((p) => p.id === you)?.seat ?? 0;
  return useMemo(
    () =>
      view.players.map((p) => ({
        id: p.id,
        index: view.players.indexOf(p),
        pos: seatPosition(p.seat, mySeat, n),
        rot: seatRotation(p.seat, mySeat, n),
      })),
    [view.players, mySeat, n],
  );
}

function Boards({ view, low }: { view: GameView; low: boolean }) {
  const you = useStore((s) => s.you);
  const seats = useSeats(view);
  const landPick = useUi((s) => s.landPick);
  const n = view.players.length;
  return (
    <group>
      {view.players.map((p, i) => {
        const seat = seats[i];
        const ghost: { cell: string; terrain: Terrain }[] =
          p.id === you && landPick
            ? landPick.cells.map((c, k) => ({ cell: c, terrain: view.landRow[landPick.start + k] })).filter((g) => g.terrain)
            : [];
        return (
          <group key={p.id}>
            <PlayerBoard
              p={p}
              position={seat.pos}
              rotation={seat.rot}
              active={view.phase === 'action' && view.turn.playerId === p.id}
              isMe={p.id === you}
              ghost={ghost}
              low={low}
            />
            <PlayerTroops
              heroId={p.heroId}
              index={i}
              n={n}
              reserve={p.reserve}
              atBattle={view.battle.troops[p.id] ?? 0}
              boardPos={seat.pos}
              rotation={seat.rot}
            />
          </group>
        );
      })}
    </group>
  );
}

/** Phát hiệu ứng theo sự kiện của ván. */
function FxDirector({ view, low }: { view: GameView; low: boolean }) {
  const seats = useSeats(view);
  const seatOf = (pid?: string) => seats.find((s) => s.id === pid);
  const shake = useUi((s) => s.shake);
  const statueOf = (pid?: string): [number, number, number] | null => {
    const s = seatOf(pid);
    return s ? boardToWorld(s.pos, s.rot, [0, 1.6, 2.4]) : null;
  };
  const centerOf = (pid?: string): [number, number, number] | null => {
    const s = seatOf(pid);
    return s ? [s.pos[0], 0.6, s.pos[2]] : null;
  };
  useFxEvents((e) => {
    const k = low ? 0.5 : 1;
    switch (e.type) {
      case 'tilePlaced': {
        const c = centerOf(e.playerId);
        if (c) burst(c, 'paper', Math.round(36 * k));
        break;
      }
      case 'income': {
        const c = statueOf(e.playerId);
        const gain = (e.data?.gain ?? {}) as Record<string, number>;
        const txt = Object.entries(gain)
          .filter(([, v]) => v > 0)
          .map(([r, v]) => `+${v} ${RES_NAME[r as keyof typeof RES_NAME]}`)
          .join(' ');
        if (c && txt) floatText(c, txt);
        break;
      }
      case 'generalBought': {
        const c = statueOf(e.playerId);
        if (c) {
          burst(c, 'paper', Math.round(60 * k), 1.8);
          floatText(c, 'Chiêu hiền', SON);
        }
        break;
      }
      case 'ultimate': {
        const c = centerOf(e.playerId);
        const p = view.players.find((x) => x.id === e.playerId);
        if (c && p) {
          ring([c[0], 0.3, c[2]], HEROES[p.heroId].color);
          setTimeout(() => ring([c[0], 0.32, c[2]], HOE), 180);
          burst([c[0], 1.2, c[2]], 'paper', Math.round(80 * k), 2);
        }
        break;
      }
      case 'attackDeclared':
        shake(0.25);
        break;
      case 'combatResolved': {
        const won = !!e.data?.attackerWon;
        const target = centerOf(won ? e.targetId : e.playerId);
        if (target) burst(target, won ? 'ink' : 'paper', Math.round(70 * k), 1.6);
        shake(won ? 0.6 : 0.3);
        break;
      }
      case 'stratPlayed': {
        const c = statueOf(e.playerId);
        if (c) floatText(c, 'Kế sách');
        break;
      }
      case 'troopsRecruited': {
        const c = statueOf(e.playerId);
        if (c) floatText(c, `+${e.data?.count ?? ''} Quân`);
        break;
      }
      case 'battleResolved':
        shake(0.5);
        break;
    }
  });
  return null;
}

function CameraRig({ view }: { view: GameView }) {
  const ref = useRef<CameraControls>(null!);
  const { size } = useThree();
  const portrait = size.height > size.width;
  const shakeAmt = useUi((s) => s.shakeAmt);
  const focus = useUi((s) => s.focus);
  const shakeRef = useRef(0);
  useEffect(() => {
    shakeRef.current = Math.max(shakeRef.current, shakeAmt.v);
  }, [shakeAmt]);

  const go = (v: typeof OVERVIEW, smooth = true) => {
    const c = ref.current;
    if (!c) return;
    const f = portrait ? 1.45 : 1;
    void c.setLookAt(v[0] * f, v[1] * f, v[2] * f, v[3], v[4], v[5], smooth);
  };
  useEffect(() => go(view.phase === 'battleResult' || view.phase === 'battleIntro' ? BATTLE_VIEW : OVERVIEW, false), [portrait]);
  useEffect(() => {
    if (focus === 'battle') go(BATTLE_VIEW);
    else if (focus === 'overview') go(OVERVIEW);
  }, [focus]);
  useFxEvents((e) => {
    if (e.type === 'battleStart' || e.type === 'battleResolved') go(BATTLE_VIEW);
  });
  useEffect(() => {
    if (view.phase === 'action') {
      const t = setTimeout(() => go(OVERVIEW), 400);
      return () => clearTimeout(t);
    }
  }, [view.battle.id, view.phase === 'action']);

  useFrame((state, dt) => {
    if (shakeRef.current > 0.001) {
      const s = shakeRef.current;
      state.camera.position.x += (Math.random() - 0.5) * s * 0.25;
      state.camera.position.y += (Math.random() - 0.5) * s * 0.2;
      shakeRef.current *= Math.pow(0.02, dt);
    }
  });
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={6}
      maxDistance={45}
      minPolarAngle={0.15}
      maxPolarAngle={1.25}
      smoothTime={0.6}
      draggingSmoothTime={0.15}
    />
  );
}

export { THREE };
