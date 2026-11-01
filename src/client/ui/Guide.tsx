// Bảng hướng dẫn bên trái màn hình: mẹo "bây giờ làm gì" theo tình huống + luật tóm tắt.
import { useEffect, type ReactNode } from 'react';
import {
  GENERALS,
  HEROES,
  RES_KEYS,
  battlePower,
  canAfford,
  enemyStrength,
  generalCost,
  resTotal,
  tacticRemaining,
  type GameView,
} from '../../engine';
import { useMe } from '../store';
import { RES_ICON, RES_NAME, TERRAIN_COLOR, TERRAIN_NAME } from '../theme';
import { asPlayer, asState } from './common';
import { useUi } from './uiStore';

type Me = NonNullable<ReturnType<typeof useMe>>;

/** Gợi ý ngắn: người chơi nên làm gì ngay bây giờ. */
function nextTip(view: GameView, me: Me): { title: string; body: ReactNode } {
  const name = (pid: string) => view.players.find((p) => p.id === pid)?.name ?? '';
  if (view.phase === 'gameOver') return { title: 'Ván đã kết thúc', body: 'Xem bảng điểm chung cuộc. Chủ phòng có thể bấm "Ván mới".' };
  if (view.phase === 'battleIntro') return { title: 'Chuẩn bị xuất trận', body: 'Đọc bối cảnh trận trên cuộn giấy rồi bấm "Xuất trận!". Ván bắt đầu khi mọi người đã sẵn sàng.' };
  if (view.phase === 'battleResult') return { title: 'Tổng kết trận', body: 'Xem ai được bao nhiêu ★ và đọc Sử ký, rồi bấm nút đỏ để sang bước tiếp.' };
  if (view.phase === 'combat' && view.combat) {
    const c = view.combat;
    if (c.attackerId === me.id || c.defenderId === me.id) {
      return {
        title: 'Bạn đang giao chiến!',
        body: 'Kéo thanh chọn số ⛏️ Sắt muốn bỏ ra rồi bấm "Chốt bí mật". Đối thủ không thấy con số này. Sắt đã bỏ thì mất, dù thắng hay thua.',
      };
    }
    return { title: 'Có người đang giao chiến', body: `${name(c.attackerId)} đang tấn công ${name(c.defenderId)}. Chờ hai bên chốt Sắt.` };
  }
  if (view.phase === 'choice' && view.pendingChoice?.playerId === me.id) return { title: 'Chọn Kế sách', body: 'Giữ lại 1 trong 2 lá vừa rút.' };
  if (view.turn.playerId !== me.id) {
    return {
      title: `Đang là lượt của ${name(view.turn.playerId)}`,
      body: 'Trong lúc chờ, hãy xem Chợ tướng (nút Chiêu hiền) và tính trước lượt sau. Nếu bị tấn công, bảng giao chiến sẽ tự hiện ra.',
    };
  }
  if (view.turn.actionTaken) {
    return { title: 'Đã xong hành động chính', body: 'Bạn còn có thể dùng 1 Kế sách hoặc Tuyệt kỹ. Xong thì bấm "Kết thúc lượt" (nút đỏ).' };
  }
  const s = asState(view);
  const last = view.round >= view.roundsPerBattle;
  const remaining = tacticRemaining(s);
  const canTactic = RES_KEYS.filter((r) => remaining[r] > 0 && me.res[r] > 0);
  const p = asPlayer(me);
  const affordable = [...view.market[1], ...view.market[2], ...view.market[3], ...me.reserved].find((g) => canAfford(p, generalCost(p, g)));
  if (last && (me.reserve > 0 || canTactic.length > 0)) {
    return { title: 'Vòng cuối của trận!', body: 'Bấm 🚩 Điều quân ngay: quân còn trong tay sẽ không được tính khi tổng kết trận.' };
  }
  if (me.reserve >= 2) {
    return { title: `Bạn có ${me.reserve} Quân trong tay`, body: 'Bấm 🚩 Điều quân để đưa quân ra chiến trường. Ai đóng góp nhiều nhất khi thắng trận sẽ được nhiều ★ nhất.' };
  }
  if (canTactic.length > 0) {
    return {
      title: 'Góp chiến thuật lịch sử',
      body: `Trận này còn cần ${canTactic.map((r) => `${remaining[r]} ${RES_ICON[r]} ${RES_NAME[r]}`).join(', ')}. Vào 🚩 Điều quân để góp: đủ thì Sức địch giảm 30%, bạn được thêm +1★.`,
    };
  }
  if (me.res.lua >= 2) return { title: 'Thiếu quân', body: 'Bấm 🪖 Mộ binh: mỗi 1 🌾 Lúa đổi được 1 Quân.' };
  if (affordable) return { title: 'Đủ tiền chiêu mộ tướng', body: `Bấm 🧑‍✈️ Chiêu hiền: bạn mua được ${GENERALS[affordable].name}. Tướng giúp các lần mua sau rẻ hơn và cộng thêm Võ.` };
  if (resTotal(me.res) < 4) return { title: 'Cần tài nguyên', body: 'Bấm 🌾 Thu thuế để nhận tài nguyên từ các vùng đất của bạn.' };
  return { title: 'Mở rộng lãnh địa', body: 'Bấm 🌱 Khai hoang: đặt 2 ô đất mới, ghép cùng loại liền nhau để thu thuế được nhiều hơn.' };
}

const ACTIONS: [string, string, string][] = [
  ['🌱', 'Khai hoang', 'Lấy 2 ô đất đặt vào lãnh địa.'],
  ['🌾', 'Thu thuế', 'Nhận tài nguyên từ các vùng đất.'],
  ['🧑‍✈️', 'Chiêu hiền', 'Mua tướng: giảm giá vĩnh viễn, thêm Võ và ★.'],
  ['🪖', 'Mộ binh', '1 Lúa = 1 Quân.'],
  ['🚩', 'Điều quân', 'Đưa quân ra trận, góp tài nguyên chiến thuật.'],
  ['⚔️', 'Tấn công', 'Phá quân hoặc cướp kho người khác.'],
  ['📜', 'Mưu kế', 'Rút 2 Kế sách, giữ 1.'],
];

export function GuideTab() {
  const open = useUi((s) => s.guideOpen);
  const setOpen = useUi((s) => s.setGuide);
  return (
    <button className={`guide-tab${open ? ' open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="guide-drawer" title="Hướng dẫn (phím H)">
      <span className="guide-tab-ic">📖</span>
      <span className="guide-tab-label">Hướng dẫn</span>
    </button>
  );
}

export function GuideDrawer({ view }: { view: GameView }) {
  const open = useUi((s) => s.guideOpen);
  const setOpen = useUi((s) => s.setGuide);
  const me = useMe();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.key === 'h' || e.key === 'H') setOpen(!useUi.getState().guideOpen);
      if (e.key === 'Escape' && useUi.getState().guideOpen) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  if (!me) return null;
  const tip = nextTip(view, me);
  const hero = HEROES[me.heroId];
  const s = asState(view);
  const power = battlePower(s);
  const enemy = enemyStrength(s).final;
  const gap = enemy - power;

  return (
    <aside id="guide-drawer" className={`guide${open ? ' open' : ''}`} aria-hidden={!open} aria-label="Hướng dẫn chơi">
      <div className="guide-head">
        <h3>📖 Hướng dẫn</h3>
        <button className="modal-x" onClick={() => setOpen(false)} aria-label="Đóng hướng dẫn">
          ×
        </button>
      </div>
      <div className="guide-body">
        <section className="guide-now" aria-live="polite">
          <div className="guide-kicker">Bây giờ làm gì?</div>
          <b>{tip.title}</b>
          <p>{tip.body}</p>
          {view.phase === 'action' && (
            <div className={`guide-gap${gap <= 0 ? ' ok' : ''}`}>
              {gap <= 0 ? `Phe ta đang đủ sức thắng (${power}/${enemy}). Hãy giữ quân ở trận!` : `Phe ta còn thiếu ${gap} lực để thắng trận (${power}/${enemy}).`}
            </div>
          )}
        </section>

        <details className="guide-sec" open>
          <summary>🎯 Mục tiêu</summary>
          <p>
            Cả bàn cùng đánh 2 trận (Vân Đồn rồi Bạch Đằng). Thắng trận thì ai góp nhiều quân nhất được nhiều <b>★ Uy danh</b> nhất. Hết ván, <b>ai nhiều ★ nhất thắng</b>.
          </p>
        </details>

        <details className="guide-sec" open>
          <summary>🔁 Một lượt của bạn</summary>
          <ol>
            <li>
              Chọn <b>1 hành động chính</b> ở thanh dưới.
            </li>
            <li>
              Có thể thêm 1 <b>🎴 Kế sách</b> và <b>✨ Tuyệt kỹ</b> (1 lần mỗi trận).
            </li>
            <li>
              Bấm <b>⏭ Kết thúc lượt</b>.
            </li>
          </ol>
          <p className="muted small">Mỗi trận có 3 vòng; mỗi vòng ai cũng được 1 lượt.</p>
        </details>

        <details className="guide-sec">
          <summary>🧭 7 hành động chính</summary>
          <ul className="guide-acts">
            {ACTIONS.map(([ic, n, d]) => (
              <li key={n}>
                <span className="ga-ic">{ic}</span>
                <span>
                  <b>{n}</b> — {d}
                </span>
              </li>
            ))}
          </ul>
        </details>

        <details className="guide-sec">
          <summary>🗺️ Lãnh địa và tài nguyên</summary>
          <ul className="guide-terr">
            {(['ruong', 'rung', 'nui', 'lang', 'song'] as const).map((t) => (
              <li key={t}>
                <span className="gt-swatch" style={{ background: TERRAIN_COLOR[t] }} />
                <b>{TERRAIN_NAME[t]}</b>
                <span className="muted">
                  {t === 'ruong' && '→ 🌾 Lúa (kề Sông +1)'}
                  {t === 'rung' && '→ 🪵 Gỗ'}
                  {t === 'nui' && '→ ⛏️ Sắt · 3 ô liền = Thành lũy (+2 Thủ)'}
                  {t === 'lang' && '→ 🪙 Tiền (kề 2 loại đất)'}
                  {t === 'song' && '3 ô liền = Thủy trại (+1 Võ)'}
                </span>
              </li>
            ))}
          </ul>
          <p className="muted small">Ô cùng loại nằm liền nhau là 1 vùng; mỗi vùng cho tối đa 3 tài nguyên khi Thu thuế.</p>
        </details>

        <details className="guide-sec">
          <summary>⚔️ Đánh nhau</summary>
          <ul>
            <li>
              <b>Tranh công</b>: loại 2 Quân của họ ở chiến trường.
            </li>
            <li>
              <b>Đột kích</b>: cướp 3 tài nguyên; bạn mất 1 Lòng dân (trừ khi đánh người dẫn đầu 👑).
            </li>
            <li>Hai bên bí mật bỏ ⛏️ Sắt. Lực lớn hơn hẳn mới thắng; hòa thì bên phòng thủ giữ được.</li>
            <li>Không được đánh cùng một người 2 lượt liền.</li>
          </ul>
        </details>

        <details className="guide-sec">
          <summary>🏆 Tính điểm cuối ván</summary>
          <ul>
            <li>★ từ trận đánh, tướng, chiến công.</li>
            <li>3 Danh hiệu của ván (ví dụ: nhiều chiến công nhất).</li>
            <li>Mỗi vùng đất từ 5 ô: +2★.</li>
            <li>Lòng dân ≥ 8: +4★ · ≤ 2: −3★.</li>
          </ul>
        </details>

        <details className="guide-sec">
          <summary style={{ ['--hc' as string]: hero.color }}>✨ Anh hùng của bạn: {hero.name}</summary>
          <p>
            <b>Nội tại — {hero.passive.name}:</b> {hero.passive.text}
          </p>
          <p>
            <b>Tuyệt kỹ — {hero.ultimate.name}</b> {me.ultUsedBattle ? <span className="tag">đã dùng trận này</span> : <span className="tag">sẵn sàng</span>}: {hero.ultimate.text}
          </p>
          {hero.drawbacks.map((d) => (
            <p key={d.name} className="guide-bad">
              <b>Điểm yếu — {d.name}:</b> {d.text}
            </p>
          ))}
        </details>
        <p className="muted small guide-foot">Phím tắt: H để mở/đóng · Esc để đóng</p>
      </div>
    </aside>
  );
}
