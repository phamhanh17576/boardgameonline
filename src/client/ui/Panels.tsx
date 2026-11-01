import { useMemo, useState } from 'react';
import {
  GENERALS,
  HEROES,
  MAX_DIEU_QUAN,
  RES_KEYS,
  STRATS,
  allCells,
  canAfford,
  combatBases,
  computeIncome,
  generalCost,
  hexKey,
  moBinhBonus,
  moBinhMax,
  neighbors,
  parseKey,
  tacticRemaining,
  type AttackMode,
  type GameView,
  type Resources,
  type Terrain,
} from '../../engine';
import { useMe, useStore } from '../store';
import { RES_ICON, RES_NAME, TERRAIN_COLOR, TERRAIN_ICON, TERRAIN_NAME } from '../theme';
import { asPlayer, asState, Note, ResRow, Stepper } from './common';
import { useUi } from './uiStore';

export function PanelHost({ view }: { view: GameView }) {
  const panel = useUi((s) => s.panel);
  const setPanel = useUi((s) => s.setPanel);
  const me = useMe();
  if (!panel || !me || panel === 'players') return null;
  const titles: Record<string, string> = {
    khaiHoang: '🌱 Khai hoang',
    chieuHien: '🧑‍✈️ Chiêu hiền',
    moBinh: '🪖 Mộ binh',
    dieuQuan: '🚩 Điều quân ra trận',
    tanCong: '⚔️ Tấn công',
    keSach: '🎴 Dùng Kế sách',
    tuyetKy: '✨ Tuyệt kỹ',
  };
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{titles[panel]}</h3>
        <button className="modal-x" onClick={() => setPanel(null)} aria-label="Đóng">
          ×
        </button>
      </div>
      <div className="panel-body">
        {panel === 'khaiHoang' && <KhaiHoang view={view} />}
        {panel === 'chieuHien' && <ChieuHien view={view} />}
        {panel === 'moBinh' && <MoBinh />}
        {panel === 'dieuQuan' && <DieuQuan view={view} />}
        {panel === 'tanCong' && <TanCong view={view} />}
        {panel === 'keSach' && <KeSach />}
        {panel === 'tuyetKy' && <TuyetKy view={view} />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Khai hoang
function KhaiHoang({ view }: { view: GameView }) {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const pick = useUi((s) => s.landPick);
  const setPick = useUi((s) => s.setLandPick);
  const setPanel = useUi((s) => s.setPanel);
  const row = view.landRow;
  const start = pick?.start ?? null;
  const cells = pick?.cells ?? [];
  const terr = me.territory;
  const full = Object.keys(terr).length >= 18;

  const placeable = useMemo(() => {
    const tmp: Record<string, Terrain> = { ...terr };
    cells.forEach((c, i) => start !== null && (tmp[c] = row[start + i]));
    return new Set(allCells().filter((k) => !tmp[k] && neighbors(k).some((n) => tmp[n])));
  }, [terr, cells, start, row]);

  const choosePair = (i: number) => setPick({ start: i, cells: [] });
  const clickCell = (k: string) => {
    if (start === null) return;
    if (cells.includes(k)) return setPick({ start, cells: cells.filter((c) => c !== k) });
    if (cells.length >= 2 || !placeable.has(k)) return;
    setPick({ start, cells: [...cells, k] });
  };
  const confirm = () => {
    if (start === null || cells.length !== 2) return;
    act({ type: 'khaiHoang', pid: me.id, start, cells: [cells[0], cells[1]] });
    setPick(null);
    setPanel(null);
  };

  return (
    <div>
      <p className="hint">1) Chọn 2 ô liền nhau trong Chợ đất (ô đầu hàng giá 1🪙). 2) Bấm vào 2 ô trống kề lãnh địa để đặt.</p>
      <div className="land-row">
        {row.map((t, i) => {
          const inPair = start !== null && (i === start || i === start + 1);
          return (
            <button
              key={i}
              className={`land-tile${inPair ? ' sel' : ''}`}
              style={{ ['--tc' as string]: TERRAIN_COLOR[t] }}
              onClick={() => i < row.length - 1 && choosePair(i)}
              title={i === 0 ? 'Ô đầu hàng: giá 1 Tiền' : TERRAIN_NAME[t]}
            >
              <span>{TERRAIN_ICON[t]}</span>
              <small>{TERRAIN_NAME[t]}</small>
              {i === 0 && <em>1🪙</em>}
            </button>
          );
        })}
      </div>
      {full && <p className="warn">Lãnh địa gần đầy, không còn chỗ đặt 2 ô.</p>}
      {start !== null && (
        <>
          <HexMap territory={terr} pending={cells.map((c, i) => [c, row[start + i]] as [string, Terrain])} placeable={placeable} onClick={clickCell} />
          <div className="panel-foot">
            <span className="muted">
              Đặt: {cells.length}/2 · {TERRAIN_NAME[row[start]]} + {TERRAIN_NAME[row[start + 1]]}
            </span>
            <button className="btn gold" disabled={cells.length !== 2 || (start === 0 && me.res.tien < 1)} onClick={confirm}>
              Khai hoang
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function HexMap({
  territory,
  pending = [],
  placeable,
  onClick,
  size = 22,
}: {
  territory: Record<string, Terrain>;
  pending?: [string, Terrain][];
  placeable?: Set<string>;
  onClick?: (k: string) => void;
  size?: number;
}) {
  const pts = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${cx + size * 0.95 * Math.cos(a)},${cy + size * 0.95 * Math.sin(a)}`;
    }).join(' ');
  const pend = new Map(pending);
  const w = size * Math.sqrt(3) * 5.4;
  const h = size * 1.5 * 4 + size * 2.4;
  return (
    <svg className="hexmap" viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} width="100%" style={{ maxWidth: 340 }}>
      {allCells().map((k) => {
        const [q, r] = parseKey(k);
        const cx = size * Math.sqrt(3) * (q + r / 2);
        const cy = size * 1.5 * r;
        const t = territory[k] ?? pend.get(k);
        const can = placeable?.has(k);
        return (
          <g key={k} onClick={() => onClick?.(k)} style={{ cursor: onClick && (can || pend.has(k)) ? 'pointer' : 'default' }}>
            <polygon
              points={pts(cx, cy)}
              fill={t ? TERRAIN_COLOR[t] : can ? 'rgba(246,210,122,0.18)' : '#2a0c09'}
              stroke={pend.has(k) ? '#fff6d0' : can ? '#f6d27a' : '#5a2a1a'}
              strokeWidth={pend.has(k) ? 3 : can ? 2 : 1}
              strokeDasharray={can && !t ? '4 3' : undefined}
              opacity={pend.has(k) ? 0.85 : 1}
            />
            {t && (
              <text x={cx} y={cy + 5} textAnchor="middle" fontSize={size * 0.7}>
                {TERRAIN_ICON[t]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------ Chiêu hiền
function ChieuHien({ view }: { view: GameView }) {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const p = asPlayer(me);
  const Card = ({ id, reserved = false }: { id: string; reserved?: boolean }) => {
    const g = GENERALS[id];
    const cost = generalCost(p, id);
    const ok = canAfford(p, cost);
    return (
      <div className={`gen-card tier-${g.tier}${ok ? ' ok' : ''}`}>
        <div className="gc-top">
          <b>{g.name}</b>
          <span className="gc-star">{g.star > 0 ? `★${g.star}` : ''}</span>
        </div>
        <div className="gc-stats">
          ⚔️{g.vo} 🛡️{g.thu} {g.bonus && <span title="Giảm giá vĩnh viễn">· giảm {RES_ICON[g.bonus]}</span>}
        </div>
        {g.abilityText && <div className="gc-ab">{g.abilityText}</div>}
        <div className="gc-bio">{g.bio}</div>
        <Note note={g.note} />
        <div className="gc-cost">
          Giá: <ResRow res={cost} compact />
          {RES_KEYS.some((r) => (g.cost[r] ?? 0) > cost[r]) && <span className="muted small"> (đã giảm)</span>}
        </div>
        <div className="gc-btns">
          <button
            className="btn small gold"
            disabled={!ok}
            onClick={() => {
              act({ type: 'chieuHien', pid: me.id, generalId: id });
              setPanel(null);
            }}
          >
            Chiêu mộ
          </button>
          {!reserved && (
            <button
              className="btn small ghost"
              disabled={me.reserved.length >= 2 || me.res.tien < 1}
              onClick={() => {
                act({ type: 'giuCho', pid: me.id, generalId: id });
                setPanel(null);
              }}
              title="Trả 1 Tiền để giữ tướng này, mua sau"
            >
              Giữ chỗ (1🪙)
            </button>
          )}
        </div>
      </div>
    );
  };
  return (
    <div>
      <p className="hint">Mỗi tướng cho giảm giá vĩnh viễn 1 loại tài nguyên, cộng Võ/Thủ cho trận đánh và giao chiến.</p>
      {me.reserved.length > 0 && (
        <>
          <h4>Đang giữ chỗ</h4>
          <div className="gen-grid">
            {me.reserved.map((id) => (
              <Card key={id} id={id} reserved />
            ))}
          </div>
        </>
      )}
      {([1, 2, 3] as const).map((tier) => (
        <div key={tier}>
          <h4>
            Tầng {'I'.repeat(tier)} <span className="muted small">· còn {view.generalDeckCounts[tier]} thẻ úp</span>
          </h4>
          <div className="gen-grid">
            {view.market[tier].map((id, i) => (
              <Card key={`${id}-${i}`} id={id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ Mộ binh
function MoBinh() {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const p = asPlayer(me);
  const max = Math.min(moBinhMax(p), me.res.lua);
  const [n, setN] = useState(Math.max(1, Math.min(2, max)));
  const bonus = moBinhBonus(p);
  return (
    <div>
      <p className="hint">Mỗi Quân tốn 1 🌾 Lúa. Tối đa {moBinhMax(p)} lần mộ mỗi lượt.</p>
      {max < 1 ? (
        <p className="warn">Bạn không có Lúa.</p>
      ) : (
        <>
          <Stepper value={Math.min(n, max)} min={1} max={max} onChange={setN} label="Số Lúa bỏ ra" />
          <p>
            Nhận được: <b>{Math.min(n, max) + bonus} Quân</b> {bonus > 0 && <span className="ok">(+{bonus} từ kỹ năng / tướng)</span>}
          </p>
          <button
            className="btn gold"
            onClick={() => {
              act({ type: 'moBinh', pid: me.id, count: Math.min(n, max) });
              setPanel(null);
            }}
          >
            Mộ binh
          </button>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Điều quân
function DieuQuan({ view }: { view: GameView }) {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const remaining = tacticRemaining(asState(view));
  const maxT = Math.min(MAX_DIEU_QUAN, me.reserve);
  const [troops, setTroops] = useState(maxT);
  const [tac, setTac] = useState<Resources>({ lua: 0, go: 0, sat: 0, tien: 0 });
  const needed = RES_KEYS.filter((r) => remaining[r] > 0);
  const total = Math.min(troops, maxT) + RES_KEYS.reduce((s, r) => s + tac[r], 0);
  return (
    <div>
      <p className="hint">Đưa tối đa {MAX_DIEU_QUAN} Quân ra chiến trường. Góp tài nguyên đúng chiến thuật lịch sử để giảm 30% Sức địch, và được +1★ "hiểu binh pháp" khi thắng.</p>
      <Stepper value={Math.min(troops, maxT)} min={0} max={maxT} onChange={setTroops} label="🪖 Quân ra trận" />
      {needed.length > 0 ? (
        <>
          <h4>Góp Chiến thuật</h4>
          {needed.map((r) => (
            <Stepper
              key={r}
              value={tac[r]}
              min={0}
              max={Math.min(remaining[r], me.res[r])}
              onChange={(v) => setTac({ ...tac, [r]: v })}
              label={`${RES_ICON[r]} ${RES_NAME[r]} (còn cần ${remaining[r]})`}
            />
          ))}
        </>
      ) : (
        <p className="ok">Chiến thuật đã đủ!</p>
      )}
      <button
        className="btn gold"
        disabled={total === 0}
        onClick={() => {
          const t: Partial<Resources> = {};
          for (const r of RES_KEYS) if (tac[r] > 0) t[r] = tac[r];
          act({ type: 'dieuQuan', pid: me.id, troops: Math.min(troops, maxT), tactic: t });
          setPanel(null);
        }}
      >
        Điều quân
      </button>
    </div>
  );
}

// ------------------------------------------------------------ Tấn công
function TanCong({ view }: { view: GameView }) {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const [mode, setMode] = useState<AttackMode>(me.heroId === 'tranHungDao' ? 'dotKich' : 'tranhCong');
  const s = asState(view);
  const others = view.players.filter((p) => p.id !== me.id);
  const leader = Math.max(...view.players.map((p) => p.star));
  return (
    <div>
      <p className="hint">
        Tốn 1 🌾. Hai bên <b>bí mật bỏ Sắt</b> rồi lật cùng lúc; lực lớn hơn hẳn thì thắng. Sắt đã bỏ thì mất.
      </p>
      <div className="seg">
        <button className={mode === 'tranhCong' ? 'on' : ''} onClick={() => setMode('tranhCong')} disabled={me.heroId === 'tranHungDao'}>
          Tranh công
          <small>Loại 2 Quân của họ ở chiến trường</small>
        </button>
        <button className={mode === 'dotKich' ? 'on' : ''} onClick={() => setMode('dotKich')}>
          Đột kích
          <small>Cướp 3 tài nguyên · −1 Lòng dân (trừ khi đánh người dẫn đầu)</small>
        </button>
      </div>
      {me.res.lua < 1 && <p className="warn">Cần 1 Lúa để xuất quân.</p>}
      <div className="target-list">
        {others.map((p) => {
          const { atkBase, defBase, usesMuu } = combatBases(s, { attackerId: me.id, defenderId: p.id, mode, bids: {}, strats: {} });
          const troops = view.battle.troops[p.id] ?? 0;
          let why = '';
          if (me.prevTurnTargets.includes(p.id)) why = 'Vừa đánh lượt trước';
          else if (mode === 'tranhCong' && troops <= 0) why = 'Không có quân ở trận';
          else if (mode === 'dotKich' && me.longDan <= 0) why = 'Lòng dân bằng 0';
          return (
            <div key={p.id} className="target" style={{ ['--hc' as string]: HEROES[p.heroId].color }}>
              <div>
                <b>{p.name}</b> <span className="muted">{HEROES[p.heroId].name}</span>
                {p.star === leader && <span className="tag">Dẫn đầu</span>}
                <div className="small">
                  Lực bạn {atkBase} + {usesMuu ? '🪙' : '⛏️'} · Thủ họ {defBase} + ⛏️ (họ có {p.res.sat}⛏️) · 🪖 ở trận: {troops}
                </div>
              </div>
              <button
                className="btn small gold"
                disabled={!!why || me.res.lua < 1}
                title={why}
                onClick={() => {
                  act({ type: 'tanCong', pid: me.id, targetId: p.id, mode });
                  setPanel(null);
                }}
              >
                {why || 'Xuất quân'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Kế sách
function KeSach() {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const hand = me.strats ?? [];
  return (
    <div>
      <p className="hint">Mỗi lượt dùng 1 Kế sách loại "dùng ngay". Kế sách công/thủ được chọn khi giao chiến.</p>
      {hand.length === 0 && <p className="muted">Bạn chưa có Kế sách. Dùng hành động Mưu kế để rút.</p>}
      <div className="strat-list">
        {hand.map((st, i) => {
          const d = STRATS[st];
          return (
            <div key={i} className={`strat-card t-${d.timing}`}>
              <b>{d.name}</b>
              <span className="tag">{d.timing === 'instant' ? 'Dùng ngay' : d.timing === 'attack' ? 'Khi tấn công' : 'Khi bị tấn công'}</span>
              <p>{d.text}</p>
              {d.timing === 'instant' && (
                <button
                  className="btn small gold"
                  onClick={() => {
                    act({ type: 'keSach', pid: me.id, strat: st });
                    setPanel(null);
                  }}
                >
                  Dùng
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Tuyệt kỹ
function TuyetKy({ view }: { view: GameView }) {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const h = HEROES[me.heroId];
  const [target, setTarget] = useState<string>('');
  const fire = (option?: 'a' | 'b') => {
    act({ type: 'tuyetKy', pid: me.id, option, targetId: option === 'b' ? target : undefined });
    setPanel(null);
  };
  return (
    <div>
      <div className="ult-box" style={{ ['--hc' as string]: h.color }}>
        <h4>{h.ultimate.name}</h4>
        <p>{h.ultimate.text}</p>
        <p className="skill-why">
          <span className="why-label">Vì sao:</span> {h.ultimate.why} <Note note={h.ultimate.note} />
        </p>
      </div>
      <p className="muted small">Dùng 1 lần mỗi trận (bản thử).</p>
      {h.ultimate.options ? (
        <div className="ult-options">
          <button className="btn gold" onClick={() => fire('a')}>
            {h.ultimate.options[0].label}
          </button>
          <div className="row">
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">— chọn người —</option>
              {view.players
                .filter((p) => p.id !== me.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({Object.values(p.res).reduce((a, b) => a + b, 0)} tài nguyên)
                  </option>
                ))}
            </select>
            <button className="btn" disabled={!target} onClick={() => fire('b')}>
              {h.ultimate.options[1].label}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn gold big" onClick={() => fire()}>
          Dùng Tuyệt kỹ
        </button>
      )}
    </div>
  );
}

export function IncomePreview() {
  const me = useMe();
  if (!me) return null;
  return <ResRow res={computeIncome(asPlayer(me))} compact />;
}

export { hexKey };
