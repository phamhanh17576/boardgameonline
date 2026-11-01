import {
  BATTLES,
  HEROES,
  STRATS,
  battlePower,
  enemyStrength,
  resCap,
  resTotal,
  tacticCommitted,
  tacticRequirement,
  RES_KEYS,
  type GameView,
} from '../../engine';
import { useMe, useStore } from '../store';
import { RES_ICON } from '../theme';
import { asPlayer, asState, ResRow } from './common';
import { useUi, type Panel } from './uiStore';

export function TopBar({ view }: { view: GameView }) {
  const def = BATTLES[view.battle.id];
  const s = asState(view);
  const power = battlePower(s);
  const enemy = enemyStrength(s);
  const req = tacticRequirement(s);
  const got = tacticCommitted(s);
  const pct = Math.min(100, Math.round((power / Math.max(1, enemy.final)) * 100));
  const ui = useUi();
  const leave = useStore((st) => st.leave);
  return (
    <div className="topbar">
      <div className="tb-battle">
        <div className="tb-name">
          {def.name} <span className="muted">· trận {view.battleIndex + 1}/{view.battleOrder.length}</span>
        </div>
        <div className="tb-year">{def.year}</div>
        <div className="tb-round">
          Vòng {Math.min(view.round, view.roundsPerBattle)}/{view.roundsPerBattle}
        </div>
      </div>
      <div className="tb-meter" title="Lực phe ta so với Sức địch">
        <div className="meter-labels">
          <span>⚔️ Phe ta {power}</span>
          <span>
            Sức địch {enemy.final}
            {enemy.tacticComplete && <span className="ok"> (−30% nhờ chiến thuật)</span>}
          </span>
        </div>
        <div className="meter">
          <div className={`meter-fill${power >= enemy.final ? ' win' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="tactic" title={def.tacticWhy}>
          <span className="muted">Chiến thuật · {def.tacticName}:</span>
          {RES_KEYS.filter((r) => req[r] > 0).map((r) => (
            <span key={r} className={`tac-item${got[r] >= req[r] ? ' done' : ''}`}>
              {RES_ICON[r]} {Math.min(got[r], req[r])}/{req[r]}
            </span>
          ))}
        </div>
      </div>
      <div className="tb-buttons">
        <button className="icon-btn" title="Nhìn chiến trường" onClick={() => ui.setFocus(ui.focus === 'battle' ? 'overview' : 'battle')}>
          🌊
        </button>
        <button className="icon-btn" title="Nhật ký" onClick={() => ui.setLog(!ui.showLog)}>
          📖
        </button>
        <button className="icon-btn" title="Luật chơi" onClick={() => ui.setHelp(true)}>
          ?
        </button>
        <button className="icon-btn" title="Rời ván" onClick={() => confirm('Rời ván chơi?') && leave()}>
          ⎋
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
    <div className="players-strip">
      {view.players.map((p) => {
        const h = HEROES[p.heroId];
        const active = view.phase === 'action' && view.turn.playerId === p.id;
        return (
          <button
            key={p.id}
            className={`pchip${active ? ' active' : ''}${p.id === you ? ' me' : ''}`}
            style={{ ['--hc' as string]: h.color }}
            onClick={() => setHero(p.heroId)}
            title={`${p.name} — ${h.name}`}
          >
            <span className="pchip-seal">{h.name.split(' ').slice(-1)[0]}</span>
            <span className="pchip-body">
              <span className="pchip-name">
                {p.name}
                {p.star === maxStar && maxStar > 0 && <span title="Dẫn đầu"> 👑</span>}
              </span>
              <span className="pchip-stats">
                ★{p.star} · ❤️{p.longDan} · 🪖{p.reserve}+{view.battle.troops[p.id] ?? 0} · 📜{p.stratCount} · 📦{resTotal(p.res)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const ACTIONS: { id: Panel | 'thuThue' | 'muuKe'; label: string; icon: string; hint: string }[] = [
  { id: 'khaiHoang', label: 'Khai hoang', icon: '🌱', hint: 'Lấy 2 ô đất đặt vào lãnh địa' },
  { id: 'thuThue', label: 'Thu thuế', icon: '🌾', hint: 'Nhận tài nguyên theo các vùng đất' },
  { id: 'chieuHien', label: 'Chiêu hiền', icon: '🧑‍✈️', hint: 'Mua Tướng phụ' },
  { id: 'moBinh', label: 'Mộ binh', icon: '🪖', hint: '1 Lúa = 1 Quân' },
  { id: 'dieuQuan', label: 'Điều quân', icon: '🚩', hint: 'Đưa quân ra trận, góp chiến thuật' },
  { id: 'tanCong', label: 'Tấn công', icon: '⚔️', hint: 'Tranh công hoặc Đột kích người khác' },
  { id: 'muuKe', label: 'Mưu kế', icon: '📜', hint: 'Rút 2 Kế sách, giữ 1' },
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
    if (id === 'thuThue') {
      act({ type: 'thuThue', pid: me.id });
      return;
    }
    if (id === 'muuKe') {
      act({ type: 'muuKe', pid: me.id });
      return;
    }
    ui.setPanel(ui.panel === id ? null : (id as Panel));
  };

  return (
    <div className={`mybar${myTurn ? ' my-turn' : ''}`} style={{ ['--hc' as string]: hero.color }}>
      <div className="mb-status">
        {myTurn ? (
          <b className="your-turn">{taken ? 'Đã làm hành động chính — dùng Kế sách/Tuyệt kỹ hoặc kết thúc lượt' : 'Lượt của bạn — chọn 1 hành động chính'}</b>
        ) : view.phase === 'combat' ? (
          <span>Đang giao chiến…</span>
        ) : view.phase === 'battleIntro' ? (
          <span>Chuẩn bị xuất trận…</span>
        ) : view.phase === 'battleResult' ? (
          <span>Tổng kết trận…</span>
        ) : view.phase === 'gameOver' ? (
          <span>Ván đã kết thúc</span>
        ) : (
          <span>
            Lượt của <b>{cur?.name}</b> ({cur ? HEROES[cur.heroId].name : ''})
          </span>
        )}
      </div>
      <div className="mb-row">
        <div className="mb-me" onClick={() => ui.setHeroInfo(me.heroId)} title="Xem thẻ anh hùng">
          <span className="pchip-seal big">{hero.name.split(' ').slice(-1)[0]}</span>
          <div>
            <div className="mb-name">{hero.name}</div>
            <div className="mb-stats">
              ★ {me.star} · ❤️ {me.longDan}/10 · ⚔️{hero.vo} 🛡️{hero.thu} 📜{hero.muu}
            </div>
          </div>
        </div>
        <div className="mb-res">
          <ResRow res={me.res} zero />
          <span className="muted small">
            {resTotal(me.res)}/{resCap(asPlayer(me))}
          </span>
        </div>
        <div className="mb-troops" title="Quân trong tay + ở chiến trường">
          🪖 {me.reserve} <span className="muted">trong tay</span> · {atBattle} <span className="muted">ở trận</span>
        </div>
        <div className="mb-strats">
          {(me.strats ?? []).map((st, i) => (
            <span key={i} className={`strat-chip t-${STRATS[st].timing}`} title={STRATS[st].text}>
              📜 {STRATS[st].name}
            </span>
          ))}
          <span className="muted small">
            {(me.strats ?? []).length}/{handLimit}
          </span>
        </div>
      </div>
      <div className="mb-actions">
        {ACTIONS.map((a) => {
          let disabled = !myTurn || taken;
          if (a.id === 'dieuQuan' && extraDQ) disabled = false;
          if (a.id === 'tanCong' && extraAtk) disabled = false;
          if (a.id === 'muuKe' && (me.strats ?? []).length >= handLimit) disabled = true;
          return (
            <button key={a.id} className={`act${ui.panel === a.id ? ' on' : ''}`} disabled={disabled} onClick={() => click(a.id)} title={a.hint}>
              <span className="act-ic">{a.icon}</span>
              <span className="act-label">{a.label}</span>
            </button>
          );
        })}
        <button className={`act special${ui.panel === 'keSach' ? ' on' : ''}`} disabled={!myTurn || view.turn.stratPlayed} onClick={() => ui.setPanel(ui.panel === 'keSach' ? null : 'keSach')}>
          <span className="act-ic">🎴</span>
          <span className="act-label">Kế sách</span>
        </button>
        <button className={`act ult${ui.panel === 'tuyetKy' ? ' on' : ''}`} disabled={!myTurn || me.ultUsedBattle} onClick={() => ui.setPanel(ui.panel === 'tuyetKy' ? null : 'tuyetKy')} title={hero.ultimate.text}>
          <span className="act-ic">✨</span>
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
          <span className="act-ic">⏭</span>
          <span className="act-label">Kết thúc lượt</span>
        </button>
      </div>
    </div>
  );
}

export function LogDrawer({ view }: { view: GameView }) {
  const setLog = useUi((s) => s.setLog);
  return (
    <div className="log-drawer">
      <div className="log-head">
        <b>Nhật ký trận</b>
        <button className="modal-x" onClick={() => setLog(false)}>
          ×
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
    </div>
  );
}
