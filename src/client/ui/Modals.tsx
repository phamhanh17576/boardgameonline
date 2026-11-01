import { useEffect, useState } from 'react';
import {
  BATTLES,
  HEROES,
  STRATS,
  TITLES,
  combatBases,
  enemyStrength,
  tacticRequirement,
  RES_KEYS,
  type GameView,
  type StratId,
} from '../../engine';
import { useFxEvents } from '../scene/fxHooks';
import { useMe, useStore } from '../store';
import { RES_ICON, RES_NAME } from '../theme';
import { asState, HeroCard, Modal, Note, ResRow } from './common';
import { useUi } from './uiStore';

// ------------------------------------------------------------ Giao chiến (bỏ Sắt bí mật)
export function CombatModal({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  const c = view.combat;
  const [amount, setAmount] = useState(0);
  const [strat, setStrat] = useState<StratId | null>(null);
  useEffect(() => {
    setAmount(0);
    setStrat(null);
  }, [c?.attackerId, c?.defenderId, view.turn.number]);
  if (!c || !me) return null;
  const atk = view.players.find((p) => p.id === c.attackerId)!;
  const def = view.players.find((p) => p.id === c.defenderId)!;
  const involved = me.id === atk.id || me.id === def.id;
  const { atkBase, defBase, usesMuu } = combatBases(asState(view), { attackerId: atk.id, defenderId: def.id, mode: c.mode, bids: {}, strats: {} });
  const modeName = c.mode === 'tranhCong' ? 'Tranh công' : 'Đột kích';
  if (!involved) {
    return (
      <div className="combat-mini">
        ⚔️ <b>{atk.name}</b> {modeName} <b>{def.name}</b> — hai bên đang bí mật bỏ Sắt… ({c.submitted.length}/2)
      </div>
    );
  }
  const isAtk = me.id === atk.id;
  const submitted = c.submitted.includes(me.id);
  const currency = isAtk && usesMuu ? 'tien' : 'sat';
  const have = me.res[currency];
  const hand = (me.strats ?? []).filter((s) => STRATS[s].timing === (isAtk ? 'attack' : 'defense'));
  const myBase = isAtk ? atkBase : defBase;
  const stratBonus = strat === 'coHieu' ? 2 : strat === 'tiepVien' ? 3 : 0;
  return (
    <Modal className="combat-modal" title={`${isAtk ? 'Bạn' : atk.name} ${modeName} ${isAtk ? def.name : 'bạn'}!`}>
      <div className="combat-vs">
        <div className="cv-side" style={{ ['--hc' as string]: HEROES[atk.heroId].color }}>
          <div className="cv-seal">{HEROES[atk.heroId].name.split(' ').slice(-1)[0]}</div>
          <b>{atk.name}</b>
          <div className="cv-num">{atkBase}</div>
          <small>lực gốc {usesMuu ? '(Mưu)' : '(Võ)'}</small>
        </div>
        <div className="cv-x">⚔️</div>
        <div className="cv-side" style={{ ['--hc' as string]: HEROES[def.heroId].color }}>
          <div className="cv-seal">{HEROES[def.heroId].name.split(' ').slice(-1)[0]}</div>
          <b>{def.name}</b>
          <div className="cv-num">{defBase}</div>
          <small>thủ gốc</small>
        </div>
      </div>
      {submitted ? (
        <p className="center">Đã chốt. Đang chờ đối phương…</p>
      ) : (
        <>
          <p className="hint">
            Bí mật chọn số {currency === 'sat' ? '⛏️ Sắt' : '🪙 Tiền'} muốn bỏ ra (bạn có {have}). Đối phương không thấy con số này. {isAtk ? 'Bạn thắng nếu lực lớn hơn hẳn thủ của họ.' : 'Bạn giữ vững nếu thủ bằng hoặc hơn lực của họ.'}
          </p>
          <div className="bid">
            <input type="range" min={0} max={have} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <span className="bid-val">
              {amount} {RES_ICON[currency]}
            </span>
          </div>
          {hand.length > 0 && (
            <div className="row wrap">
              <span className="muted">Kế sách:</span>
              <button className={`chip${strat === null ? ' on' : ''}`} onClick={() => setStrat(null)}>
                Không dùng
              </button>
              {[...new Set(hand)].map((st) => (
                <button key={st} className={`chip${strat === st ? ' on' : ''}`} onClick={() => setStrat(st)} title={STRATS[st].text}>
                  {STRATS[st].name}
                </button>
              ))}
            </div>
          )}
          <p className="center big-num">
            {isAtk ? 'Lực của bạn' : 'Thủ của bạn'}: {myBase + amount + stratBonus}
          </p>
          <button className="btn gold big" onClick={() => act({ type: 'datSat', pid: me.id, amount, strat })}>
            Chốt bí mật
          </button>
        </>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------ Chọn Kế sách sau Mưu kế
export function ChoiceModal({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  const pc = view.pendingChoice;
  if (!pc || !me || pc.playerId !== me.id || pc.options.length === 0) return null;
  return (
    <Modal title="Mưu kế: chọn 1 Kế sách để giữ">
      <div className="strat-list">
        {pc.options.map((st, i) => (
          <div key={i} className={`strat-card t-${STRATS[st].timing}`}>
            <b>{STRATS[st].name}</b>
            <p>{STRATS[st].text}</p>
            <button className="btn gold small" onClick={() => act({ type: 'chonKeSach', pid: me.id, strat: st })}>
              Giữ lá này
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------ Giới thiệu trận (cuộn giấy)
export function BattleIntroModal({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  if (view.phase !== 'battleIntro' || !me) return null;
  const def = BATTLES[view.battle.id];
  const ready = view.ready.includes(me.id);
  const req = tacticRequirement(asState(view));
  const waiting = view.players.filter((p) => !view.ready.includes(p.id));
  const enemy = enemyStrength(asState(view)).base;
  return (
    <div className="scroll-back">
      <div className="scroll">
        <div className="scroll-rod top" />
        <div className="scroll-paper">
          <div className="scroll-kicker">Trận {view.battleIndex + 1}/{view.battleOrder.length}</div>
          <h2 className="scroll-title">{def.name}</h2>
          <div className="scroll-year">{def.year}</div>
          <p className="scroll-intro">{def.intro}</p>
          <div className="scroll-grid">
            <div>
              <span className="muted">Quân giặc</span>
              <b>{def.enemy}</b>
            </div>
            <div>
              <span className="muted">Bên ta</span>
              <b>{def.ourCommander}</b>
            </div>
            <div>
              <span className="muted">Sức địch</span>
              <b>
                {enemy}
                {view.battle.enemyMod < 0 && <span className="ok"> (đã giảm nhờ trận trước)</span>}
              </b>
            </div>
            <div>
              <span className="muted">Chiến thuật lịch sử</span>
              <b>
                {def.tacticName}:{' '}
                {RES_KEYS.filter((r) => req[r] > 0).map((r) => (
                  <span key={r}>
                    {' '}
                    {req[r]}
                    {RES_ICON[r]}
                  </span>
                ))}
              </b>
            </div>
          </div>
          <p className="scroll-why">{def.tacticWhy}</p>
          <p className="scroll-right">
            Đúng người đúng trận: <b>{def.rightHeroes.map((h) => HEROES[h].name).join(', ')}</b> (+2★ nếu có quân ở trận)
          </p>
          <Note note={def.note} />
          <div className="scroll-foot">
            {ready ? (
              <span className="muted">Đang chờ: {waiting.map((p) => p.name).join(', ')}</span>
            ) : (
              <button className="btn red big" onClick={() => act({ type: 'ready', pid: me.id })}>
                Xuất trận!
              </button>
            )}
          </div>
        </div>
        <div className="scroll-rod bottom" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Kết quả trận + Sử ký
export function BattleResultModal({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (view.phase === 'battleResult') {
      setShow(false);
      const t = setTimeout(() => setShow(true), 3400); // chờ hiệu ứng thủy triều
      return () => clearTimeout(t);
    }
  }, [view.phase, view.battleIndex]);
  const r = view.lastResult;
  if (view.phase !== 'battleResult' || !r || !me || !show) return null;
  const def = BATTLES[r.battleId];
  const ready = view.ready.includes(me.id);
  const waiting = view.players.filter((p) => !view.ready.includes(p.id));
  const right = r.rightHeroPlayers.map((pid) => view.players.find((p) => p.id === pid)!).filter(Boolean);
  return (
    <div className="scroll-back">
      <div className="scroll wide">
        <div className="scroll-rod top" />
        <div className="scroll-paper">
          <div className={`result-stamp ${r.won ? 'won' : 'lost'}`}>{r.won ? 'Đại thắng' : 'Thất thủ'}</div>
          <h2 className="scroll-title">{def.name}</h2>
          <p className="center">
            Lực phe ta <b>{r.power}</b> · Sức địch <b>{r.enemy}</b>
            {r.tacticComplete && <span className="ok"> · đủ chiến thuật "{def.tacticName}"</span>}
          </p>
          <table className="contrib">
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>Quân</th>
                <th>Chiến thuật</th>
                <th>Uy danh</th>
              </tr>
            </thead>
            <tbody>
              {r.contributions
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((c) => {
                  const p = view.players.find((x) => x.id === c.playerId)!;
                  return (
                    <tr key={c.playerId} className={c.playerId === me.id ? 'me' : ''}>
                      <td>
                        <b>{p.name}</b> <span className="muted small">{HEROES[p.heroId].name}</span>
                      </td>
                      <td>{c.troops}</td>
                      <td>{c.tactic}</td>
                      <td>
                        <b className={c.stars < 0 ? 'bad' : 'ok'}>
                          {c.stars > 0 ? '+' : ''}
                          {c.stars}★
                        </b>
                        <div className="muted small">{c.reasons.join(' · ')}</div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="suky">
            <h3>📜 Sử ký — theo Đại Việt sử ký toàn thư</h3>
            {!r.won && <p className="muted">Trên bàn chơi, phe ta đã thất thủ. Còn trong lịch sử, cha ông đã chiến thắng như sau:</p>}
            {def.dienBien.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
            <p className="suky-y">
              <b>Ý nghĩa:</b> {def.yNghia}
            </p>
            <Note note={def.note} />
            {right.length > 0 &&
              right.map((p) => {
                const q = HEROES[p.heroId].quote;
                return q ? (
                  <blockquote key={p.id} className="hc-quote unlock">
                    🔓 <b>{HEROES[p.heroId].name}</b> đúng người đúng trận — mở khóa: {q.text} <Note note={q.note} />
                  </blockquote>
                ) : null;
              })}
          </div>
          <div className="scroll-foot">
            {ready ? (
              <span className="muted">Đang chờ: {waiting.map((p) => p.name).join(', ')}</span>
            ) : (
              <button className="btn red big" onClick={() => act({ type: 'ready', pid: me.id })}>
                {view.battleIndex + 1 < view.battleOrder.length ? 'Sang trận tiếp' : 'Xem kết quả chung cuộc'}
              </button>
            )}
          </div>
        </div>
        <div className="scroll-rod bottom" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Kết thúc ván
export function FinalModal({ view }: { view: GameView }) {
  const you = useStore((s) => s.you);
  const lobby = useStore((s) => s.lobby);
  const send = useStore((s) => s.send);
  const leave = useStore((s) => s.leave);
  if (view.phase !== 'gameOver' || !view.final) return null;
  const rows = view.final.slice().sort((a, b) => a.rank - b.rank);
  const winner = view.players.find((p) => p.id === rows[0].playerId)!;
  return (
    <Modal title="Chung cuộc" wide className="final">
      <p className="center big">
        🏆 <b>{winner.name}</b> ({HEROES[winner.heroId].name}) có Uy danh cao nhất!
      </p>
      <table className="contrib">
        <thead>
          <tr>
            <th>#</th>
            <th>Người chơi</th>
            <th>Uy danh</th>
            <th>Vùng ≥5 ô</th>
            <th>Lòng dân</th>
            <th>Danh hiệu</th>
            <th>Tổng</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => {
            const p = view.players.find((x) => x.id === f.playerId)!;
            return (
              <tr key={f.playerId} className={f.playerId === you ? 'me' : ''}>
                <td>{f.rank}</td>
                <td>
                  <b>{p.name}</b> <span className="muted small">{HEROES[p.heroId].name}</span>
                </td>
                <td>{f.base}</td>
                <td>{f.regions5 ? `+${f.regions5}` : '—'}</td>
                <td>
                  {p.longDan} → {f.longDan >= 0 ? '+' : ''}
                  {f.longDan}
                </td>
                <td>{f.titles.map((t) => `${TITLES[t.id].name} +${t.star}`).join(', ') || '—'}</td>
                <td>
                  <b>{f.total}★</b>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted small">Danh hiệu ván này: {view.titles.map((t) => `${TITLES[t].name} (${TITLES[t].text})`).join(' · ')}</p>
      <div className="row center">
        {lobby?.hostId === you && (
          <button className="btn gold" onClick={() => send({ t: 'backToLobby' })}>
            Ván mới
          </button>
        )}
        <button className="btn ghost" onClick={leave}>
          Về trang chủ
        </button>
      </div>
    </Modal>
  );
}

export function HeroInfoModal() {
  const h = useUi((s) => s.heroInfo);
  const set = useUi((s) => s.setHeroInfo);
  if (!h) return null;
  return (
    <Modal onClose={() => set(null)}>
      <HeroCard heroId={h} />
    </Modal>
  );
}

export function HelpModal() {
  const show = useUi((s) => s.showHelp);
  const set = useUi((s) => s.setHelp);
  if (!show) return null;
  return (
    <Modal title="Luật chơi nhanh" onClose={() => set(false)} wide>
      <div className="help">
        <p>
          <b>Mục tiêu:</b> cùng nhau đánh thắng 2 trận lịch sử (Vân Đồn rồi Bạch Đằng 1288), nhưng người có nhiều <b>Uy danh ★</b> nhất mới thắng chung cuộc.
        </p>
        <ol>
          <li>
            Mỗi trận có <b>3 vòng</b>. Mỗi lượt bạn làm <b>1 hành động chính</b>, cộng thêm tối đa 1 Kế sách và Tuyệt kỹ (1 lần mỗi trận).
          </li>
          <li>
            <b>Khai hoang</b>: xếp ô đất vào lãnh địa. Ô cùng loại liền nhau thành <i>vùng</i>; mỗi vùng cho tài nguyên khi <b>Thu thuế</b> (tối đa 3/vùng). Ruộng kề Sông +1 Lúa. Vùng Núi ≥3 ô là <i>Thành lũy</i> (+2 Thủ); vùng Sông ≥3 ô là <i>Thủy trại</i> (+1 Võ ở trận sông).
          </li>
          <li>
            <b>Chiêu hiền</b>: mua Tướng phụ, được giảm giá vĩnh viễn, cộng Võ/Thủ và ★.
          </li>
          <li>
            <b>Mộ binh</b> (1 Lúa = 1 Quân) rồi <b>Điều quân</b> ra chiến trường. Góp tài nguyên đúng <i>chiến thuật lịch sử</i> để giảm 30% Sức địch.
          </li>
          <li>
            Hết 3 vòng: <b>Lực phe ta</b> (tổng Quân + Võ của người có quân) ≥ <b>Sức địch</b> thì thắng. Ai đóng góp nhiều nhất được nhiều ★ nhất. Thua thì mọi người −1 Lòng dân, người ít đóng góp nhất −2★.
          </li>
          <li>
            <b>Tấn công</b> người khác: <i>Tranh công</i> loại 2 Quân của họ ở trận; <i>Đột kích</i> cướp 3 tài nguyên (mất 1 Lòng dân, trừ khi đánh người dẫn đầu). Hai bên <b>bí mật bỏ Sắt</b> rồi lật cùng lúc.
          </li>
          <li>
            Cuối ván: cộng ★, Danh hiệu, vùng ≥5 ô (+2★), Lòng dân (≥8: +4★; ≤2: −3★). Hòa thì ai được lòng dân hơn thắng.
          </li>
        </ol>
        <p className="muted">Các trận, nhân vật và câu nói đều trích từ Đại Việt sử ký toàn thư; chi tiết dân gian được ghi nhãn "Tương truyền".</p>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------ Băng rôn hiệu ứng lớn
export function BannerDirector({ view }: { view: GameView }) {
  const show = useUi((s) => s.showBanner);
  const name = (pid?: string) => view.players.find((p) => p.id === pid)?.name ?? '';
  useFxEvents((e) => {
    switch (e.type) {
      case 'battleStart': {
        const def = BATTLES[(e.data?.battleId as keyof typeof BATTLES) ?? view.battle.id];
        show(def.name, def.year, '#f6d27a');
        break;
      }
      case 'ultimate': {
        const p = view.players.find((x) => x.id === e.playerId);
        if (p) show(HEROES[p.heroId].ultimate.name, `${p.name} dùng Tuyệt kỹ`, HEROES[p.heroId].color);
        break;
      }
      case 'attackDeclared':
        show(e.data?.mode === 'tranhCong' ? 'Tranh công!' : 'Đột kích!', `${name(e.playerId)} → ${name(e.targetId)}`, '#e0482f');
        break;
      case 'combatResolved': {
        const d = e.data as { attackerWon: boolean; atk: number; def: number } | undefined;
        if (d) show(d.attackerWon ? 'Phá được!' : 'Giữ vững!', `${d.atk} – ${d.def}`, d.attackerWon ? '#ff7a3a' : '#9fd3ff');
        break;
      }
      case 'battleResolved':
        setTimeout(() => show(e.data?.won ? 'Đại thắng!' : 'Thất thủ…', e.text, e.data?.won ? '#f6d27a' : '#9aa4ad'), 2200);
        break;
      case 'gameOver':
        show('Chung cuộc', e.text, '#f6d27a');
        break;
    }
  });
  const banner = useUi((s) => s.banner);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!banner) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2300);
    return () => clearTimeout(t);
  }, [banner?.at]);
  if (!banner || !visible) return null;
  return (
    <div className="banner" key={banner.at} style={{ ['--bc' as string]: banner.color ?? '#f6d27a' }}>
      <div className="banner-ink" />
      <div className="banner-title">{banner.title}</div>
      {banner.sub && <div className="banner-sub">{banner.sub}</div>}
    </div>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [toast?.at]);
  if (!toast || !visible) return null;
  return <div className="toast">{toast.text}</div>;
}

export { RES_NAME, ResRow };
