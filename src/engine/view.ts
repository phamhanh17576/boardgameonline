import type { GameState, GameView } from './types';

/** Ẩn thông tin bí mật trước khi gửi cho một người chơi (hoặc khán giả nếu viewerId = null). */
export function viewFor(s: GameState, viewerId: string | null): GameView {
  const { players, landDeck, generalDecks, stratDeck, combat, rngState: _rng, pendingChoice, ...rest } = s;
  return {
    ...rest,
    pendingChoice: pendingChoice
      ? { playerId: pendingChoice.playerId, options: pendingChoice.playerId === viewerId ? pendingChoice.options : [] }
      : null,
    players: players.map((p) => ({ ...p, strats: p.id === viewerId ? p.strats : null, stratCount: p.strats.length })),
    landDeckCount: landDeck.length,
    generalDeckCounts: { 1: generalDecks[1].length, 2: generalDecks[2].length, 3: generalDecks[3].length },
    stratDeckCount: stratDeck.length,
    combat: combat
      ? {
          attackerId: combat.attackerId,
          defenderId: combat.defenderId,
          mode: combat.mode,
          submitted: Object.keys(combat.bids).filter((k) => combat.bids[k] !== null),
          myBid: viewerId ? combat.bids[viewerId] ?? null : null,
        }
      : null,
    viewerId,
  };
}
