// Giao thức WebSocket giữa trình duyệt và phòng chơi (Cloudflare Durable Object),
// cùng logic sảnh chờ dùng chung cho chế độ online và chế độ chơi với máy.
import {
  BATTLE_COUNT_OPTIONS,
  HERO_IDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  createGame,
  randomSeed,
  type Action,
  type BattleId,
  type GameState,
  type GameView,
  type HeroId,
} from '../engine';

export interface Seat {
  id: string;
  name: string;
  heroId: HeroId | null;
  isBot: boolean;
  connected: boolean;
}

export interface RoomSettings {
  /** Số trận mỗi ván (rút ngẫu nhiên, xếp theo thứ tự năm) */
  battleCount: number;
}

export const DEFAULT_SETTINGS: RoomSettings = { battleCount: 4 };

export interface LobbyInfo {
  code: string;
  hostId: string | null;
  seats: Seat[];
  started: boolean;
  settings: RoomSettings;
}

export type ClientMsg =
  | { t: 'hello'; name: string; token?: string }
  | { t: 'pickHero'; heroId: HeroId }
  | { t: 'addBot' }
  | { t: 'removeSeat'; id: string }
  | { t: 'start' }
  | { t: 'settings'; settings: Partial<RoomSettings> }
  | { t: 'action'; action: Action }
  | { t: 'chat'; text: string }
  | { t: 'backToLobby' }
  | { t: 'ping' };

export type ServerMsg =
  | { t: 'welcome'; you: string; token: string }
  | { t: 'lobby'; lobby: LobbyInfo }
  | { t: 'state'; view: GameView }
  | { t: 'error'; message: string }
  | { t: 'chat'; from: string; text: string; at: number }
  | { t: 'pong' };

export const BOT_NAMES = ['Máy · Lê Phụ Trần', 'Máy · Đỗ Khắc Chung', 'Máy · Yết Kiêu', 'Máy · Dã Tượng', 'Máy · Phạm Ngũ Lão', 'Máy · Nguyễn Khoái'];

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, 24) || 'Người chơi';
}

export function freeHeroes(seats: Seat[]): HeroId[] {
  const used = new Set(seats.map((s) => s.heroId).filter(Boolean));
  return HERO_IDS.filter((h) => !used.has(h));
}

export function addBotSeat(seats: Seat[], id: string): Seat | null {
  if (seats.length >= MAX_PLAYERS) return null;
  const free = freeHeroes(seats);
  if (free.length === 0) return null;
  const botCount = seats.filter((s) => s.isBot).length;
  const seat: Seat = {
    id,
    name: BOT_NAMES[botCount % BOT_NAMES.length],
    heroId: free[Math.floor(Math.random() * free.length)],
    isBot: true,
    connected: true,
  };
  seats.push(seat);
  return seat;
}

export function canStart(seats: Seat[]): string | null {
  if (seats.length < MIN_PLAYERS) return `Cần ít nhất ${MIN_PLAYERS} người (thêm máy chơi cùng để đủ).`;
  if (seats.length > MAX_PLAYERS) return `Tối đa ${MAX_PLAYERS} người.`;
  if (seats.some((s) => !s.heroId)) return 'Mọi người cần chọn anh hùng.';
  if (!seats.some((s) => !s.isBot)) return 'Cần ít nhất 1 người thật.';
  return null;
}

export function cleanSettings(cur: RoomSettings, patch: Partial<RoomSettings>): RoomSettings {
  const next = { ...cur };
  if (patch.battleCount !== undefined && BATTLE_COUNT_OPTIONS.includes(Number(patch.battleCount))) next.battleCount = Number(patch.battleCount);
  return next;
}

export function startFromSeats(seats: Seat[], settings: RoomSettings = DEFAULT_SETTINGS, seed = randomSeed(), battleOrder?: BattleId[]): GameState {
  return createGame({
    seed,
    battleCount: settings.battleCount,
    battleOrder,
    players: seats.map((s) => ({ id: s.id, name: s.name, heroId: s.heroId!, isBot: s.isBot })),
  });
}
