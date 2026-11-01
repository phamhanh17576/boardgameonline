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
    for (let g = 0; g < games; g++) {
      const n = 4 + (g % 3);
      const st = { rngState: g * 7919 + 13 };
      const heroes = shuffle(st, HERO_IDS).slice(0, n) as HeroId[];
      let s: GameState = createGame({ seed: g * 31 + 7, players: heroes.map((h, i) => ({ id: `p${i}`, name: h, heroId: h, isBot: true })) });
      let lastBattle = s.battle.id;
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
      }
      for (const e of s.events) {
        if (e.type === 'battleResolved') {
          const key = `${e.text.split(':')[0]} (${n}p)`;
          battleWins[key] ??= [0, 0];
          battleWins[key][1]++;
          if ((e.data as { won: boolean }).won) battleWins[key][0]++;
        }
      }
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
    for (const [k, [w, t]] of Object.entries(battleWins)) console.log(`  ${k.padEnd(28)} ${((w / t) * 100).toFixed(0)}% (${t})`);
    console.log(`Số lần tấn công trung bình/ván: ${(attacks / games).toFixed(1)}`);
  }, 300_000);
});
