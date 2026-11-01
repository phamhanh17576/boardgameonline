import { BATTLES, BATTLE_IDS, GENERALS, STRATS, TITLES, TITLE_IDS } from './content/cards';
import { HEROES } from './content/heroes';
import { allCells, inBoard, neighbors, parseKey, regions } from './hex';
import { nextRandom, shuffle } from './rng';
import {
  RES_KEYS,
  TERRAINS,
  type Action,
  type BattleDef,
  type BattleId,
  type BattleResult,
  type CombatResult,
  type CombatState,
  type FinalScore,
  type GameEvent,
  type GameOptions,
  type GameState,
  type PlayerState,
  type Res,
  type Resources,
  type StratId,
  type Terrain,
  type TitleId,
} from './types';

export const MAX_RES = 10;
export const MAX_TROOPS = 15;
export const MAX_DIEU_QUAN = 4;
export const MAX_MO_BINH = 3;
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 6;
export const ROW_SIZE = 6;
export const DEFAULT_BATTLES = 4;
export const BATTLE_COUNT_OPTIONS = [2, 3, 4, 6, 8];
/** Sức địch mỗi người chơi = BASE + GROWTH × (thứ tự trận) + độ khó riêng của trận */
export const ENEMY_BASE = 7.7;
export const ENEMY_GROWTH = 0.42;
export const DIFFICULTY_SCALE = 0.4;
export const ENEMY_OFFSET = -8;

export type ApplyResult = { ok: true; state: GameState } | { ok: false; error: string };

// ------------------------------------------------------------------ tiện ích
export const emptyRes = (): Resources => ({ lua: 0, go: 0, sat: 0, tien: 0 });
export const resTotal = (r: Partial<Resources>) => RES_KEYS.reduce((s, k) => s + (r[k] ?? 0), 0);
const clone = <T>(x: T): T => structuredClone(x);

export function getPlayer(s: GameState, pid: string): PlayerState {
  const p = s.players.find((x) => x.id === pid);
  if (!p) throw new GameError('Không tìm thấy người chơi.');
  return p;
}

class GameError extends Error {}
function fail(msg: string): never {
  throw new GameError(msg);
}

function emit(s: GameState, ev: Omit<GameEvent, 'seq'>) {
  s.eventSeq += 1;
  s.events.push({ ...ev, seq: s.eventSeq });
  if (s.events.length > 60) s.events.splice(0, s.events.length - 60);
}

function addStar(p: PlayerState, amount: number, reason: string) {
  if (amount === 0) return;
  p.star += amount;
  p.starLog.push({ amount, reason });
}

function addLongDan(p: PlayerState, amount: number) {
  p.longDan = Math.max(0, Math.min(10, p.longDan + amount));
}

export const battleDef = (s: GameState): BattleDef => BATTLES[s.battle.id];

export function currentPlayerId(s: GameState): string {
  const n = s.order.length;
  const offset = s.battleIndex % n;
  return s.order[(offset + s.turnIndex) % n];
}

export function resCap(p: PlayerState): number {
  return p.heroId === 'tranKhanhDu' ? 14 : MAX_RES;
}

export function stratHandLimit(p: PlayerState): number {
  return p.heroId === 'tranQuocToan' ? 1 : HEROES[p.heroId].muu;
}

export function bonusCount(p: PlayerState, r: Res): number {
  return p.generals.filter((g) => GENERALS[g].bonus === r).length;
}

export function generalCost(p: PlayerState, generalId: string): Resources {
  const def = GENERALS[generalId];
  const out = emptyRes();
  for (const r of RES_KEYS) out[r] = Math.max(0, (def.cost[r] ?? 0) - bonusCount(p, r));
  return out;
}

export function canAfford(p: PlayerState, cost: Partial<Resources>): boolean {
  return RES_KEYS.every((r) => p.res[r] >= (cost[r] ?? 0));
}

export function thanhLuyCount(p: PlayerState): number {
  return regions(p.territory).filter((r) => r.terrain === 'nui' && r.cells.length >= 3).length;
}

export function thuyTraiCount(p: PlayerState): number {
  return regions(p.territory).filter((r) => r.terrain === 'song' && r.cells.length >= 3).length;
}

export function villageCount(p: PlayerState): number {
  return Object.values(p.territory).filter((t) => t === 'lang').length;
}

/** Võ của anh hùng + tướng phụ (dùng cho cả trận và giao chiến). */
export function generalsVo(p: PlayerState, river: boolean): number {
  let v = 0;
  for (const g of p.generals) {
    const d = GENERALS[g];
    v += d.vo;
    if (p.heroId === 'tranHungDao') v += 1;
    if (river && d.ability === 'riverVo') v += 1;
  }
  return v;
}

export function generalsThu(p: PlayerState): number {
  return p.generals.reduce((s, g) => s + GENERALS[g].thu, 0);
}

export function playerBattleVo(p: PlayerState, river: boolean): number {
  return HEROES[p.heroId].vo + generalsVo(p, river) + (river ? thuyTraiCount(p) : 0);
}

export function tacticRequirement(s: GameState): Resources {
  const def = battleDef(s);
  const mult = Math.ceil(s.players.length / 2);
  const out = emptyRes();
  for (const r of RES_KEYS) out[r] = (def.tacticBase[r] ?? 0) * mult;
  return out;
}

export function tacticCommitted(s: GameState): Resources {
  const out = emptyRes();
  for (const pid of Object.keys(s.battle.tactic)) {
    for (const r of RES_KEYS) out[r] += s.battle.tactic[pid][r];
  }
  return out;
}

export function tacticRemaining(s: GameState): Resources {
  const req = tacticRequirement(s);
  const got = tacticCommitted(s);
  const out = emptyRes();
  for (const r of RES_KEYS) out[r] = Math.max(0, req[r] - got[r]);
  return out;
}

export function isTacticComplete(s: GameState): boolean {
  return resTotal(tacticRemaining(s)) === 0;
}

/** Sức địch hiện tại (đã tính chiến thuật, hiệu ứng). */
export function enemyStrength(s: GameState): { base: number; final: number; tacticComplete: boolean } {
  const def = battleDef(s);
  const perPlayer = ENEMY_BASE + ENEMY_GROWTH * s.battleIndex + def.difficulty * DIFFICULTY_SCALE;
  let base = Math.round(perPlayer * s.players.length + ENEMY_OFFSET + s.battle.enemyMod);
  for (const p of s.players) {
    if ((s.battle.troops[p.id] ?? 0) <= 0) continue;
    for (const g of p.generals) if (GENERALS[g].ability === 'enemyMinus1') base -= 1;
  }
  base = Math.max(1, base);
  const tacticComplete = isTacticComplete(s);
  const final = tacticComplete ? Math.max(1, Math.ceil(base * 0.7)) : base;
  return { base, final, tacticComplete };
}

export function battlePower(s: GameState): number {
  const river = battleDef(s).river;
  let power = 0;
  for (const p of s.players) {
    const t = s.battle.troops[p.id] ?? 0;
    power += t;
    if (t > 0) power += playerBattleVo(p, river);
  }
  return power;
}

/** Thu nhập khi Thu thuế. */
export function computeIncome(p: PlayerState): Resources {
  const out = emptyRes();
  for (const reg of regions(p.territory)) {
    const size = Math.min(3, reg.cells.length);
    if (reg.terrain === 'ruong') {
      out.lua += size;
      const nearRiver = reg.cells.some((c) => neighbors(c).some((n) => p.territory[n] === 'song'));
      if (nearRiver) out.lua += 1;
    } else if (reg.terrain === 'rung') out.go += size;
    else if (reg.terrain === 'nui') out.sat += size;
    else if (reg.terrain === 'lang') {
      for (const c of reg.cells) {
        const kinds = new Set(neighbors(c).map((n) => p.territory[n]).filter((t) => t && t !== 'lang'));
        if (kinds.size >= 2) out.tien += 1;
      }
    }
  }
  for (const g of p.generals) if (GENERALS[g].ability === 'incomeTien') out.tien += 1;
  return out;
}

export function moBinhMax(_p: PlayerState): number {
  return MAX_MO_BINH;
}

export function moBinhBonus(p: PlayerState): number {
  let b = 0;
  if (p.heroId === 'tranQuocToan') b += 1;
  if (p.heroId === 'haiBaTrung') b += Math.min(3, villageCount(p));
  for (const g of p.generals) if (GENERALS[g].ability === 'moBinhPlus') b += 1;
  return b;
}

export function troopTotal(s: GameState, p: PlayerState): number {
  return p.reserve + (s.battle.troops[p.id] ?? 0);
}

function leaderStar(s: GameState): number {
  return Math.max(...s.players.map((p) => p.star));
}

function drawStrat(s: GameState): StratId | null {
  if (s.stratDeck.length === 0) {
    if (s.stratDiscard.length === 0) return null;
    s.stratDeck = shuffle(s, s.stratDiscard);
    s.stratDiscard = [];
  }
  return s.stratDeck.pop() ?? null;
}

function refillLandRow(s: GameState) {
  while (s.landRow.length < ROW_SIZE && s.landDeck.length > 0) s.landRow.push(s.landDeck.pop()!);
}

function refillMarket(s: GameState, tier: 1 | 2 | 3) {
  while (s.market[tier].length < 4 && s.generalDecks[tier].length > 0) s.market[tier].push(s.generalDecks[tier].pop()!);
}

function stealResources(from: PlayerState, to: PlayerState, count: number): Partial<Resources> {
  const stolen: Partial<Resources> = {};
  for (let i = 0; i < count; i++) {
    const best = RES_KEYS.filter((r) => from.res[r] > 0).sort((a, b) => from.res[b] - from.res[a])[0];
    if (!best) break;
    from.res[best] -= 1;
    to.res[best] += 1;
    stolen[best] = (stolen[best] ?? 0) + 1;
  }
  return stolen;
}

function trimToCap(p: PlayerState) {
  const cap = resCap(p);
  while (resTotal(p.res) > cap) {
    const best = RES_KEYS.slice().sort((a, b) => p.res[b] - p.res[a])[0];
    p.res[best] -= 1;
  }
}

// ------------------------------------------------------------------ khởi tạo
export function createGame(opts: GameOptions): GameState {
  const n = opts.players.length;
  if (n < MIN_PLAYERS || n > MAX_PLAYERS) throw new Error(`Cần ${MIN_PLAYERS}–${MAX_PLAYERS} người chơi.`);
  const heroes = new Set(opts.players.map((p) => p.heroId));
  if (heroes.size !== n) throw new Error('Mỗi người phải chọn một anh hùng khác nhau.');

  const s: GameState = {
    version: 1,
    seed: opts.seed,
    rngState: opts.seed >>> 0 || 1,
    phase: 'battleIntro',
    players: [],
    order: [],
    battleOrder: [],
    battleIndex: 0,
    round: 1,
    roundsPerBattle: opts.roundsPerBattle ?? 3,
    turnIndex: 0,
    turn: { playerId: '', actionTaken: false, stratPlayed: false, extraDieuQuan: 0, extraAttack: 0, number: 0 },
    turnCounter: 0,
    battle: { id: 'vanDon1288', troops: {}, tactic: {}, enemyMod: 0, khaiHoan: [], binhNgo: [] },
    wonBattles: [],
    landDeck: [],
    landRow: [],
    generalDecks: { 1: [], 2: [], 3: [] },
    market: { 1: [], 2: [], 3: [] },
    stratDeck: [],
    stratDiscard: [],
    combat: null,
    lastCombat: null,
    pendingChoice: null,
    ready: [],
    lastResult: null,
    titles: [],
    events: [],
    eventSeq: 0,
    final: null,
  };

  // Đất
  const land: Terrain[] = [];
  for (const t of TERRAINS) for (let i = 0; i < 20; i++) land.push(t);
  s.landDeck = shuffle(s, land);
  refillLandRow(s);

  // Tướng phụ
  for (const tier of [1, 2, 3] as const) {
    const list: string[] = [];
    for (const g of Object.values(GENERALS)) if (g.tier === tier) for (let i = 0; i < g.copies; i++) list.push(g.id);
    s.generalDecks[tier] = shuffle(s, list);
    refillMarket(s, tier);
  }

  // Kế sách
  const strats: StratId[] = [];
  for (const st of Object.values(STRATS)) for (let i = 0; i < st.copies; i++) strats.push(st.id);
  s.stratDeck = shuffle(s, strats);

  s.titles = shuffle(s, TITLE_IDS).slice(0, 3);

  // Rút ngẫu nhiên các trận rồi xếp theo thứ tự thời gian
  if (opts.battleOrder && opts.battleOrder.length > 0) s.battleOrder = opts.battleOrder.slice();
  else {
    const count = Math.max(1, Math.min(BATTLE_IDS.length, Math.round(opts.battleCount ?? DEFAULT_BATTLES)));
    s.battleOrder = shuffle(s, BATTLE_IDS)
      .slice(0, count)
      .sort((a, b) => BATTLES[a].sortYear - BATTLES[b].sortYear);
  }

  opts.players.forEach((ps, seat) => {
    const hero = HEROES[ps.heroId];
    const res = emptyRes();
    res.lua = 2;
    res.tien = 1;
    for (const r of RES_KEYS) res[r] += hero.start?.res?.[r] ?? 0;
    const p: PlayerState = {
      id: ps.id,
      name: ps.name,
      heroId: ps.heroId,
      isBot: ps.isBot,
      seat,
      res,
      reserve: 2 + (hero.start?.troops ?? 0),
      territory: { '0,0': 'ruong', '1,0': 'rung', '0,1': 'nui' },
      generals: [],
      reserved: [],
      strats: [],
      longDan: 5,
      star: 0,
      starLog: [],
      chienCong: 0,
      revengeVs: [],
      prevTurnTargets: [],
      curTurnTargets: [],
      ultUsedBattle: false,
      villageDone: [],
      stats: { firstPlaces: 0, tacticBattles: 0, battlesWithTroops: 0, attacksWon: 0 },
    };
    const st = drawStrat(s);
    if (st) p.strats.push(st);
    s.players.push(p);
    s.order.push(p.id);
  });

  startBattle(s, 0);
  return s;
}

function startBattle(s: GameState, idx: number) {
  s.battleIndex = idx;
  const id = s.battleOrder[idx];
  let enemyMod = 0;
  for (const prev of s.wonBattles) {
    const ch = BATTLES[prev].chain;
    if (ch && ch.battle === id) enemyMod -= ch.minusPerPlayer * s.players.length;
  }
  s.battle = { id, troops: {}, tactic: {}, enemyMod, khaiHoan: [], binhNgo: [] };
  for (const p of s.players) {
    s.battle.troops[p.id] = 0;
    s.battle.tactic[p.id] = emptyRes();
    p.ultUsedBattle = false;
    if (p.heroId === 'tranThuDo') addLongDan(p, -1);
    // Triều đình cấp quân lương đầu mỗi trận (từ trận thứ 2)
    if (idx > 0) {
      if (troopTotal(s, p) < MAX_TROOPS && p.heroId !== 'baTrieu') p.reserve += 1;
      if (p.heroId === 'tranQuocToan' && troopTotal(s, p) < MAX_TROOPS) p.reserve += 1;
      p.res.lua += 1;
    }
  }
  s.round = 1;
  s.turnIndex = 0;
  s.combat = null;
  s.pendingChoice = null;
  s.phase = 'battleIntro';
  s.ready = s.players.filter((p) => p.isBot).map((p) => p.id);
  emit(s, { type: 'battleStart', text: `${BATTLES[id].name} — ${BATTLES[id].year}`, data: { battleId: id, chain: enemyMod !== 0 } });
  advanceIfReady(s);
}

/** Khi mọi người đã xác nhận (bot luôn sẵn sàng) thì sang bước tiếp. */
function advanceIfReady(s: GameState) {
  if (s.phase !== 'battleIntro' && s.phase !== 'battleResult') return;
  if (!s.players.every((x) => s.ready.includes(x.id))) return;
  if (s.phase === 'battleIntro') beginTurn(s);
  else if (s.battleIndex + 1 < s.battleOrder.length) startBattle(s, s.battleIndex + 1);
  else finishGame(s);
}

function beginTurn(s: GameState) {
  const pid = currentPlayerId(s);
  s.turnCounter += 1;
  s.turn = { playerId: pid, actionTaken: false, stratPlayed: false, extraDieuQuan: 0, extraAttack: 0, number: s.turnCounter };
  s.phase = 'action';
  emit(s, { type: 'turnStart', playerId: pid, text: `Lượt của ${getPlayer(s, pid).name} (vòng ${s.round}/${s.roundsPerBattle})` });
}

function endTurn(s: GameState) {
  const p = getPlayer(s, s.turn.playerId);
  trimToCap(p);
  p.prevTurnTargets = p.curTurnTargets;
  p.curTurnTargets = [];
  s.turnIndex += 1;
  if (s.turnIndex >= s.order.length) {
    s.turnIndex = 0;
    s.round += 1;
    if (s.round > s.roundsPerBattle) {
      resolveBattle(s);
      return;
    }
  }
  beginTurn(s);
}

// ------------------------------------------------------------------ giải quyết trận
function resolveBattle(s: GameState) {
  const def = battleDef(s);
  const { final: enemy, tacticComplete } = enemyStrength(s);
  const power = battlePower(s);
  const won = power >= enemy;
  const chainApplied = s.battle.enemyMod < 0;

  const contributions = s.players.map((p) => {
    const troops = s.battle.troops[p.id] ?? 0;
    const tactic = resTotal(s.battle.tactic[p.id] ?? emptyRes());
    return { playerId: p.id, troops, tactic, total: troops + tactic, stars: 0, reasons: [] as string[] };
  });
  const rightHeroPlayers: string[] = [];
  const give = (pid: string, amount: number, reason: string) => {
    const c = contributions.find((x) => x.playerId === pid)!;
    c.stars += amount;
    c.reasons.push(`${amount > 0 ? '+' : ''}${amount}★ ${reason}`);
    addStar(getPlayer(s, pid), amount, `${def.name}: ${reason}`);
  };

  if (won) {
    const ranked = contributions.filter((c) => c.total > 0).sort((a, b) => b.total - a.total || b.tactic - a.tactic);
    const rewardAt = (i: number) => (i === 0 ? def.rewardFirst : i === 1 ? def.rewardSecond : 1);
    let i = 0;
    while (i < ranked.length) {
      let j = i;
      while (j + 1 < ranked.length && ranked[j + 1].total === ranked[i].total && ranked[j + 1].tactic === ranked[i].tactic) j++;
      let sum = 0;
      for (let k = i; k <= j; k++) sum += rewardAt(k);
      const each = Math.floor(sum / (j - i + 1));
      for (let k = i; k <= j; k++) {
        const label = i === 0 ? 'đóng góp hạng 1' : i === 1 ? 'đóng góp hạng 2' : 'có đóng góp';
        give(ranked[k].playerId, each, label);
        if (i === 0) getPlayer(s, ranked[k].playerId).stats.firstPlaces += 1;
      }
      i = j + 1;
    }
    for (const c of contributions) {
      const p = getPlayer(s, c.playerId);
      if (c.tactic > 0) {
        give(c.playerId, 1, 'hiểu binh pháp');
        p.stats.tacticBattles += 1;
      }
      if (c.troops > 0 && def.rightHeroes.includes(p.heroId)) {
        give(c.playerId, 2, 'đúng người đúng trận');
        rightHeroPlayers.push(p.id);
      }
    }
    for (const pid of s.battle.khaiHoan) {
      give(pid, 2, 'Tụng giá hoàn kinh sư');
      addLongDan(getPlayer(s, pid), 2);
      for (const c of contributions) if (c.playerId !== pid && c.troops > 0) addLongDan(getPlayer(s, c.playerId), 1);
    }
    s.wonBattles.push(def.id);
    for (const pid of s.battle.binhNgo) {
      give(pid, 2, 'Bình Ngô đại cáo');
      addLongDan(getPlayer(s, pid), 1);
    }
  } else {
    const minTotal = Math.min(...contributions.map((c) => c.total));
    for (const c of contributions) {
      const p = getPlayer(s, c.playerId);
      const immune = p.heroId === 'tranThuDo';
      if (!immune) addLongDan(p, -1);
      if (p.heroId === 'tranHungDao') {
        give(p.id, -3, 'gánh vác an nguy (trận thua)');
        continue;
      }
      const shield = immune || p.generals.some((g) => GENERALS[g].ability === 'noLossPenalty');
      if (c.total === minTotal && !shield) give(p.id, -2, 'giặc đến nhà mà không ra sức');
    }
  }

  for (const c of contributions) {
    const p = getPlayer(s, c.playerId);
    if (p.heroId === 'tranQuangKhai' && c.troops === 0) give(p.id, -1, 'Thượng tướng vắng mặt');
    if (c.troops > 0) p.stats.battlesWithTroops += 1;
    const lost = Math.ceil(c.troops / 3);
    p.reserve += c.troops - lost;
  }

  const result: BattleResult = { battleId: def.id, won, power, enemy, tacticComplete, contributions, rightHeroPlayers, chainApplied };
  s.lastResult = result;
  s.phase = 'battleResult';
  s.ready = s.players.filter((p) => p.isBot).map((p) => p.id);
  emit(s, { type: 'battleResolved', text: `${def.name}: ${won ? 'THẮNG' : 'THUA'} (${power} / ${enemy})`, data: { won, power, enemy } });
  advanceIfReady(s);
}

// ------------------------------------------------------------------ kết thúc
export function regions5(p: PlayerState): number {
  return regions(p.territory).filter((r) => r.cells.length >= 5).length;
}

function titleMetric(s: GameState, p: PlayerState, t: TitleId): number {
  switch (t) {
    case 'vanThang':
      return p.chienCong;
    case 'nhanChu':
      return p.longDan;
    case 'hienTai':
      return p.generals.length;
    case 'truCot':
      return p.stats.firstPlaces;
    case 'binhPhap':
      return p.stats.tacticBattles;
    case 'thuyQuan':
      return regions(p.territory).filter((r) => r.terrain === 'song').reduce((m, r) => Math.max(m, r.cells.length), 0);
    case 'nuiSong':
      return thanhLuyCount(p);
    case 'khoLam':
      return regions(p.territory).filter((r) => r.terrain === 'ruong').reduce((m, r) => Math.max(m, r.cells.length), 0);
  }
}

export function longDanBonus(v: number): number {
  if (v >= 8) return 4;
  if (v >= 5) return 1;
  if (v <= 2) return -3;
  return 0;
}

export function computeFinal(s: GameState): FinalScore[] {
  const scores: FinalScore[] = s.players.map((p) => ({
    playerId: p.id,
    base: p.star,
    regions5: regions5(p) * 2,
    longDan: longDanBonus(p.longDan),
    titles: [],
    total: 0,
    rank: 0,
  }));
  for (const t of s.titles) {
    const metrics = s.players.map((p) => titleMetric(s, p, t));
    const best = Math.max(...metrics);
    if (best <= 0) continue;
    const winners = s.players.filter((_, i) => metrics[i] === best);
    const star = winners.length === 1 ? TITLES[t].star : TITLES[t].star - 1;
    if (star <= 0) continue;
    for (const w of winners) scores.find((x) => x.playerId === w.id)!.titles.push({ id: t, star });
  }
  for (const sc of scores) sc.total = sc.base + sc.regions5 + sc.longDan + sc.titles.reduce((a, b) => a + b.star, 0);
  const sorted = scores.slice().sort((a, b) => b.total - a.total || getPlayer(s, b.playerId).longDan - getPlayer(s, a.playerId).longDan);
  sorted.forEach((sc, i) => {
    const prev = sorted[i - 1];
    sc.rank = prev && prev.total === sc.total && getPlayer(s, prev.playerId).longDan === getPlayer(s, sc.playerId).longDan ? prev.rank : i + 1;
  });
  return scores;
}

function finishGame(s: GameState) {
  s.final = computeFinal(s);
  s.phase = 'gameOver';
  const winner = s.final.find((f) => f.rank === 1)!;
  emit(s, { type: 'gameOver', playerId: winner.playerId, text: `${getPlayer(s, winner.playerId).name} trở thành người có Uy danh cao nhất!` });
}

// ------------------------------------------------------------------ giao chiến
export function combatBases(s: GameState, c: CombatState): { atkBase: number; defBase: number; usesMuu: boolean } {
  const atk = getPlayer(s, c.attackerId);
  const def = getPlayer(s, c.defenderId);
  const river = battleDef(s).river;
  const hero = HEROES[atk.heroId];
  const usesMuu = atk.heroId === 'nguyenTrai';
  let atkBase = (usesMuu ? hero.muu : hero.vo) + generalsVo(atk, river);
  if (c.mode === 'tranhCong' && river) atkBase += thuyTraiCount(atk);
  if (atk.heroId === 'baTrieu' && c.mode === 'tranhCong') atkBase += 2;
  if (atk.revengeVs.includes(def.id)) atkBase += 2;
  let defBase = HEROES[def.heroId].thu + generalsThu(def) + 2 * thanhLuyCount(def);
  if (c.mode === 'dotKich') for (const g of def.generals) if (GENERALS[g].ability === 'dotKichThu') defBase += 2;
  return { atkBase, defBase, usesMuu };
}

function resolveCombat(s: GameState) {
  const c = s.combat!;
  const atk = getPlayer(s, c.attackerId);
  const def = getPlayer(s, c.defenderId);
  const { atkBase, defBase, usesMuu } = combatBases(s, c);
  const atkBid = c.bids[atk.id] ?? 0;
  const defBid = c.bids[def.id] ?? 0;
  const atkStrat = c.strats[atk.id];
  const defStrat = c.strats[def.id];
  const atkTotal = atkBase + atkBid + (atkStrat === 'coHieu' ? 2 : 0);
  const defTotal = defBase + defBid + (defStrat === 'tiepVien' ? 3 : 0);

  if (usesMuu) atk.res.tien -= atkBid;
  else atk.res.sat -= atkBid;
  def.res.sat -= defBid;
  for (const [pid, st] of [
    [atk.id, atkStrat],
    [def.id, defStrat],
  ] as const) {
    if (!st) continue;
    const p = getPlayer(s, pid);
    const i = p.strats.indexOf(st);
    if (i >= 0) p.strats.splice(i, 1);
    s.stratDiscard.push(st);
  }
  if (atk.revengeVs.includes(def.id)) atk.revengeVs = atk.revengeVs.filter((x) => x !== def.id);

  const attackerWon = atkTotal > defTotal;
  let troopsRemoved = 0;
  let stolen: Partial<Resources> = {};
  if (attackerWon) {
    if (c.mode === 'tranhCong') {
      let n = 2 + (def.heroId === 'haiBaTrung' ? 1 : 0);
      if (defStrat === 'vuonKhong') n = 1;
      troopsRemoved = Math.min(n, s.battle.troops[def.id] ?? 0);
      s.battle.troops[def.id] -= troopsRemoved;
      if (usesMuu && troopsRemoved > 0) s.battle.troops[atk.id] += 1;
      atk.chienCong += 1;
      addStar(atk, 1, 'Chiến công (Tranh công)');
      if (atk.heroId === 'tranQuangKhai') {
        atk.chienCong += 1;
        addStar(atk, 1, 'Chương Dương cướp giáo');
      }
      if (atk.heroId === 'baTrieu') {
        atk.chienCong += 1;
        addStar(atk, 1, 'Cưỡi đầu voi ra trận');
      }
    } else {
      if (defStrat !== 'vuonKhong') stolen = stealResources(def, atk, 3);
      const isLeader = def.star === leaderStar(s);
      if (!usesMuu && !isLeader) addLongDan(atk, -1);
      atk.chienCong += 1;
      addStar(atk, 1, 'Chiến công (Đột kích)');
    }
    atk.stats.attacksWon += 1;
    addLongDan(def, 1);
    if (!def.revengeVs.includes(atk.id)) def.revengeVs.push(atk.id);
  } else {
    def.chienCong += 1;
    addStar(def, 1, 'Chiến công (giữ vững)');
  }

  const result: CombatResult = {
    attackerId: atk.id,
    defenderId: def.id,
    mode: c.mode,
    atk: atkTotal,
    def: defTotal,
    atkBid,
    defBid,
    atkStrat,
    defStrat,
    attackerWon,
    troopsRemoved,
    stolen,
    usesMuu,
  };
  s.lastCombat = result;
  s.combat = null;
  s.phase = 'action';
  emit(s, {
    type: 'combatResolved',
    playerId: atk.id,
    targetId: def.id,
    text: `${atk.name} ${c.mode === 'tranhCong' ? 'Tranh công' : 'Đột kích'} ${def.name}: ${attackerWon ? 'thắng' : 'thua'} (${atkTotal} – ${defTotal})`,
    data: { ...result },
  });
}

// ------------------------------------------------------------------ áp dụng hành động
function requireTurn(s: GameState, pid: string) {
  if (s.phase !== 'action') fail('Chưa đến lúc hành động.');
  if (s.turn.playerId !== pid) fail('Chưa đến lượt của bạn.');
}

function useMainAction(s: GameState) {
  if (s.turn.actionTaken) fail('Bạn đã làm hành động chính trong lượt này.');
  s.turn.actionTaken = true;
}

function apply(s: GameState, a: Action) {
  const p = getPlayer(s, a.pid);
  switch (a.type) {
    case 'ready': {
      if (s.phase !== 'battleIntro' && s.phase !== 'battleResult') fail('Không cần xác nhận lúc này.');
      if (!s.ready.includes(p.id)) s.ready.push(p.id);
      advanceIfReady(s);
      return;
    }
    case 'khaiHoang': {
      requireTurn(s, p.id);
      const { start, cells } = a;
      if (!Number.isInteger(start) || start < 0 || start + 1 >= s.landRow.length) fail('Chọn 2 ô liền nhau trong Chợ đất.');
      const [c0, c1] = cells;
      if (c0 === c1) fail('Hai ô phải khác nhau.');
      for (const c of cells) {
        const [q, r] = parseKey(c);
        if (!inBoard(q, r)) fail('Ô nằm ngoài lãnh địa.');
        if (p.territory[c]) fail('Ô đã có địa hình.');
      }
      const has = (k: string) => !!p.territory[k];
      if (!neighbors(c0).some(has)) fail('Ô thứ nhất phải kề lãnh địa.');
      if (!neighbors(c1).some((k) => has(k) || k === c0)) fail('Ô thứ hai phải kề lãnh địa.');
      if (start === 0 && p.res.tien < 1) fail('Lấy ô đầu hàng cần 1 Tiền.');
      useMainAction(s);
      if (start === 0) p.res.tien -= 1;
      const t0 = s.landRow[start];
      const t1 = s.landRow[start + 1];
      p.territory[c0] = t0;
      p.territory[c1] = t1;
      s.landRow.splice(start, 2);
      refillLandRow(s);
      for (const k of allCells()) {
        if (p.territory[k] !== 'lang' || p.villageDone.includes(k)) continue;
        const nb = neighbors(k);
        if (nb.length === 6 && nb.every(has)) {
          p.villageDone.push(k);
          addLongDan(p, 1);
        }
      }
      emit(s, { type: 'tilePlaced', playerId: p.id, text: `${p.name} khai hoang`, data: { cells: [c0, c1], terrains: [t0, t1] } });
      return;
    }
    case 'thuThue': {
      requireTurn(s, p.id);
      useMainAction(s);
      const inc = computeIncome(p);
      for (const r of RES_KEYS) p.res[r] += inc[r];
      if (p.heroId === 'tranKhanhDu' && resTotal(p.res) >= 11) addLongDan(p, -1);
      emit(s, { type: 'income', playerId: p.id, text: `${p.name} thu thuế`, data: { gain: inc } });
      return;
    }
    case 'chieuHien': {
      requireTurn(s, p.id);
      const g = GENERALS[a.generalId];
      if (!g) fail('Không có tướng này.');
      const fromReserved = p.reserved.includes(a.generalId);
      const tier = g.tier;
      if (!fromReserved && !s.market[tier].includes(a.generalId)) fail('Tướng không có ở Chợ tướng.');
      const cost = generalCost(p, a.generalId);
      if (!canAfford(p, cost)) fail('Không đủ tài nguyên.');
      useMainAction(s);
      for (const r of RES_KEYS) p.res[r] -= cost[r];
      if (fromReserved) p.reserved.splice(p.reserved.indexOf(a.generalId), 1);
      else {
        s.market[tier].splice(s.market[tier].indexOf(a.generalId), 1);
        refillMarket(s, tier);
      }
      p.generals.push(a.generalId);
      addStar(p, g.star, `Chiêu mộ ${g.name}`);
      emit(s, { type: 'generalBought', playerId: p.id, text: `${p.name} chiêu mộ ${g.name}`, data: { generalId: g.id } });
      return;
    }
    case 'giuCho': {
      requireTurn(s, p.id);
      const g = GENERALS[a.generalId];
      if (!g || !s.market[g.tier].includes(a.generalId)) fail('Tướng không có ở Chợ tướng.');
      if (p.reserved.length >= 2) fail('Chỉ giữ chỗ tối đa 2 tướng.');
      if (p.res.tien < 1) fail('Giữ chỗ cần 1 Tiền.');
      useMainAction(s);
      p.res.tien -= 1;
      s.market[g.tier].splice(s.market[g.tier].indexOf(a.generalId), 1);
      refillMarket(s, g.tier);
      p.reserved.push(a.generalId);
      emit(s, { type: 'generalReserved', playerId: p.id, text: `${p.name} giữ chỗ ${g.name}`, data: { generalId: g.id } });
      return;
    }
    case 'moBinh': {
      requireTurn(s, p.id);
      const max = moBinhMax(p);
      if (!Number.isInteger(a.count) || a.count < 1 || a.count > max) fail(`Mộ từ 1 đến ${max} Quân.`);
      if (p.res.lua < a.count) fail('Không đủ Lúa.');
      const room = MAX_TROOPS - troopTotal(s, p);
      if (room <= 0) fail(`Đã đủ ${MAX_TROOPS} Quân.`);
      useMainAction(s);
      p.res.lua -= a.count;
      const gain = Math.min(room, a.count + moBinhBonus(p));
      p.reserve += gain;
      emit(s, { type: 'troopsRecruited', playerId: p.id, text: `${p.name} mộ ${gain} Quân`, data: { count: gain } });
      return;
    }
    case 'dieuQuan': {
      requireTurn(s, p.id);
      const troops = a.troops ?? 0;
      if (!Number.isInteger(troops) || troops < 0 || troops > MAX_DIEU_QUAN) fail(`Mỗi lần điều tối đa ${MAX_DIEU_QUAN} Quân.`);
      if (troops > p.reserve) fail('Không đủ Quân trong tay.');
      const remaining = tacticRemaining(s);
      const tac = emptyRes();
      for (const r of RES_KEYS) {
        const v = a.tactic?.[r] ?? 0;
        if (!Number.isInteger(v) || v < 0) fail('Số tài nguyên không hợp lệ.');
        if (v > p.res[r]) fail('Không đủ tài nguyên để góp Chiến thuật.');
        if (v > remaining[r]) fail('Chiến thuật không cần thêm loại tài nguyên này.');
        tac[r] = v;
      }
      if (troops === 0 && resTotal(tac) === 0) fail('Hãy điều Quân hoặc góp tài nguyên Chiến thuật.');
      if (s.turn.actionTaken) {
        if (s.turn.extraDieuQuan <= 0) fail('Bạn đã làm hành động chính trong lượt này.');
        s.turn.extraDieuQuan -= 1;
      } else s.turn.actionTaken = true;
      p.reserve -= troops;
      s.battle.troops[p.id] += troops;
      for (const r of RES_KEYS) {
        p.res[r] -= tac[r];
        s.battle.tactic[p.id][r] += tac[r];
      }
      if (troops > 0) emit(s, { type: 'troopsMoved', playerId: p.id, text: `${p.name} điều ${troops} Quân ra trận`, data: { count: troops } });
      if (resTotal(tac) > 0) emit(s, { type: 'tacticCommitted', playerId: p.id, text: `${p.name} góp Chiến thuật`, data: { tactic: tac } });
      return;
    }
    case 'tanCong': {
      requireTurn(s, p.id);
      const target = getPlayer(s, a.targetId);
      if (target.id === p.id) fail('Không thể tự tấn công mình.');
      if (p.prevTurnTargets.includes(target.id)) fail('Không được tấn công cùng một người 2 lượt liên tiếp.');
      if (p.res.lua < 1) fail('Xuất quân cần 1 Lúa.');
      if (a.mode === 'tranhCong') {
        if (p.heroId === 'tranHungDao') fail('Trần Hưng Đạo không dùng Tranh công.');
        if ((s.battle.troops[target.id] ?? 0) <= 0) fail('Đối thủ không có Quân ở chiến trường.');
      } else if (a.mode === 'dotKich') {
        if (p.longDan <= 0) fail('Lòng dân bằng 0, không thể Đột kích.');
      } else fail('Kiểu tấn công không hợp lệ.');
      if (s.turn.actionTaken) {
        if (s.turn.extraAttack <= 0) fail('Bạn đã làm hành động chính trong lượt này.');
        s.turn.extraAttack -= 1;
      } else s.turn.actionTaken = true;
      p.res.lua -= 1;
      p.curTurnTargets.push(target.id);
      s.combat = {
        attackerId: p.id,
        defenderId: target.id,
        mode: a.mode,
        bids: { [p.id]: null, [target.id]: null },
        strats: { [p.id]: null, [target.id]: null },
      };
      s.phase = 'combat';
      emit(s, { type: 'attackDeclared', playerId: p.id, targetId: target.id, text: `${p.name} ${a.mode === 'tranhCong' ? 'Tranh công' : 'Đột kích'} ${target.name}!`, data: { mode: a.mode } });
      return;
    }
    case 'datSat': {
      if (s.phase !== 'combat' || !s.combat) fail('Không có giao chiến.');
      const c = s.combat;
      if (p.id !== c.attackerId && p.id !== c.defenderId) fail('Bạn không tham gia giao chiến này.');
      if (c.bids[p.id] !== null) fail('Bạn đã chọn rồi.');
      const isAtk = p.id === c.attackerId;
      const muu = isAtk && p.heroId === 'nguyenTrai';
      const have = muu ? p.res.tien : p.res.sat;
      if (!Number.isInteger(a.amount) || a.amount < 0 || a.amount > have) fail(muu ? 'Không đủ Tiền.' : 'Không đủ Sắt.');
      if (a.strat) {
        if (!p.strats.includes(a.strat)) fail('Bạn không có Kế sách này.');
        const timing = STRATS[a.strat].timing;
        if (isAtk && timing !== 'attack') fail('Kế sách này không dùng để tấn công.');
        if (!isAtk && timing !== 'defense') fail('Kế sách này không dùng để phòng thủ.');
      }
      c.bids[p.id] = a.amount;
      c.strats[p.id] = a.strat ?? null;
      if (c.bids[c.attackerId] !== null && c.bids[c.defenderId] !== null) resolveCombat(s);
      return;
    }
    case 'muuKe': {
      requireTurn(s, p.id);
      if (p.strats.length >= stratHandLimit(p)) fail('Tay đã đủ Kế sách.');
      const options: StratId[] = [];
      for (let i = 0; i < 2; i++) {
        const st = drawStrat(s);
        if (st) options.push(st);
      }
      if (options.length === 0) fail('Hết Kế sách.');
      useMainAction(s);
      s.pendingChoice = { playerId: p.id, options };
      s.phase = 'choice';
      return;
    }
    case 'chonKeSach': {
      if (s.phase !== 'choice' || !s.pendingChoice || s.pendingChoice.playerId !== p.id) fail('Không có lựa chọn nào.');
      const opts = s.pendingChoice.options;
      const i = opts.indexOf(a.strat);
      if (i < 0) fail('Lựa chọn không hợp lệ.');
      p.strats.push(a.strat);
      opts.splice(i, 1);
      s.stratDiscard.push(...opts);
      s.pendingChoice = null;
      s.phase = 'action';
      emit(s, { type: 'info', playerId: p.id, text: `${p.name} bày mưu kế` });
      return;
    }
    case 'keSach': {
      requireTurn(s, p.id);
      if (s.turn.stratPlayed) fail('Mỗi lượt chỉ dùng 1 Kế sách.');
      if (!p.strats.includes(a.strat)) fail('Bạn không có Kế sách này.');
      if (STRATS[a.strat].timing !== 'instant') fail('Kế sách này chỉ dùng khi giao chiến.');
      s.turn.stratPlayed = true;
      p.strats.splice(p.strats.indexOf(a.strat), 1);
      s.stratDiscard.push(a.strat);
      if (a.strat === 'muaMang') p.res.lua += 3;
      else if (a.strat === 'renBinh') p.res.sat += 2;
      else if (a.strat === 'dienHong') {
        for (const q of s.players) s.battle.troops[q.id] += 1;
        addStar(p, 1, 'Hội nghị Diên Hồng');
      }
      emit(s, { type: 'stratPlayed', playerId: p.id, text: `${p.name} dùng "${STRATS[a.strat].name}"`, data: { strat: a.strat } });
      return;
    }
    case 'tuyetKy': {
      requireTurn(s, p.id);
      if (p.ultUsedBattle) fail('Tuyệt kỹ đã dùng trong trận này.');
      const hero = HEROES[p.heroId];
      let detail = '';
      switch (p.heroId) {
        case 'tranHungDao': {
          let k = 0;
          for (const q of s.players) {
            if ((s.battle.troops[q.id] ?? 0) > 0) {
              s.battle.troops[q.id] += 1;
              k++;
            }
          }
          if (k === 0) fail('Chưa ai có Quân ở chiến trường.');
          addStar(p, Math.min(3, k), 'Hịch tướng sĩ');
          detail = `${k} người được thêm Quân`;
          break;
        }
        case 'tranQuangKhai':
          s.battle.khaiHoan.push(p.id);
          break;
        case 'tranKhanhDu': {
          if (a.option === 'b') {
            const t = a.targetId ? getPlayer(s, a.targetId) : null;
            if (!t || t.id === p.id) fail('Chọn một người để cướp.');
            const st = stealResources(t, p, 3);
            detail = `cướp ${resTotal(st)} tài nguyên của ${t.name}`;
          } else {
            s.battle.enemyMod -= 3;
            addStar(p, 3, 'Vân Đồn: đánh thuyền lương');
            detail = 'Sức địch −3';
          }
          break;
        }
        case 'tranQuocToan':
          s.turn.extraDieuQuan += 1;
          p.reserve += Math.min(1, Math.max(0, MAX_TROOPS - troopTotal(s, p)));
          break;
        case 'tranThuDo': {
          for (const q of s.players) {
            if (q.id === p.id) continue;
            stealResources(q, p, 1);
          }
          s.battle.troops[p.id] += 1;
          break;
        }
        case 'haiBaTrung':
          s.battle.troops[p.id] += 3;
          break;
        case 'baTrieu':
          s.turn.extraAttack += 1;
          break;
        case 'nguyenTrai':
          s.battle.binhNgo.push(p.id);
          break;
      }
      p.ultUsedBattle = true;
      emit(s, { type: 'ultimate', playerId: p.id, targetId: a.targetId, text: `${p.name} dùng Tuyệt kỹ "${hero.ultimate.name}"${detail ? ` — ${detail}` : ''}`, data: { heroId: p.heroId, option: a.option } });
      return;
    }
    case 'ketThucLuot': {
      requireTurn(s, p.id);
      if (!s.turn.actionTaken) fail('Hãy làm 1 hành động chính trước khi kết thúc lượt.');
      endTurn(s);
      return;
    }
  }
}

/** Áp dụng một hành động. Hàm thuần: không sửa state cũ. */
export function applyAction(state: GameState, action: Action): ApplyResult {
  const s = clone(state);
  try {
    apply(s, action);
    return { ok: true, state: s };
  } catch (e) {
    if (e instanceof GameError) return { ok: false, error: e.message };
    throw e;
  }
}

/** Kiểm tra nhanh một hành động có hợp lệ không (trả về lỗi hoặc null). */
export function checkAction(state: GameState, action: Action): string | null {
  const r = applyAction(state, action);
  return r.ok ? null : r.error;
}

/** Những người cần hành động ngay (để server/trình duyệt biết phải chờ ai). */
export function waitingFor(s: GameState): string[] {
  switch (s.phase) {
    case 'battleIntro':
    case 'battleResult':
      return s.players.filter((p) => !s.ready.includes(p.id)).map((p) => p.id);
    case 'action':
      return [s.turn.playerId];
    case 'choice':
      return s.pendingChoice ? [s.pendingChoice.playerId] : [];
    case 'combat':
      return s.combat ? Object.keys(s.combat.bids).filter((k) => s.combat!.bids[k] === null) : [];
    case 'gameOver':
      return [];
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31) || 1;
}

export { nextRandom };
export type { BattleId };
