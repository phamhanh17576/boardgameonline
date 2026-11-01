import { useEffect, useState } from 'react';
import {
  BATTLES,
  HEROES,
  RES_KEYS,
  STRATS,
  TITLES,
  combatBases,
  enemyStrength,
  tacticRequirement,
  type GameView,
  type StratId,
} from '../../engine';
import { useFxEvents } from '../scene/fxHooks';
import { useMe, useStore } from '../store';
import { RES_ICON, RES_NAME } from '../theme';
import { asState, Avatar, HeroCard, Modal, Note } from './common';
import { Icon } from './Icon';
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
  const modeName = c.mode === 'tranhCong' ? 'tranh công' : 'đột kích';
  if (!involved) {
    return (
      <div className="combat-mini">
        {atk.name} {modeName} {def.name}. Hai bên đang bí mật chọn Sắt ({c.submitted.length}/2).
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
    <Modal className="combat-modal" title={isAtk ? `Bạn ${modeName} ${def.name}` : `${atk.name} ${modeName} bạn`}>
      <div className="combat-vs">
        <div className="cv-side">
          <Avatar heroId={atk.heroId} size={96} big />
          <b>{atk.name}</b>
          <span className="cv-num">{atkBase}</span>
          <small className="muted">lực gốc ({usesMuu ? 'Mưu' : 'Võ'})</small>
        </div>
        <Icon name="tanCong" size={40} className="cv-x" />
        <div className="cv-side">
          <Avatar heroId={def.heroId} size={96} big />
          <b>{def.name}</b>
          <span className="cv-num">{defBase}</span>
          <small className="muted">thủ gốc</small>
        </div>
      </div>
      {submitted ? (
        <p className="center">Bạn đã chốt. Đang chờ đối phương.</p>
      ) : (
        <>
          <p className="hint">
            Chọn số {RES_NAME[currency]} muốn bỏ ra (bạn có {have}). Đối phương không thấy con số này.{' '}
            {isAtk ? 'Bạn thắng nếu lực lớn hơn hẳn thủ của họ.' : 'Bạn giữ được nếu thủ bằng hoặc hơn lực của họ.'}
          </p>
          <div className="bid">
            <input type="range" aria-label={`Số ${RES_NAME[currency]}`} min={0} max={have} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <span className="bid-val">
              {amount} <Icon name={RES_ICON[currency]} size={22} />
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
          <button className="btn son big" onClick={() => act({ type: 'datSat', pid: me.id, amount, strat })}>
            Chốt bí mật
          </button>
        </>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------ Chọn kế sách sau Mưu kế
export function ChoiceModal({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  const pc = view.pendingChoice;
  if (!pc || !me || pc.playerId !== me.id || pc.options.length === 0) return null;
  return (
    <Modal title="Giữ lại một kế sách">
      <div className="strat-list">
        {pc.options.map((st, i) => (
          <div key={i} className={`strat-card t-${STRATS[st].timing}`}>
            <b>{STRATS[st].name}</b>
            <p>{STRATS[st].text}</p>
            <button className="btn small son" onClick={() => act({ type: 'chonKeSach', pid: me.id, strat: st })}>
              Giữ lá này
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------ Giới thiệu trận
export function BattleIntroModal({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  if (view.phase !== 'battleIntro' || !me) return null;
  const def = BATTLES[view.battle.id];
  const ready = view.ready.includes(me.id);
  const req = tacticRequirement(asState(view));
  const waiting = view.players.filter((p) => !view.ready.includes(p.id));
  const enemy = enemyStrength(asState(view)).base;
  const right = def.rightHeroes.filter((h) => view.players.some((p) => p.heroId === h));
  return (
    <div className="scroll-back">
      <div className="scroll">
        <div className="scroll-rod" />
        <div className="scroll-paper">
          <div className="scroll-kicker">
            Trận {view.battleIndex + 1} trong {view.battleOrder.length}, {def.era}
          </div>
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
              <b className="row wrap" style={{ gap: 6 }}>
                {def.tacticName}:
                {RES_KEYS.filter((r) => req[r] > 0).map((r) => (
                  <span key={r} className="res">
                    <Icon name={RES_ICON[r]} size={15} />
                    {req[r]}
                  </span>
                ))}
              </b>
            </div>
          </div>
          <p className="scroll-why">{def.tacticWhy}</p>
          {right.length > 0 && (
            <p className="scroll-right">
              {right.map((h) => (
                <Avatar key={h} heroId={h} size={40} />
              ))}
              <span>
                Đúng người đúng trận: <b>{right.map((h) => HEROES[h].name).join(', ')}</b> được thêm 2 Uy danh nếu có quân ở trận.
              </span>
            </p>
          )}
          <Note note={def.note} />
          <div className="scroll-foot">
            {ready ? (
              <span className="muted">Đang chờ {waiting.map((p) => p.name).join(', ')}</span>
            ) : (
              <button className="btn son big" onClick={() => act({ type: 'ready', pid: me.id })}>
                Xuất trận
              </button>
            )}
          </div>
        </div>
        <div className="scroll-rod" />
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
      const t = setTimeout(() => setShow(true), 3400); // chờ hiệu ứng trên sa bàn
      return () => clearTimeout(t);
    }
  }, [view.phase, view.battleIndex]);
  const r = view.lastResult;
  if (view.phase !== 'battleResult' || !r || !me || !show) return null;
  const def = BATTLES[r.battleId];
  const ready = view.ready.includes(me.id);
  const waiting = view.players.filter((p) => !view.ready.includes(p.id));
  const right = r.rightHeroPlayers.map((pid) => view.players.find((p) => p.id === pid)!).filter(Boolean);
  const last = view.battleIndex + 1 >= view.battleOrder.length;
  return (
    <div className="scroll-back">
      <div className="scroll wide">
        <div className="scroll-rod" />
        <div className="scroll-paper">
          <div className={`result-stamp ${r.won ? 'won' : 'lost'}`}>{r.won ? 'Đại thắng' : 'Thất thủ'}</div>
          <h2 className="scroll-title">{def.name}</h2>
          <p className="center">
            Phe ta {r.power}, quân địch {r.enemy}
            {r.tacticComplete && <span className="ok">. Đã đủ chiến thuật {def.tacticName.toLowerCase()}</span>}
          </p>
          <div className="contrib-wrap">
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
                          <span className="who">
                            <Avatar heroId={p.heroId} size={32} />
                            <b>{p.name}</b>
                          </span>
                        </td>
                        <td>{c.troops}</td>
                        <td>{c.tactic}</td>
                        <td>
                          <b className={c.stars < 0 ? 'bad' : 'ok'}>
                            {c.stars > 0 ? '+' : ''}
                            {c.stars}
                          </b>
                          <div className="muted small">{c.reasons.join('; ')}</div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <section className="suky">
            <h3>Sử ký</h3>
            {!r.won && <p className="muted">Trên bàn chơi phe ta thất thủ. Còn trong lịch sử, sự việc diễn ra như sau.</p>}
            {def.dienBien.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
            <p className="suky-y">
              <b>Ý nghĩa.</b> {def.yNghia}
            </p>
            <Note note={def.note} />
            {right.map((p) => {
              const q = HEROES[p.heroId].quote;
              return q ? (
                <blockquote key={p.id} className="hc-quote unlock">
                  <b>{HEROES[p.heroId].name}</b> đúng người đúng trận, mở khóa lời xưa: {q.text} <Note note={q.note} />
                </blockquote>
              ) : null;
            })}
          </section>
          <div className="scroll-foot">
            {ready ? (
              <span className="muted">Đang chờ {waiting.map((p) => p.name).join(', ')}</span>
            ) : (
              <button className="btn son big" onClick={() => act({ type: 'ready', pid: me.id })}>
                {last ? 'Xem kết quả chung cuộc' : 'Sang trận tiếp'}
              </button>
            )}
          </div>
        </div>
        <div className="scroll-rod" />
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
      <div className="row" style={{ gap: 14, marginBottom: 8 }}>
        <Avatar heroId={winner.heroId} size={88} big />
        <p style={{ fontSize: '1.15em' }}>
          <b>{winner.name}</b> ({HEROES[winner.heroId].name}) có Uy danh cao nhất sau {view.battleOrder.length} trận, cả bàn thắng {view.wonBattles.length} trận.
        </p>
      </div>
      <div className="contrib-wrap">
        <table className="contrib">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Người chơi</th>
              <th>Uy danh</th>
              <th>Vùng lớn</th>
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
                    <span className="who">
                      <Avatar heroId={p.heroId} size={32} />
                      <b>{p.name}</b>
                    </span>
                  </td>
                  <td>{f.base}</td>
                  <td>{f.regions5 ? `+${f.regions5}` : 'không'}</td>
                  <td>
                    {p.longDan}, {f.longDan >= 0 ? '+' : ''}
                    {f.longDan}
                  </td>
                  <td>{f.titles.map((t) => `${TITLES[t.id].name} +${t.star}`).join(', ') || 'không'}</td>
                  <td>
                    <b>{f.total}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">Danh hiệu ván này: {view.titles.map((t) => `${TITLES[t].name} (${TITLES[t].text.toLowerCase()})`).join('; ')}.</p>
      <div className="row center" style={{ marginTop: 14 }}>
        {lobby?.hostId === you && (
          <button className="btn son" onClick={() => send({ t: 'backToLobby' })}>
            Ván mới
          </button>
        )}
        <button className="btn" onClick={leave}>
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
      <HeroCard heroId={h} full />
    </Modal>
  );
}

export function HelpModal() {
  const show = useUi((s) => s.showHelp);
  const set = useUi((s) => s.setHelp);
  if (!show) return null;
  return (
    <Modal title="Luật chơi" onClose={() => set(false)} wide>
      <div style={{ display: 'grid', gap: 10, fontFamily: 'var(--f-read)', lineHeight: 1.65 }}>
        <p>
          Cả bàn cùng đánh một chuỗi trận có thật, rút ngẫu nhiên và xếp theo thứ tự năm. Thắng trận thì ai góp nhiều quân nhất được nhiều Uy danh nhất. Hết ván, ai nhiều Uy danh nhất thắng.
        </p>
        <ol style={{ display: 'grid', gap: 6, paddingLeft: 22, margin: 0 }}>
          <li>Mỗi trận có 3 vòng. Mỗi lượt bạn làm một hành động chính, có thể thêm một kế sách và tuyệt kỹ (mỗi trận một lần).</li>
          <li>
            Khai hoang để xếp ô đất vào lãnh địa. Ô cùng loại nằm liền nhau là một vùng; mỗi vùng cho tài nguyên khi Thu thuế (tối đa 3). Ruộng kề sông được thêm Lúa. Vùng Núi từ 3 ô là thành lũy, thêm 2 Thủ. Vùng Sông từ 3 ô là thủy trại, thêm 1 Võ ở trận có sông.
          </li>
          <li>Chiêu hiền để mua tướng: các lần mua sau rẻ hơn, có thêm Võ, Thủ và Uy danh.</li>
          <li>Mộ binh (1 Lúa đổi 1 Quân) rồi Điều quân ra chiến trường. Góp đủ tài nguyên đúng chiến thuật lịch sử thì Sức địch giảm 30%.</li>
          <li>Hết 3 vòng, lực phe ta (tổng quân cộng Võ của người có quân ở trận) lớn hơn hoặc bằng Sức địch thì thắng. Thua thì mọi người mất 1 Lòng dân, người góp ít nhất mất 2 Uy danh.</li>
          <li>Đầu mỗi trận từ trận thứ hai, triều đình cấp cho mỗi người 1 Quân và 1 Lúa. Sau trận, một phần ba số quân ở trận bị tổn thất.</li>
          <li>Tấn công người khác: Tranh công loại 2 Quân của họ ở trận; Đột kích cướp 3 tài nguyên nhưng mất 1 Lòng dân (trừ khi đánh người dẫn đầu). Hai bên bí mật chọn số Sắt rồi lật cùng lúc.</li>
          <li>Cuối ván cộng Uy danh, danh hiệu, mỗi vùng đất từ 5 ô được 2, Lòng dân từ 8 được 4 và từ 2 trở xuống bị trừ 3. Hòa điểm thì ai được lòng dân hơn thắng.</li>
        </ol>
        <p className="muted">Trận đánh, nhân vật và câu nói đều trích từ Đại Việt sử ký toàn thư (trận năm 1789 trích Khâm định Việt sử thông giám cương mục). Chi tiết dân gian được ghi là tương truyền.</p>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------ Con dấu sự kiện
export function BannerDirector({ view }: { view: GameView }) {
  const show = useUi((s) => s.showBanner);
  const name = (pid?: string) => view.players.find((p) => p.id === pid)?.name ?? '';
  useFxEvents((e) => {
    switch (e.type) {
      case 'battleStart': {
        const def = BATTLES[(e.data?.battleId as keyof typeof BATTLES) ?? view.battle.id];
        show(def.name, def.year, 'var(--cham)');
        break;
      }
      case 'ultimate': {
        const p = view.players.find((x) => x.id === e.playerId);
        if (p) show(HEROES[p.heroId].ultimate.name, `${p.name} dùng tuyệt kỹ`, 'var(--hoe)');
        break;
      }
      case 'attackDeclared':
        show(e.data?.mode === 'tranhCong' ? 'Tranh công' : 'Đột kích', `${name(e.playerId)} đánh ${name(e.targetId)}`, 'var(--son)');
        break;
      case 'combatResolved': {
        const d = e.data as { attackerWon: boolean; atk: number; def: number } | undefined;
        if (d) show(d.attackerWon ? 'Phá được' : 'Giữ vững', `${d.atk} đấu ${d.def}`, d.attackerWon ? 'var(--son)' : 'var(--la)');
        break;
      }
      case 'battleResolved':
        setTimeout(() => show(e.data?.won ? 'Đại thắng' : 'Thất thủ', e.text, e.data?.won ? 'var(--son)' : 'var(--muc-nhat)'), 2200);
        break;
      case 'gameOver':
        show('Chung cuộc', e.text, 'var(--cham)');
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
    <div className="banner" key={banner.at} style={{ ['--bc' as string]: banner.color ?? 'var(--son)' }} role="status">
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
  return (
    <div className="toast" role="status">
      {toast.text}
    </div>
  );
}
