// Bộ sinh số ngẫu nhiên có seed (mulberry32), lưu trạng thái trong GameState
// để server và trình duyệt cho ra cùng kết quả.

export function nextRandom(state: { rngState: number }): number {
  let t = (state.rngState = (state.rngState + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function shuffle<T>(state: { rngState: number }, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randInt(state: { rngState: number }, max: number): number {
  return Math.floor(nextRandom(state) * max);
}
