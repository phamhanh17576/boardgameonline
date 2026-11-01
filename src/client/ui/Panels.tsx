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
  generalCost,
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
import { INK, RES_ICON, RES_NAME, TERRAIN_COLOR, TERRAIN_ICON, TERRAIN_NAME } from '../theme';
import { asPlayer, asState, Avatar, Note, ResRow, Stat, Stepper } from './common';
import { Icon, type IconName } from './Icon';
import { useUi } from './uiStore';

const TITLES: Record<string, [string, IconName]> = {
  khaiHoang: ['Khai hoang', 'khaiHoang'],
  chieuHien: ['Chiêu hiền', 'chieuHien'],
  moBinh: ['Mộ binh', 'moBinh'],
  dieuQuan: ['Điều quân ra trận', 'dieuQuan'],
  tanCong: ['Tấn công', 'tanCong'],
  keSach: ['Dùng kế sách', 'keSach'],
  tuyetKy: ['Tuyệt kỹ', 'tuyetKy'],
};

export function PanelHost({ view }: { view: GameView }) {
  const panel = useUi((s) => s.panel);
  const setPanel = useUi((s) => s.setPanel);
  const me = useMe();
  if (!panel || !me || panel === 'players') return null;
  const [title, icon] = TITLES[panel];
  return (
    <aside className="sheet panel" aria-label={title}>
      <div className="panel-head">
        <h3>
          <Icon name={icon} /> {title}
        </h3>
        <button className="x-btn" onClick={() => setPanel(null)} aria-label="Đóng">
          <Icon name="dong" />
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
    </aside>
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
    <>
      <p className="hint">Chọn 2 ô liền nhau ở chợ đất. Ô đầu hàng giá 1 Tiền. Sau đó bấm 2 ô trống có viền chấm trên bản đồ lãnh địa.</p>
      <div className="land-row">
        {row.map((t, i) => {
          const inPair = start !== null && (i === start || i === start + 1);
          return (
            <button
              key={i}
              className={`land-tile${inPair ? ' sel' : ''}`}
              style={{ ['--tc' as string]: TERRAIN_COLOR[t] }}
              onClick={() => i < row.length - 1 && setPick({ start: i, cells: [] })}
              title={i === 0 ? `${TERRAIN_NAME[t]}, giá 1 Tiền` : TERRAIN_NAME[t]}
              aria-pressed={inPair}
            >
              <span>
                <Icon name={TERRAIN_ICON[t]} size={18} />
                {TERRAIN_NAME[t]}
                {i === 0 && <em>1 Tiền</em>}
              </span>
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
              Đã đặt {cells.length}/2: {TERRAIN_NAME[row[start]]} và {TERRAIN_NAME[row[start + 1]]}
            </span>
            <button className="btn son" disabled={cells.length !== 2 || (start === 0 && me.res.tien < 1)} onClick={confirm}>
              Khai hoang
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function HexMap({
  territory,
  pending = [],
  placeable,
  onClick,
  size = 23,
}: {
  territory: Record<string, Terrain>;
  pending?: [string, Terrain][];
  placeable?: Set<string>;
  onClick?: (k: string) => void;
  size?: number;
}) {
  const pts = (cx: number, cy: number, s = 0.94) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${cx + size * s * Math.cos(a)},${cy + size * s * Math.sin(a)}`;
    }).join(' ');
  const pend = new Map(pending);
  const w = size * Math.sqrt(3) * 5.4;
  const h = size * 1.5 * 4 + size * 2.4;
  return (
    <svg className="hexmap" viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} width="100%" style={{ maxWidth: 340 }} role="group" aria-label="Bản đồ lãnh địa">
      {allCells().map((k) => {
        const [q, r] = parseKey(k);
        const cx = size * Math.sqrt(3) * (q + r / 2);
        const cy = size * 1.5 * r;
        const t = territory[k] ?? pend.get(k);
        const can = placeable?.has(k);
        const isPend = pend.has(k);
        return (
          <g key={k} onClick={() => onClick?.(k)} style={{ cursor: onClick && (can || isPend) ? 'pointer' : 'default' }}>
            <polygon
              points={pts(cx, cy)}
              fill={t ? TERRAIN_COLOR[t] : can ? '#fff6dc' : '#d6c39b'}
              stroke={INK}
              strokeWidth={isPend ? 3.5 : can ? 2 : 1.5}
              strokeDasharray={can && !t ? '4 3' : undefined}
            />
            {isPend && <polygon points={pts(cx, cy, 0.62)} fill="none" stroke="#f6efdf" strokeWidth={2.5} />}
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
      <div className={`gen-card tier-${g.tier}${ok ? '' : ' cant'}`}>
        <div className="gc-top">
          <b>{g.name}</b>
          {g.star > 0 && <Stat icon="star" value={g.star} title="Uy danh" />}
        </div>
        <div className="gc-stats">
          <Stat icon="vo" value={g.vo} title="Võ" />
          <Stat icon="thu" value={g.thu} title="Thủ" />
          {g.bonus && (
            <span className="muted" title="Giảm giá vĩnh viễn khi chiêu mộ">
              giảm <Icon name={RES_ICON[g.bonus]} size={14} />
            </span>
          )}
        </div>
        {g.abilityText && <div className="gc-ab">{g.abilityText}</div>}
        <div className="gc-bio">{g.bio}</div>
        <Note note={g.note} />
        <div className="gc-cost">
          Giá <ResRow res={cost} compact />
          {RES_KEYS.some((r) => (g.cost[r] ?? 0) > cost[r]) && <span className="muted small">(đã giảm)</span>}
        </div>
        <div className="gc-btns">
          <button
            className="btn small son"
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
              className="btn small"
              disabled={me.reserved.length >= 2 || me.res.tien < 1}
              onClick={() => {
                act({ type: 'giuCho', pid: me.id, generalId: id });
                setPanel(null);
              }}
              title="Trả 1 Tiền để giữ tướng này, mua sau"
            >
              Giữ chỗ, 1 Tiền
            </button>
          )}
        </div>
      </div>
    );
  };
  return (
    <>
      <p className="hint">Mỗi tướng giúp các lần chiêu mộ sau rẻ hơn một loại tài nguyên, và cộng Võ, Thủ cho trận đánh lẫn giao chiến.</p>
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
        <div key={tier} style={{ display: 'grid', gap: 8 }}>
          <h4>
            Tầng {['I', 'II', 'III'][tier - 1]} <span className="muted small">còn {view.generalDeckCounts[tier]} thẻ úp</span>
          </h4>
          <div className="gen-grid">
            {view.market[tier].map((id, i) => (
              <Card key={`${id}-${i}`} id={id} />
            ))}
          </div>
        </div>
      ))}
    </>
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
    <>
      <p className="hint">Mỗi Quân tốn 1 Lúa. Mỗi lần mộ tối đa {moBinhMax(p)} Lúa.</p>
      {max < 1 ? (
        <p className="warn">Bạn chưa có Lúa. Hãy Thu thuế trước.</p>
      ) : (
        <>
          <Stepper value={Math.min(n, max)} min={1} max={max} onChange={setN} label={<><Icon name="lua" size={17} /> Số Lúa bỏ ra</>} />
          <p>
            Nhận được <b>{Math.min(n, max) + bonus} Quân</b>
            {bonus > 0 && <span className="ok"> (thêm {bonus} nhờ kỹ năng hoặc tướng)</span>}
          </p>
          <button
            className="btn son"
            onClick={() => {
              act({ type: 'moBinh', pid: me.id, count: Math.min(n, max) });
              setPanel(null);
            }}
          >
            Mộ binh
          </button>
        </>
      )}
    </>
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
    <>
      <p className="hint">Đưa tối đa {MAX_DIEU_QUAN} Quân ra chiến trường. Góp đủ tài nguyên theo chiến thuật lịch sử thì Sức địch giảm 30%, và người góp được thêm Uy danh khi thắng.</p>
      <Stepper value={Math.min(troops, maxT)} min={0} max={maxT} onChange={setTroops} label={<><Icon name="quan" size={17} /> Quân ra trận</>} />
      {needed.length > 0 ? (
        <>
          <h4>Góp chiến thuật</h4>
          {needed.map((r) => (
            <Stepper
              key={r}
              value={tac[r]}
              min={0}
              max={Math.min(remaining[r], me.res[r])}
              onChange={(v) => setTac({ ...tac, [r]: v })}
              label={
                <>
                  <Icon name={RES_ICON[r]} size={17} /> {RES_NAME[r]}, còn cần {remaining[r]}
                </>
              }
            />
          ))}
        </>
      ) : (
        <p className="ok">Chiến thuật đã đủ.</p>
      )}
      <button
        className="btn son"
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
    </>
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
    <>
      <p className="hint">Tốn 1 Lúa. Hai bên bí mật chọn số Sắt bỏ ra rồi lật cùng lúc. Lực lớn hơn hẳn thì thắng; Sắt đã bỏ thì mất.</p>
      <div className="seg">
        <button className={mode === 'tranhCong' ? 'on' : ''} onClick={() => setMode('tranhCong')} disabled={me.heroId === 'tranHungDao'}>
          Tranh công
          <small>Loại 2 Quân của họ ở chiến trường</small>
        </button>
        <button className={mode === 'dotKich' ? 'on' : ''} onClick={() => setMode('dotKich')}>
          Đột kích
          <small>Cướp 3 tài nguyên, mất 1 Lòng dân (trừ khi đánh người dẫn đầu)</small>
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
            <div key={p.id} className="target">
              <Avatar heroId={p.heroId} size={44} />
              <div style={{ minWidth: 0 }}>
                <b>{p.name}</b> {p.star === leader && <span className="tag son">Dẫn đầu</span>}
                <div className="small">
                  Lực bạn {atkBase} + {usesMuu ? 'Tiền' : 'Sắt'}, thủ họ {defBase} + Sắt (họ có {p.res.sat}). Quân ở trận: {troops}
                </div>
              </div>
              <button
                className="btn small son"
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
    </>
  );
}

// ------------------------------------------------------------ Kế sách
function KeSach() {
  const me = useMe()!;
  const act = useStore((s) => s.act);
  const setPanel = useUi((s) => s.setPanel);
  const hand = me.strats ?? [];
  return (
    <>
      <p className="hint">Mỗi lượt dùng được 1 kế sách loại dùng ngay. Kế sách công và thủ được chọn lúc giao chiến.</p>
      {hand.length === 0 && <p className="muted">Bạn chưa có kế sách. Dùng hành động Mưu kế để rút.</p>}
      <div className="strat-list">
        {hand.map((st, i) => {
          const d = STRATS[st];
          return (
            <div key={i} className={`strat-card t-${d.timing}`}>
              <b>{d.name}</b>
              <span className="muted small">{d.timing === 'instant' ? 'Dùng ngay' : d.timing === 'attack' ? 'Dùng khi tấn công' : 'Dùng khi bị tấn công'}</span>
              <p>{d.text}</p>
              {d.timing === 'instant' && (
                <button
                  className="btn small son"
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
    </>
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
    <>
      <div className="ult-box">
        <Avatar heroId={me.heroId} size={64} />
        <div>
          <h4>{h.ultimate.name}</h4>
          <p>{h.ultimate.text}</p>
          <p className="skill-why">
            {h.ultimate.why} <Note note={h.ultimate.note} />
          </p>
        </div>
      </div>
      <p className="muted small">Mỗi trận dùng được 1 lần.</p>
      {h.ultimate.options ? (
        <div className="ult-options">
          <button className="btn son" onClick={() => fire('a')}>
            {h.ultimate.options[0].label}
          </button>
          <div className="row">
            <select aria-label="Chọn người" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Chọn người</option>
              {view.players
                .filter((p) => p.id !== me.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}, có {Object.values(p.res).reduce((a, b) => a + b, 0)} tài nguyên
                  </option>
                ))}
            </select>
            <button className="btn" disabled={!target} onClick={() => fire('b')}>
              {h.ultimate.options[1].label}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn son big" onClick={() => fire()}>
          Dùng {h.ultimate.name}
        </button>
      )}
    </>
  );
}
