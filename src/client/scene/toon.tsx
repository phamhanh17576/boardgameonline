// Chất liệu "đồ chơi gỗ sơn màu" cho sa bàn: đổ bóng 3 nấc phẳng + viền mực.
import { Outlines } from '@react-three/drei';
import { createContext, useContext } from 'react';
import * as THREE from 'three';
import { INK } from '../theme';

let gradient: THREE.DataTexture | null = null;
function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([110, 110, 110, 255, 185, 185, 185, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map<string, THREE.MeshToonMaterial>();
/** Vật liệu sơn phẳng dùng chung theo màu. */
export function toon(color: string, opts: { transparent?: boolean; opacity?: number; map?: THREE.Texture } = {}): THREE.MeshToonMaterial {
  const key = `${color}|${opts.transparent ? opts.opacity : ''}|${opts.map?.uuid ?? ''}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), transparent: !!opts.transparent, opacity: opts.opacity ?? 1 });
    if (opts.map) m.map = opts.map;
    cache.set(key, m);
  }
  return m;
}

/** Bật/tắt viền mực (tắt ở máy yếu cho mượt). */
export const InkCtx = createContext(true);

export function Ink({ w = 1 }: { w?: number }) {
  const on = useContext(InkCtx);
  if (!on) return null;
  return <Outlines thickness={0.022 * w} color={INK} />;
}

/** Vẽ lên canvas rồi dùng làm texture. */
export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Hạt giấy dó lấm tấm. */
export function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, color = 'rgba(80,60,30,0.10)') {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.6 + 0.3;
    g.fillRect(x, y, r, r * (0.5 + Math.random() * 3));
  }
}

/** Mây cuộn kiểu Đông Hồ. */
export function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string, ink = '#1d1914') {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.lineWidth = 3 / s;
  g.strokeStyle = ink;
  g.fillStyle = fill;
  const lobes: [number, number, number][] = [
    [0, 0, 22],
    [26, -8, 18],
    [48, 2, 16],
    [-24, 6, 14],
  ];
  g.beginPath();
  for (const [cx, cy, r] of lobes) {
    g.moveTo(cx + r, cy);
    g.arc(cx, cy, r, 0, Math.PI * 2);
  }
  g.fill();
  g.stroke();
  // xoắn ốc bên trong
  for (const [cx, cy, r] of lobes) {
    g.beginPath();
    for (let a = 0; a < Math.PI * 3; a += 0.15) {
      const rr = (r * 0.65 * a) / (Math.PI * 3);
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.stroke();
  }
  g.restore();
}
