// Máy chơi cùng (bot) dùng luật đơn giản, có chút ngẫu nhiên theo seed của ván.
import { GENERALS, STRATS } from './content/cards';
import { HEROES } from './content/heroes';
import { neighbors, placeableCells } from './hex';
import { nextRandom } from './rng';
import {
  MAX_DIEU_QUAN,
  battleDef,
  canAfford,
  checkAction,
  combatBases,
  generalCost,
  getPlayer,
  moBinhMax,
  resCap,
  resTotal,
  stratHandLimit,
  tacticRemaining,
  troopTotal,
  MAX_TROOPS,
} from './rules';
import { RES_KEYS, type Action, type GameState, type PlayerState, type Resources, type StratId } from './types';

function rand(s: GameState): number {
  // Dùng bản sao trạng thái rng để không làm lệch ván (bot chỉ "nghĩ").
  const tmp = { rngState: (s.rngState ^ (s.turnCounter * 2654435761)) | 0 };
  return nextRandom(tmp);
}

function valid(s: GameState, a: Action): boolean {
  return checkAction(s, a) === null;
}

export function botAction(s: GameState, pid: string): Action | null {
  const p = s.players.find((x) => x.id === pid);
  if (!p) return null;
  if ((s.phase === 'battleIntro' || s.phase === 'battleResult') && !s.ready.includes(pid)) return { type: 'ready', pid };
  if (s.phase === 'choice' && s.pendingChoice?.playerId === pid) return chooseStrat(s, p, s.pendingChoice.options);
  if (s.phase === 'combat' && s.combat && s.combat.bids[pid] === null) return bid(s, p);
  if (s.phase === 'action' && s.turn.playerId === pid) return turnAction(s, p);
  return null;
}

function chooseStrat(s: GameState, p: PlayerState, options: StratId[]): Action {
  const score = (st: StratId) => {
    if (st === 'muaMang') return p.res.lua < 3 ? 5 : 2;
    if (st === 'dienHong') return 4;
    if (st === 'renBinh') return p.res.sat < 3 ? 4 : 2;
    if (st === 'tiepVien') return 3;
    if (st === 'coHieu') return 3;
    return 2;
  };
  const best = options.slice().sort((a, b) => score(b) - score(a))[0];
  return { type: 'chonKeSach', pid: p.id, strat: best };
}

function bid(s: GameState, p: PlayerState): Action {
  const c = s.combat!;
  const { atkBase, defBase, usesMuu } = combatBases(s, c);
  const isAtk = p.id === c.attackerId;
  const other = getPlayer(s, isAtk ? c.defenderId : c.attackerId);
  const have = isAtk && usesMuu ? p.res.tien : p.res.sat;
  let strat: StratId | null = null;
  if (isAtk && p.strats.includes('coHieu')) strat = 'coHieu';
  if (!isAtk) {
    if (c.mode === 'dotKich' && p.strats.includes('vuonKhong')) strat = 'vuonKhong';
    else if (p.strats.includes('tiepVien')) strat = 'tiepVien';
    else if (p.strats.includes('vuonKhong')) strat = 'vuonKhong';
  }
  const r = rand(s);
  let amount: number;
  if (isAtk) {
    const myBase = atkBase + (strat === 'coHieu' ? 2 : 0);
    const guess = defBase + Math.round(other.res.sat * (0.3 + r * 0.4));
    amount = Math.max(0, guess - myBase + 1);
  } else {
    const myBase = defBase + (strat === 'tiepVien' ? 3 : 0);
    const otherHave = usesMuu ? other.res.tien : other.res.sat;
    const guess = atkBase + Math.round(otherHave * (0.3 + r * 0.4));
    amount = Math.max(0, guess - myBase);
    if (c.mode === 'dotKich' && resTotal(p.res) <= 2) amount = Math.min(amount, 1);
  }
  amount = Math.min(have, amount);
  return { type: 'datSat', pid: p.id, amount, strat };
}

function shouldUseUltimate(s: GameState, p: PlayerState): Action | null {
  if (p.ultUsedBattle) return null;
  const last = s.round === s.roundsPerBattle;
  const troopsAt = (id: string) => s.battle.troops[id] ?? 0;
  const withTroops = s.players.filter((q) => troopsAt(q.id) > 0).length;
  const base: Action = { type: 'tuyetKy', pid: p.id };
  switch (p.heroId) {
    case 'tranHungDao':
      return s.round >= 2 && withTroops >= Math.min(3, s.players.length - 1) ? base : last && withTroops > 0 ? base : null;
    case 'tranQuangKhai':
    case 'nguyenTrai':
      return s.round >= 2 && troopsAt(p.id) > 0 ? base : null;
    case 'tranKhanhDu': {
      if (last || s.round >= 2) return { ...base, option: 'a' };
      const rich = s.players.filter((q) => q.id !== p.id).sort((a, b) => resTotal(b.res) - resTotal(a.res))[0];
      return rich && resTotal(rich.res) >= 6 && resTotal(p.res) <= resCap(p) - 3 ? { ...base, option: 'b', targetId: rich.id } : null;
    }
    case 'tranQuocToan':
      return p.reserve >= 3 && !s.turn.actionTaken ? base : null;
    case 'tranThuDo':
      return s.round >= 2 ? base : null;
    case 'haiBaTrung':
      return s.round >= 2 || last ? base : null;
    case 'baTrieu':
      return attackCandidate(s, p) && p.res.lua >= 2 && !s.turn.actionTaken ? base : null;
  }
}

function attackCandidate(s: GameState, p: PlayerState): Action | null {
  if (p.res.lua < 1) return null;
  const others = s.players.filter((q) => q.id !== p.id && !p.prevTurnTargets.includes(q.id));
  if (others.length === 0) return null;
  const leaderStar = Math.max(...s.players.map((q) => q.star));
  const muu = p.heroId === 'nguyenTrai';
  const power = muu ? p.res.tien : p.res.sat;
  const options: { a: Action; score: number }[] = [];
  for (const q of others) {
    for (const mode of ['tranhCong', 'dotKich'] as const) {
      const a: Action = { type: 'tanCong', pid: p.id, targetId: q.id, mode };
      if (!valid(s, a)) continue;
      const { atkBase, defBase } = combatBases(s, { attackerId: p.id, defenderId: q.id, mode, bids: {}, strats: {} });
      const edge = atkBase + power - (defBase + q.res.sat * 0.6);
      if (edge < 1) continue;
      let score = edge;
      if (q.star === leaderStar) score += 2;
      if (mode === 'tranhCong') score += Math.min(3, s.battle.troops[q.id] ?? 0) * 0.6;
      if (mode === 'dotKich') {
        score += Math.min(3, resTotal(q.res)) * 0.5;
        if (q.star !== leaderStar && !muu) score -= 1.5;
        if (p.longDan <= 3) score -= 3;
      }
      if (q.isBot === false) score += 0.2;
      options.push({ a, score });
    }
  }
  options.sort((x, y) => y.score - x.score);
  return options[0]?.score > 1 ? options[0].a : null;
}

function tacticOffer(s: GameState, p: PlayerState): Partial<Resources> {
  const need = tacticRemaining(s);
  const out: Partial<Resources> = {};
  for (const r of RES_KEYS) {
    const keep = r === 'lua' ? 1 : 0;
    const v = Math.max(0, Math.min(need[r], p.res[r] - keep));
    if (v > 0) out[r] = v;
  }
  return out;
}

function bestGeneral(s: GameState, p: PlayerState): string | null {
  const pool = [...s.market[1], ...s.market[2], ...s.market[3], ...p.reserved];
  let best: string | null = null;
  let bestScore = -1;
  for (const g of pool) {
    const cost = generalCost(p, g);
    if (!canAfford(p, cost)) continue;
    const d = GENERALS[g];
    const river = battleDef(s).river;
    const score = d.star * 2 + d.vo * 1.4 + d.thu * 0.6 + (d.bonus ? 1.2 : 0) + (river && d.ability === 'riverVo' ? 1 : 0) - resTotal(cost) * 0.15;
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return best;
}

function landAction(s: GameState, p: PlayerState): Action | null {
  if (Object.keys(p.territory).length >= 17) return null;
  let best: { a: Action; score: number } | null = null;
  for (let start = 0; start + 1 < s.landRow.length; start++) {
    if (start === 0 && p.res.tien < 1) continue;
    const t0 = s.landRow[start];
    const t1 = s.landRow[start + 1];
    const terr = { ...p.territory };
    const pick = (t: string) => {
      let bc: string | null = null;
      let bs = -99;
      for (const c of placeableCells(terr)) {
        let sc = 0;
        for (const n of neighbors(c)) {
          if (terr[n] === t) sc += 2;
          else if (terr[n]) sc += 0.3;
        }
        if (t === 'ruong' && neighbors(c).some((n) => terr[n] === 'song')) sc += 1;
        if (t === 'song' && neighbors(c).some((n) => terr[n] === 'ruong')) sc += 1;
        sc -= Math.abs(Number(c.split(',')[0])) * 0.05;
        if (sc > bs) {
          bs = sc;
          bc = c;
        }
      }
      if (bc) terr[bc] = t as never;
      return { cell: bc, score: bs };
    };
    const a0 = pick(t0);
    const a1 = pick(t1);
    if (!a0.cell || !a1.cell) continue;
    const want = (t: string) => (t === 'ruong' ? 1.2 : t === 'nui' ? 1.1 : t === 'rung' ? 1 : t === 'song' ? 0.8 : 0.7);
    const score = a0.score + a1.score + want(t0) + want(t1) - (start === 0 ? 1 : 0);
    const a: Action = { type: 'khaiHoang', pid: p.id, start, cells: [a0.cell, a1.cell] };
    if (!best || score > best.score) best = { a, score };
  }
  return best && valid(s, best.a) ? best.a : null;
}

function turnAction(s: GameState, p: PlayerState): Action {
  const end: Action = { type: 'ketThucLuot', pid: p.id };
  const ult = shouldUseUltimate(s, p);
  if (ult && valid(s, ult)) return ult;

  if (!s.turn.stratPlayed) {
    for (const st of p.strats) {
      if (STRATS[st].timing !== 'instant') continue;
      const ok = st === 'muaMang' ? p.res.lua <= 3 : st === 'renBinh' ? true : s.round >= 2;
      const a: Action = { type: 'keSach', pid: p.id, strat: st };
      if (ok && valid(s, a)) return a;
    }
  }

  if (s.turn.actionTaken) {
    if (s.turn.extraDieuQuan > 0 && p.reserve > 0) {
      const a: Action = { type: 'dieuQuan', pid: p.id, troops: Math.min(MAX_DIEU_QUAN, p.reserve), tactic: tacticOffer(s, p) };
      if (valid(s, a)) return a;
    }
    if (s.turn.extraAttack > 0) {
      const a = attackCandidate(s, p);
      if (a) return a;
    }
    return end;
  }

  const r = rand(s);
  const last = s.round === s.roundsPerBattle;
  const offer = tacticOffer(s, p);
  const offerTotal = resTotal(offer);
  const reserve = p.reserve;

  const candidates: Action[] = [];
  // Ra trận khi có nhiều quân, hoặc vòng cuối
  if (reserve >= 3 || (last && (reserve > 0 || offerTotal > 0)) || (s.round >= 2 && offerTotal >= 2)) {
    candidates.push({ type: 'dieuQuan', pid: p.id, troops: Math.min(MAX_DIEU_QUAN, reserve), tactic: offer });
  }
  // Tấn công thỉnh thoảng
  if (r < 0.45) {
    const atk = attackCandidate(s, p);
    if (atk) candidates.push(atk);
  }
  // Chiêu hiền
  const g = bestGeneral(s, p);
  if (g && (r > 0.25 || GENERALS[g].tier >= 2)) candidates.push({ type: 'chieuHien', pid: p.id, generalId: g });
  // Mộ binh
  if (p.res.lua >= 2 && reserve < 4 && troopTotal(s, p) < MAX_TROOPS - 2) {
    candidates.push({ type: 'moBinh', pid: p.id, count: Math.min(moBinhMax(p), p.res.lua - (last ? 0 : 1)) || 1 });
  }
  // Khai hoang sớm
  if (s.battleIndex === 0 && s.round <= 2 && r > 0.35) {
    const land = landAction(s, p);
    if (land) candidates.push(land);
  }
  // Mưu kế khi rảnh
  if (p.strats.length < stratHandLimit(p) && r > 0.85) candidates.push({ type: 'muuKe', pid: p.id });
  candidates.push({ type: 'thuThue', pid: p.id });

  for (const a of candidates) if (valid(s, a)) return a;
  const land = landAction(s, p);
  if (land) return land;
  return end;
}

export function heroName(id: keyof typeof HEROES) {
  return HEROES[id].name;
}
