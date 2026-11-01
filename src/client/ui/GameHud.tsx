import { useLayoutEffect, useRef } from 'react';
import {
  BATTLES,
  HEROES,
  RES_KEYS,
  STRATS,
  battlePower,
  enemyStrength,
  resCap,
  resTotal,
  tacticCommitted,
  tacticRequirement,
  type GameView,
} from '../../engine';
import { useMe, useStore } from '../store';
import { RES_ICON, RES_NAME } from '../theme';
import { asPlayer, asState, Avatar, ResRow, Stat } from './common';
import { Icon, type IconName } from './Icon';
import { useUi, type Panel } from './uiStore';

function Pips({ total, done, now }: { total: number; done: number; now?: number }) {
  return (
    <span className="pips" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < done ? 'done' : i === now ? 'now' : ''} />
      ))}
    </span>
  );
}

export function TopBar({ view }: { view: GameView }) {
  const def = BATTLES[view.battle.id];
  const s = asState(view);
  const power = battlePower(s);
  const enemy = enemyStrength(s);
  const req = tacticRequirement(s);
  const got = tacticCommitted(s);
  const total = Math.max(1, power + enemy.final);
  const ours = Math.round((power / total) * 100);
  const ui = useUi();
  const leave = useStore((st) => st.leave);
  const toast = useStore((st) => st.showToast);
  const armed = useRef(0);
  const onLeave = () => {
    if (Date.now() - armed.current < 3000) leave();
    else {
      armed.current = Date.now();
      toast('Bấm nút rời ván lần nữa để rời.');
    }
  };
  const round = Math.min(view.round, view.roundsPerBattle);
  // ghi chiều cao thanh trên vào biến CSS để dải người chơi (điện thoại) nằm ngay bên dưới
  const barRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--tb-h', `${Math.ceil(el.getBoundingClientRect().height)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="topbar" ref={barRef}>
      <section className="sheet tb-battle" aria-label="Trận hiện tại">
        <div className="tb-name">{def.name}</div>
        <div className="tb-year">{def.year}</div>
        <div className="tb-progress">
          <span>
            Trận {view.battleIndex + 1}/{view.battleOrder.length}
          </span>
          <Pips total={view.battleOrder.length} done={view.battleIndex} now={view.battleIndex} />
          <span>Vòng {round}/{view.roundsPerBattle}</span>
          <Pips total={view.roundsPerBattle} done={round - 1} now={round - 1} />
        </div>
      </section>
      <section className="sheet tb-meter" aria-label="So sánh lực lượng">
        <div className="meter-labels">
          <span className="ours">Phe ta {power}</span>
          <span className="meter-state">{power >= enemy.final ? 'Đủ sức thắng' : `Còn thiếu ${enemy.final - power}`}</span>
          <span className="theirs">Quân địch {enemy.final}</span>
        </div>
        <div className="meter" role="meter" aria-valuenow={power} aria-valuemin={0} aria-valuemax={enemy.final}>
          <div className="meter-fill" style={{ width: `${ours}%` }} />
          <div className="meter-mark" style={{ left: '50%' }} />
        </div>
        <div className="tactic" title={def.tacticWhy}>
          <span className="muted">{def.tacticName}</span>
          {RES_KEYS.filter((r) => req[r] > 0).map((r) => (
            <span key={r} className={`tac-item${got[r] >= req[r] ? ' done' : ''}`} title={RES_NAME[r]}>
              <Icon name={RES_ICON[r]} size={14} />
              {Math.min(got[r], req[r])}/{req[r]}
            </span>
          ))}
          {enemy.tacticComplete && <span className="ok">giảm 30% sức địch</span>}
        </div>
      </section>
      <div className="tb-buttons">
        <button className="icon-btn" title="Nhìn chiến trường" aria-label="Nhìn chiến trường" onClick={() => ui.setFocus(ui.focus === 'battle' ? 'overview' : 'battle')}>
          <Icon name="chienTruong" />
        </button>
        <button className="icon-btn" title="Nhật ký" aria-label="Nhật ký" onClick={() => ui.setLog(!ui.showLog)}>
          <Icon name="sach" />
        </button>
        <button className="icon-btn" title="Luật chơi" aria-label="Luật chơi" onClick={() => ui.setHelp(true)}>
          <Icon name="hoi" />
        </button>
        <button className="icon-btn" title="Rời ván" aria-label="Rời ván" onClick={onLeave}>
          <Icon name="roi" />
        </button>
      </div>
    </div>
  );
}

export function PlayersStrip({ view }: { view: GameView }) {
  const you = useStore((s) => s.you);
  const setHero = useUi((s) => s.setHeroInfo);
  const maxStar = Math.max(...view.players.map((p) => p.star));
  return (
    <div className="players-strip" aria-label="Người chơi">
      {view.players.map((p) => {
        const active = view.phase === 'action' && view.turn.playerId === p.id;
        const lead = p.star === maxStar && maxStar > 0;
        return (
          <button key={p.id} className={`pchip${active ? ' active' : ''}`} onClick={() => setHero(p.heroId)} title={`${p.name}: ${HEROES[p.heroId].name}`}>
            <Avatar heroId={p.heroId} size={48} />
            <span style={{ minWidth: 0 }}>
              <span className="pchip-name">
                {p.name}
                {p.id === you && <span className="muted">(bạn)</span>}
                {lead && <Icon name="chienCong" size={14} className="lead" title="Dẫn đầu" />}
              </span>
              <span className="pchip-stats">
                <Stat icon="star" value={p.star} title="Uy danh" />
                <Stat icon="dan" value={p.longDan} title="Lòng dân" />
                <Stat icon="quan" value={`${p.reserve}+${view.battle.troops[p.id] ?? 0}`} title="Quân trong tay + ở chiến trường" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const ACTIONS: { id: Panel | 'thuThue' | 'muuKe'; label: string; icon: IconName; hint: string }[] = [
  { id: 'khaiHoang', label: 'Khai hoang', icon: 'khaiHoang', hint: 'Lấy 2 ô đất đặt vào lãnh địa' },
  { id: 'thuThue', label: 'Thu thuế', icon: 'thuThue', hint: 'Nhận tài nguyên từ các vùng đất' },
  { id: 'chieuHien', label: 'Chiêu hiền', icon: 'chieuHien', hint: 'Mua tướng phụ' },
  { id: 'moBinh', label: 'Mộ binh', icon: 'moBinh', hint: '1 Lúa đổi 1 Quân' },
  { id: 'dieuQuan', label: 'Điều quân', icon: 'dieuQuan', hint: 'Đưa quân ra trận, góp chiến thuật' },
  { id: 'tanCong', label: 'Tấn công', icon: 'tanCong', hint: 'Tranh công hoặc đột kích người khác' },
  { id: 'muuKe', label: 'Mưu kế', icon: 'muuKe', hint: 'Rút 2 kế sách, giữ 1' },
];

export function MyBar({ view }: { view: GameView }) {
  const me = useMe();
  const act = useStore((s) => s.act);
  const ui = useUi();
  if (!me) return null;
  const hero = HEROES[me.heroId];
  const myTurn = view.phase === 'action' && view.turn.playerId === me.id;
  const taken = view.turn.actionTaken;
  const extraDQ = myTurn && view.turn.extraDieuQuan > 0;
  const extraAtk = myTurn && view.turn.extraAttack > 0;
  const cur = view.players.find((p) => p.id === view.turn.playerId);
  const atBattle = view.battle.troops[me.id] ?? 0;
  const handLimit = me.heroId === 'tranQuocToan' ? 1 : hero.muu;

  const click = (id: (typeof ACTIONS)[number]['id']) => {
    if (id === 'thuThue') return act({ type: 'thuThue', pid: me.id });
    if (id === 'muuKe') return act({ type: 'muuKe', pid: me.id });
    ui.setPanel(ui.panel === id ? null : (id as Panel));
  };

  let status;
  if (myTurn) status = <span className="turn">{taken ? 'Đã làm hành động chính. Dùng kế sách, tuyệt kỹ hoặc kết thúc lượt.' : 'Lượt của bạn: chọn một hành động chính.'}</span>;
  else if (view.phase === 'combat') status = 'Đang giao chiến…';
  else if (view.phase === 'battleIntro') status = 'Chuẩn bị xuất trận…';
  else if (view.phase === 'battleResult') status = 'Tổng kết trận…';
  else if (view.phase === 'gameOver') status = 'Ván đã kết thúc.';
  else
    status = (
      <>
        Lượt của {cur?.name} ({cur ? HEROES[cur.heroId].name : ''})
      </>
    );

  return (
    <section className={`sheet mybar${myTurn ? ' my-turn' : ''}`} aria-label="Bảng của bạn">
      <button className="mb-hero" onClick={() => ui.setHeroInfo(me.heroId)} title="Xem thẻ anh hùng">
        <Avatar heroId={me.heroId} size={76} />
        <span>
          <span className="mb-name">{hero.name}</span>
          <span className="mb-stats">
            <Stat icon="star" value={me.star} title="Uy danh" />
            <Stat icon="dan" value={`${me.longDan}/10`} title="Lòng dân" />
            <Stat icon="vo" value={hero.vo} title="Võ" />
            <Stat icon="thu" value={hero.thu} title="Thủ" />
          </span>
        </span>
      </button>
      <div className="mb-main">
        <div className="mb-status">{status}</div>
        <div className="mb-row">
          <ResRow res={me.res} zero />
          <span className="muted small" title="Số tài nguyên tối đa được giữ">
            {resTotal(me.res)}/{resCap(asPlayer(me))}
          </span>
          <span className="mb-troops" title="Quân trong tay và ở chiến trường">
            <Icon name="quan" size={17} /> {me.reserve} trong tay, {atBattle} ở trận
          </span>
          <span className="mb-strats">
            {(me.strats ?? []).map((st, i) => (
              <span key={i} className="strat-chip" title={STRATS[st].text}>
                {STRATS[st].name}
              </span>
            ))}
            <span className="muted small">
              kế sách {(me.strats ?? []).length}/{handLimit}
            </span>
          </span>
        </div>
        <div className="mb-actions">
          {ACTIONS.map((a) => {
            let disabled = !myTurn || taken;
            if (a.id === 'dieuQuan' && extraDQ) disabled = false;
            if (a.id === 'tanCong' && extraAtk) disabled = false;
            if (a.id === 'muuKe' && (me.strats ?? []).length >= handLimit) disabled = true;
            return (
              <button key={a.id} className={`act${ui.panel === a.id ? ' on' : ''}`} disabled={disabled} onClick={() => click(a.id)} title={a.hint}>
                <Icon name={a.icon} />
                <span className="act-label">{a.label}</span>
              </button>
            );
          })}
          <button className={`act${ui.panel === 'keSach' ? ' on' : ''}`} disabled={!myTurn || view.turn.stratPlayed} onClick={() => ui.setPanel(ui.panel === 'keSach' ? null : 'keSach')}>
            <Icon name="keSach" />
            <span className="act-label">Kế sách</span>
          </button>
          <button className={`act ult${ui.panel === 'tuyetKy' ? ' on' : ''}`} disabled={!myTurn || me.ultUsedBattle} onClick={() => ui.setPanel(ui.panel === 'tuyetKy' ? null : 'tuyetKy')} title={hero.ultimate.text}>
            <Icon name="tuyetKy" />
            <span className="act-label">{me.ultUsedBattle ? 'Đã dùng' : 'Tuyệt kỹ'}</span>
          </button>
          <button
            className="act end"
            disabled={!myTurn || !taken}
            onClick={() => {
              ui.setPanel(null);
              act({ type: 'ketThucLuot', pid: me.id });
            }}
          >
            <Icon name="ketThuc" />
            <span className="act-label">Kết thúc lượt</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export function LogDrawer({ view }: { view: GameView }) {
  const setLog = useUi((s) => s.setLog);
  return (
    <aside className="sheet log-drawer" aria-label="Nhật ký trận">
      <div className="log-head">
        <h3>Nhật ký</h3>
        <button className="x-btn" onClick={() => setLog(false)} aria-label="Đóng nhật ký">
          <Icon name="dong" />
        </button>
      </div>
      <ol>
        {view.events
          .slice()
          .reverse()
          .map((e) => (
            <li key={e.seq} className={`log-${e.type}`}>
              {e.text}
            </li>
          ))}
      </ol>
    </aside>
  );
}
