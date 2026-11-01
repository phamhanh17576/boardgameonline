import { parseKey } from '../../engine';

export const HEX_SIZE = 0.46; // bán kính ô lục giác (đơn vị thế giới)
export const RING_RADIUS = 10.3;
export const BOARD_SCALE = 1;

/** Toạ độ ô lục giác (pointy-top, axial) -> mặt phẳng XZ cục bộ của bàn người chơi. */
export function hexToLocal(key: string): [number, number] {
  const [q, r] = parseKey(key);
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const z = HEX_SIZE * 1.5 * r;
  return [x, z];
}

/** Góc của ghế: người xem luôn ở phía gần camera (+Z). */
export function seatAngle(seat: number, mySeat: number, n: number): number {
  return Math.PI / 2 + ((seat - mySeat) * 2 * Math.PI) / n;
}

export function seatPosition(seat: number, mySeat: number, n: number): [number, number, number] {
  const a = seatAngle(seat, mySeat, n);
  return [Math.cos(a) * RING_RADIUS, 0, Math.sin(a) * RING_RADIUS * 0.84];
}

/** Góc xoay để bàn người chơi hướng vào giữa. */
export function seatRotation(seat: number, mySeat: number, n: number): number {
  const [x, , z] = seatPosition(seat, mySeat, n);
  return Math.atan2(x, z);
}

/** Chỗ đứng của quân trên bờ sông, theo người chơi. */
export function battleSlot(playerIndex: number, n: number, k: number): [number, number, number] {
  const groupWidth = 9 / n;
  const gx = -4.5 + groupWidth * (playerIndex + 0.5);
  const cols = 3;
  const col = k % cols;
  const row = Math.floor(k / cols);
  return [gx + (col - 1) * 0.42, 0.3, 2.0 + row * 0.42];
}

/** Đổi toạ độ cục bộ của bàn người chơi sang toạ độ thế giới. */
export function boardToWorld(
  boardPos: [number, number, number],
  rotation: number,
  local: [number, number, number],
): [number, number, number] {
  const [x, y, z] = local;
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  return [boardPos[0] + x * c + z * s, boardPos[1] + y, boardPos[2] - x * s + z * c];
}

/** Chỗ để quân trong tay (góc trước-trái của bàn). */
export function reserveSlotLocal(k: number): [number, number, number] {
  const col = k % 3;
  const row = Math.floor(k / 3);
  return [-2.2 + col * 0.42, 0.22, 0.6 + row * 0.42];
}
