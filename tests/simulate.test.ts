// Mô phỏng cân bằng: chạy `SIM=1 npx vitest run tests/simulate.test.ts`
import { describe, it } from 'vitest';
import { applyAction, botAction, createGame, HERO_IDS, waitingFor, type GameState, type HeroId } from '../src/engine';
import { shuffle } from '../src/engine/rng';

declare const process: { env: Record<string, string | undefined> };
const RUN = process.env.SIM === '1';

describe.skipIf(!RUN)('simulate', () => {
  it('cân bằng', () => {
    const games = Number(process.env.GAMES ?? 400);
    const wins: Record<string, number> = {};
    const plays: Record<string, number> = {};
    const scores: Record<string, number[]> = {};
    const battleWins: Record<string, [number, number]> = {};
    let attacks = 0;
    const powerAt: number[][] = [];
    const enemyAt: number[][] = [];
    const reserveAt: number[][] = [];
    const tacticAt: number[][] = [];
    for (let g = 0; g < games; g++) {
      const n = 4 + (g % 3);
      const st = { rngState: g * 7919 + 13 };
      const heroes = shuffle(st, HERO_IDS).slice(0, n) as HeroId[];
      const battleCount = [2, 4, 6, 8][g % 4];
      let s: GameState = createGame({ seed: g * 31 + 7, battleCount, players: heroes.map((h, i) => ({ id: `p${i}`, name: h, heroId: h, isBot: true })) });
      const order = s.battleOrder.slice();
      let lastBattle = s.battle.id;
      let lastRes: unknown = null;
      let steps = 0;
      while (s.phase !== 'gameOver' && steps++ < 5000) {
        const who = waitingFor(s)[0];
        const a = botAction(s, who)!;
        if (a.type === 'tanCong') attacks++;
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
        if (s.lastResult && s.phase === 'battleResult') {
          /* bots auto-advance; handled below */
        }
        if (s.battle.id !== lastBattle) lastBattle = s.battle.id;
        if (s.lastResult && s.lastResult !== lastRes) {
          lastRes = s.lastResult;
          const idx = order.indexOf(s.lastResult.battleId);
          (powerAt[idx] ??= []).push(s.lastResult.power);
          (enemyAt[idx] ??= []).push(s.lastResult.enemy);
          const tot = s.players.reduce((a, p) => a + p.reserve, 0);
          (reserveAt[idx] ??= []).push(tot);
          (tacticAt[idx] ??= []).push(s.lastResult.tacticComplete ? 1 : 0);
        }
      }
      order.forEach((b, idx) => {
        const won = s.wonBattles.includes(b);
        for (const key of [`trận #${idx + 1}`, `${b}`, `${n} người`]) {
          battleWins[key] ??= [0, 0];
          battleWins[key][1]++;
          if (won) battleWins[key][0]++;
        }
      });
      for (const f of s.final!) {
        const h = s.players.find((p) => p.id === f.playerId)!.heroId;
        plays[h] = (plays[h] ?? 0) + 1;
        (scores[h] ??= []).push(f.total);
        if (f.rank === 1) wins[h] = (wins[h] ?? 0) + 1;
      }
    }
    console.log('Tỉ lệ thắng theo anh hùng (kỳ vọng ~20%):');
    for (const h of HERO_IDS) {
      const sc = scores[h] ?? [];
      const avg = sc.reduce((a, b) => a + b, 0) / Math.max(1, sc.length);
      console.log(`  ${h.padEnd(14)} thắng ${(((wins[h] ?? 0) / Math.max(1, plays[h] ?? 0)) * 100).toFixed(1)}%  điểm TB ${avg.toFixed(1)}  (${plays[h]} ván)`);
    }
    console.log('Tỉ lệ thắng trận:');
    for (const [k, [w, t]] of Object.entries(battleWins).sort()) console.log(`  ${k.padEnd(28)} ${((w / t) * 100).toFixed(0)}% (${t})`);
    console.log(`Số lần tấn công trung bình/ván: ${(attacks / games).toFixed(1)}`);
    const avg = (a: number[] = []) => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(1);
    for (let i = 0; i < 8; i++) console.log(`  #${i + 1}: lực ${avg(powerAt[i])} / địch ${avg(enemyAt[i])} · quân dự bị sau trận ${avg(reserveAt[i])} · đủ chiến thuật ${avg(tacticAt[i])}`);
  }, 300_000);
});
