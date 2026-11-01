import type { Res, Terrain } from '../engine';
import type { IconName } from './ui/Icon';

// Bảng màu lấy từ chất liệu tranh Đông Hồ: giấy dó, điệp, mực than lá tre,
// xanh chàm, đỏ son, vàng hoè, xanh lá.
export const INK = '#1d1914';
export const PAPER = '#e7d8b8';
export const PAPER_DARK = '#d6c39b';
export const DIEP = '#f6efdf';
export const CHAM = '#23415e';
export const SON = '#b83a2b';
export const HOE = '#e2a72e';
export const LA = '#4f7a3f';

export const TERRAIN_COLOR: Record<Terrain, string> = {
  ruong: HOE,
  rung: LA,
  nui: '#8a7a62',
  song: '#2f5d86',
  lang: SON,
};

export const TERRAIN_NAME: Record<Terrain, string> = {
  ruong: 'Ruộng',
  rung: 'Rừng',
  nui: 'Núi',
  song: 'Sông',
  lang: 'Làng',
};

export const TERRAIN_ICON: Record<Terrain, IconName> = {
  ruong: 'ruong',
  rung: 'rung',
  nui: 'nui',
  song: 'song',
  lang: 'lang',
};

export const RES_NAME: Record<Res, string> = { lua: 'Lúa', go: 'Gỗ', sat: 'Sắt', tien: 'Tiền' };
export const RES_ICON: Record<Res, IconName> = { lua: 'lua', go: 'go', sat: 'sat', tien: 'tien' };
export const RES_COLOR: Record<Res, string> = { lua: '#c98a12', go: '#7a4b22', sat: '#4a5560', tien: '#9a6a12' };

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
