import type { Res, Terrain } from '../engine';

export const TERRAIN_COLOR: Record<Terrain, string> = {
  ruong: '#d8a23a',
  rung: '#2e6b4e',
  nui: '#7a726a',
  song: '#1f5a8a',
  lang: '#a8322d',
};

export const TERRAIN_NAME: Record<Terrain, string> = {
  ruong: 'Ruộng',
  rung: 'Rừng',
  nui: 'Núi',
  song: 'Sông',
  lang: 'Làng',
};

export const TERRAIN_ICON: Record<Terrain, string> = {
  ruong: '🌾',
  rung: '🌲',
  nui: '⛰️',
  song: '🌊',
  lang: '🏘️',
};

export const RES_NAME: Record<Res, string> = { lua: 'Lúa', go: 'Gỗ', sat: 'Sắt', tien: 'Tiền' };
export const RES_ICON: Record<Res, string> = { lua: '🌾', go: '🪵', sat: '⛏️', tien: '🪙' };
export const RES_COLOR: Record<Res, string> = { lua: '#e9c46a', go: '#a0703a', sat: '#9aa4ad', tien: '#f2c14e' };

export const GOLD = '#d9a53a';
export const GOLD_BRIGHT = '#f6d27a';
export const LACQUER_RED = '#7a1712';
export const LACQUER_BLACK = '#140b08';

export function isLowPower(): boolean {
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const params = new URLSearchParams(location.search);
    if (params.get('hieuung') === 'thap') return true;
    if (params.get('hieuung') === 'cao') return false;
    return coarse || small;
  } catch {
    return false;
  }
}
