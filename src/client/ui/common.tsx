import type { ReactNode } from 'react';
import { GENERALS, HEROES, RES_KEYS, type GameState, type GameView, type HeroId, type PlayerState, type Resources, type SourceNote } from '../../engine';
import { AVATAR, AVATAR_SM } from '../art';
import { RES_ICON, RES_NAME } from '../theme';
import { Icon } from './Icon';

/** Dùng các hàm đọc của engine trên GameView (chỉ đọc, không cần thông tin bí mật). */
export const asState = (v: GameView) => v as unknown as GameState;
export const asPlayer = (p: GameView['players'][number]) => p as unknown as PlayerState;

export function Avatar({ heroId, size = 48, big = false, className = '' }: { heroId: HeroId; size?: number; big?: boolean; className?: string }) {
  return <img className={`ava ${className}`} src={big ? AVATAR[heroId] : AVATAR_SM[heroId]} width={size} height={size} alt={HEROES[heroId].name} loading="lazy" />;
}

export function ResRow({ res, compact = false, zero = false }: { res: Partial<Resources>; compact?: boolean; zero?: boolean }) {
  const items = RES_KEYS.filter((r) => zero || (res[r] ?? 0) > 0);
  if (items.length === 0) return <span className="muted">không tốn gì</span>;
  return (
    <span className={`res-row${compact ? ' compact' : ''}`}>
      {items.map((r) => (
        <span key={r} className={`res res-${r}`} title={RES_NAME[r]}>
          <Icon name={RES_ICON[r]} size={compact ? 15 : 17} />
          {res[r] ?? 0}
        </span>
      ))}
    </span>
  );
}

export function Note({ note }: { note: SourceNote }) {
  return (
    <span className={`src-tag ${note.tag === 'CS' ? 'cs' : 'tt'}`} title={note.source}>
      {note.tag === 'CS' ? 'Chính sử' : 'Tương truyền'}: {note.source}
    </span>
  );
}

export function Modal({ title, children, onClose, wide = false, className = '' }: { title?: ReactNode; children: ReactNode; onClose?: () => void; wide?: boolean; className?: string }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''} ${className}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {onClose && (
          <button className="modal-x" onClick={onClose} aria-label="Đóng">
            <Icon name="dong" size={22} />
          </button>
        )}
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label?: ReactNode }) {
  return (
    <div className="stepper">
      {label && <span className="stepper-label">{label}</span>}
      <button disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Bớt">
        −
      </button>
      <span className="stepper-val">{value}</span>
      <button disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Thêm">
        +
      </button>
    </div>
  );
}

export function Stat({ icon, value, title }: { icon: Parameters<typeof Icon>[0]['name']; value: ReactNode; title: string }) {
  return (
    <span className="stat" title={title}>
      <Icon name={icon} size={15} />
      {value}
    </span>
  );
}

export function HeroCard({ heroId, taken, onPick, picked, full = false }: { heroId: HeroId; taken?: string | null; onPick?: () => void; picked?: boolean; full?: boolean }) {
  const h = HEROES[heroId];
  return (
    <article className={`hero-card${picked ? ' picked' : ''}${taken ? ' taken' : ''}`}>
      <div className="hc-portrait">
        <img src={AVATAR[heroId]} alt={`Chân dung ${h.name} theo lối tranh Đông Hồ`} loading="lazy" />
        <div className="hc-plate">
          <div className="hc-name">{h.name}</div>
          <div className="hc-title">{h.title}</div>
        </div>
      </div>
      <div className="hc-body">
        <div className="hc-meta">
          <Stat icon="vo" value={h.vo} title="Võ" />
          <Stat icon="thu" value={h.thu} title="Thủ" />
          <Stat icon="muu" value={h.muu} title="Mưu" />
          <span className="muted">{h.role}</span>
          <span className="diff" title={`Độ khó ${h.difficulty}/3`}>
            {[1, 2, 3].map((i) => (
              <i key={i} className={i <= h.difficulty ? 'on' : ''} />
            ))}
          </span>
        </div>
        <Skill kind="Nội tại" s={h.passive} full={full} />
        <Skill kind="Tuyệt kỹ" s={h.ultimate} full={full} cls="ult" />
        {h.drawbacks.map((d) => (
          <Skill key={d.name} kind="Điểm yếu" s={d} full={full} cls="bad" />
        ))}
        {full ? (
          h.quote && (
            <blockquote className="hc-quote">
              {h.quote.text} <Note note={h.quote.note} />
            </blockquote>
          )
        ) : (
          <details className="more">
            <summary>Vì sao có các kỹ năng này?</summary>
            <div className="hc-body" style={{ padding: 0 }}>
              {[h.passive, h.ultimate, ...h.drawbacks].map((s) => (
                <p key={s.name} className="skill-why">
                  <b>{s.name}:</b> {s.why} <Note note={s.note} />
                </p>
              ))}
              {h.quote && (
                <blockquote className="hc-quote">
                  {h.quote.text} <Note note={h.quote.note} />
                </blockquote>
              )}
            </div>
          </details>
        )}
      </div>
      {onPick && (
        <div className="hc-foot">
          <button className={`btn ${picked ? 'cham' : 'son'}`} disabled={!!taken && !picked} onClick={onPick}>
            {picked ? 'Bạn đã chọn' : taken ? `${taken} đã chọn` : `Chọn ${h.name}`}
          </button>
        </div>
      )}
    </article>
  );
}

function Skill({ kind, s, full, cls = '' }: { kind: string; s: { name: string; text: string; why: string; note: SourceNote }; full: boolean; cls?: string }) {
  return (
    <div className={`skill ${cls}`}>
      <div className="skill-head">
        <span className="skill-kind">{kind}</span>
        {s.name}
      </div>
      <div className="skill-text">{s.text}</div>
      {full && (
        <div className="skill-why">
          {s.why} <Note note={s.note} />
        </div>
      )}
    </div>
  );
}

export function GeneralChip({ id }: { id: string }) {
  const g = GENERALS[id];
  return (
    <span className="tag" title={g.bio}>
      {g.name}
      {g.star > 0 && ` +${g.star}`}
    </span>
  );
}
