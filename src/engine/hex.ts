import type { Terrain, Territory } from './types';

export const HEX_RADIUS = 2;
export const DIRS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export const hexKey = (q: number, r: number) => `${q},${r}`;
export const parseKey = (k: string): [number, number] => {
  const [q, r] = k.split(',').map(Number);
  return [q, r];
};

export function inBoard(q: number, r: number): boolean {
  const s = -q - r;
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= HEX_RADIUS;
}

let _cells: string[] | null = null;
/** Toàn bộ 19 ô của lãnh địa (bán kính 2). */
export function allCells(): string[] {
  if (_cells) return _cells;
  const out: string[] = [];
  for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
    for (let r = -HEX_RADIUS; r <= HEX_RADIUS; r++) {
      if (inBoard(q, r)) out.push(hexKey(q, r));
    }
  }
  _cells = out;
  return out;
}

export function neighbors(k: string): string[] {
  const [q, r] = parseKey(k);
  const out: string[] = [];
  for (const [dq, dr] of DIRS) {
    if (inBoard(q + dq, r + dr)) out.push(hexKey(q + dq, r + dr));
  }
  return out;
}

export interface Region {
  terrain: Terrain;
  cells: string[];
}

/** Các vùng: nhóm ô cùng loại liền nhau. */
export function regions(t: Territory): Region[] {
  const seen = new Set<string>();
  const out: Region[] = [];
  for (const k of Object.keys(t)) {
    if (seen.has(k)) continue;
    const terrain = t[k];
    const cells: string[] = [];
    const stack = [k];
    seen.add(k);
    while (stack.length) {
      const c = stack.pop()!;
      cells.push(c);
      for (const n of neighbors(c)) {
        if (!seen.has(n) && t[n] === terrain) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    out.push({ terrain, cells });
  }
  return out;
}

/** Ô trống có thể đặt (kề ít nhất 1 ô đã có). */
export function placeableCells(t: Territory): string[] {
  const keys = Object.keys(t);
  if (keys.length === 0) return ['0,0'];
  const out = new Set<string>();
  for (const k of keys) {
    for (const n of neighbors(k)) if (!t[n]) out.add(n);
  }
  return [...out];
}

export function largestRegion(t: Territory, terrain: Terrain): number {
  return regions(t)
    .filter((r) => r.terrain === terrain)
    .reduce((m, r) => Math.max(m, r.cells.length), 0);
}
