import { describe, expect, it } from 'vitest';
import {
  applyAction,
  botAction,
  computeIncome,
  createGame,
  HERO_IDS,
  regions,
  viewFor,
  waitingFor,
  type GameState,
  type HeroId,
} from '../src/engine';

function setup(n = 4, seed = 42, heroes?: HeroId[]): GameState {
  const hs = heroes ?? HERO_IDS.slice(0, n);
  return createGame({
    seed,
    players: hs.map((h, i) => ({ id: `p${i}`, name: `Người ${i + 1}`, heroId: h, isBot: true })),
  });
}

/** Cho bot chơi đến hết ván. */
export function runBots(s: GameState, maxSteps = 5000): { state: GameState; steps: number } {
  let steps = 0;
  while (s.phase !== 'gameOver' && steps < maxSteps) {
    const who = waitingFor(s);
    if (who.length === 0) throw new Error(`Kẹt ở phase ${s.phase}`);
    const a = botAction(s, who[0]);
    if (!a) throw new Error(`Bot ${who[0]} không có hành động ở ${s.phase}`);
    const r = applyAction(s, a);
    if (!r.ok) throw new Error(`Bot ${who[0]} làm sai ${a.type}: ${r.error}`);
    s = r.state;
    steps++;
  }
  return { state: s, steps };
}

describe('engine', () => {
  it('khởi tạo ván 4–6 người và bắt đầu lượt đầu', () => {
    for (const n of [4, 5, 6]) {
      const s = setup(n);
      expect(s.players).toHaveLength(n);
      expect(s.phase).toBe('action'); // toàn bot nên tự qua phần giới thiệu
      expect(s.landRow).toHaveLength(6);
      expect(s.market[1]).toHaveLength(4);
      expect(s.titles).toHaveLength(3);
    }
  });

  it('từ chối 3 người hoặc trùng anh hùng', () => {
    expect(() => setup(3)).toThrow();
    expect(() => setup(4, 1, ['tranHungDao', 'tranHungDao', 'baTrieu', 'nguyenTrai'])).toThrow();
  });

  it('thu nhập theo vùng địa hình', () => {
    const s = setup();
    const p = s.players[0];
    p.territory = { '0,0': 'ruong', '1,0': 'ruong', '0,1': 'song', '-1,0': 'nui', '-1,1': 'lang' };
    const inc = computeIncome(p);
    expect(inc.lua).toBe(3); // vùng ruộng 2 ô + kề sông
    expect(inc.sat).toBe(1);
    expect(inc.tien).toBe(1); // làng kề ruộng, núi, sông
    expect(regions(p.territory)).toHaveLength(4);
  });

  it('khai hoang phải kề lãnh địa và không đi ngoài lượt', () => {
    const s = setup();
    const pid = s.turn.playerId;
    const bad = applyAction(s, { type: 'khaiHoang', pid, start: 1, cells: ['2,-2', '-2,2'] });
    expect(bad.ok).toBe(false);
    const other = s.players.find((p) => p.id !== pid)!.id;
    expect(applyAction(s, { type: 'thuThue', pid: other }).ok).toBe(false);
    const ok = applyAction(s, { type: 'khaiHoang', pid, start: 1, cells: ['-1,0', '-1,1'] });
    expect(ok.ok).toBe(true);
  });

  it('giao chiến bỏ Sắt bí mật và ẩn thông tin', () => {
    let s = setup(4, 7, ['baTrieu', 'tranQuangKhai', 'tranThuDo', 'nguyenTrai']);
    // Đặt lượt cho Bà Triệu, cho đối thủ có quân ở chiến trường
    const atk = s.players.find((p) => p.heroId === 'baTrieu')!;
    const def = s.players.find((p) => p.heroId === 'tranThuDo')!;
    s.turn.playerId = atk.id;
    s.battle.troops[def.id] = 3;
    atk.res.sat = 3;
    def.res.sat = 1;
    let r = applyAction(s, { type: 'tanCong', pid: atk.id, targetId: def.id, mode: 'tranhCong' });
    expect(r.ok).toBe(true);
    s = (r as { state: GameState }).state;
    expect(s.phase).toBe('combat');
    r = applyAction(s, { type: 'datSat', pid: atk.id, amount: 3, strat: null });
    s = (r as { state: GameState }).state;
    const v = viewFor(s, def.id);
    expect(v.combat?.submitted).toEqual([atk.id]);
    expect(JSON.stringify(v)).not.toContain('"bids"');
    r = applyAction(s, { type: 'datSat', pid: def.id, amount: 1, strat: null });
    s = (r as { state: GameState }).state;
    expect(s.phase).toBe('action');
    // Bà Triệu: Võ 3 + 2 (cưỡi voi) + 3 Sắt = 8 > Thủ Độ: Thủ 3 + 1 Sắt = 4
    expect(s.lastCombat?.attackerWon).toBe(true);
    expect(s.battle.troops[def.id]).toBe(1);
    expect(s.players.find((p) => p.id === def.id)!.revengeVs).toContain(atk.id);
  });

  it('Trần Hưng Đạo không được Tranh công', () => {
    const s = setup(4, 3, ['tranHungDao', 'baTrieu', 'tranThuDo', 'nguyenTrai']);
    const thd = s.players.find((p) => p.heroId === 'tranHungDao')!;
    s.turn.playerId = thd.id;
    const t = s.players.find((p) => p.id !== thd.id)!;
    s.battle.troops[t.id] = 2;
    const r = applyAction(s, { type: 'tanCong', pid: thd.id, targetId: t.id, mode: 'tranhCong' });
    expect(r.ok).toBe(false);
  });

  it('bot chơi hết ván 4, 5, 6 người không lỗi', () => {
    for (const n of [4, 5, 6]) {
      for (let seed = 1; seed <= 15; seed++) {
        const { state } = runBots(setup(n, seed * 101 + n));
        expect(state.phase).toBe('gameOver');
        expect(state.final).toHaveLength(n);
        expect(state.final!.some((f) => f.rank === 1)).toBe(true);
      }
    }
  });
});
