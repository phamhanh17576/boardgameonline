import type { ReactNode } from 'react';
import { GENERALS, HEROES, RES_KEYS, type GameState, type GameView, type HeroId, type PlayerState, type Resources, type SourceNote } from '../../engine';
import { RES_ICON, RES_NAME } from '../theme';

/** Dùng các hàm đọc của engine trên GameView (chỉ đọc, không cần thông tin bí mật). */
export const asState = (v: GameView) => v as unknown as GameState;
export const asPlayer = (p: GameView['players'][number]) => p as unknown as PlayerState;

export function ResRow({ res, compact = false, zero = false }: { res: Partial<Resources>; compact?: boolean; zero?: boolean }) {
  const items = RES_KEYS.filter((r) => zero || (res[r] ?? 0) > 0);
  if (items.length === 0) return <span className="muted">—</span>;
  return (
    <span className={`res-row${compact ? ' compact' : ''}`}>
      {items.map((r) => (
        <span key={r} className={`res res-${r}`} title={RES_NAME[r]}>
          <span className="res-ic">{RES_ICON[r]}</span>
          {res[r] ?? 0}
        </span>
      ))}
    </span>
  );
}

export function Note({ note }: { note: SourceNote }) {
  return (
    <span className={`src-tag ${note.tag === 'CS' ? 'cs' : 'tt'}`} title={note.source}>
      {note.tag === 'CS' ? 'Chính sử' : 'Tương truyền'} · {note.source}
    </span>
  );
}

export function Modal({ title, children, onClose, wide = false, className = '' }: { title?: ReactNode; children: ReactNode; onClose?: () => void; wide?: boolean; className?: string }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''} ${className}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {onClose && (
          <button className="modal-x" onClick={onClose} aria-label="Đóng">
            ×
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

export function HeroCard({ heroId, compact = false, taken, onPick, picked }: { heroId: HeroId; compact?: boolean; taken?: string | null; onPick?: () => void; picked?: boolean }) {
  const h = HEROES[heroId];
  return (
    <div className={`hero-card${picked ? ' picked' : ''}${taken ? ' taken' : ''}`} style={{ ['--hc' as string]: h.color }}>
      <div className="hc-head">
        <div className="hc-seal">{h.name.split(' ').slice(-1)[0]}</div>
        <div>
          <div className="hc-name">{h.name}</div>
          <div className="hc-title">{h.title}</div>
          <div className="hc-meta">
            {h.era} · {h.role} · {'★'.repeat(h.difficulty)}
            <span className="muted">{'☆'.repeat(3 - h.difficulty)}</span> độ khó
          </div>
        </div>
      </div>
      <div className="hc-stats">
        <span>⚔️ Võ {h.vo}</span>
        <span>🛡️ Thủ {h.thu}</span>
        <span>📜 Mưu {h.muu}</span>
      </div>
      <Skill kind="Nội tại" s={h.passive} compact={compact} />
      <Skill kind="Tuyệt kỹ" s={h.ultimate} compact={compact} />
      {h.drawbacks.map((d) => (
        <Skill key={d.name} kind="Điểm yếu" s={d} compact={compact} bad />
      ))}
      {!compact && h.quote && (
        <blockquote className="hc-quote">
          {h.quote.text}
          <Note note={h.quote.note} />
        </blockquote>
      )}
      {onPick && (
        <button className="btn gold" disabled={!!taken && !picked} onClick={onPick}>
          {picked ? '✓ Đã chọn' : taken ? `${taken} đã chọn` : 'Chọn anh hùng này'}
        </button>
      )}
    </div>
  );
}

function Skill({ kind, s, compact, bad = false }: { kind: string; s: { name: string; text: string; why: string; note: SourceNote }; compact: boolean; bad?: boolean }) {
  return (
    <div className={`skill${bad ? ' bad' : ''}`}>
      <div className="skill-head">
        <span className="skill-kind">{kind}</span> <b>{s.name}</b>
      </div>
      <div className="skill-text">{s.text}</div>
      {!compact && (
        <div className="skill-why">
          <span className="why-label">Vì sao:</span> {s.why} <Note note={s.note} />
        </div>
      )}
    </div>
  );
}

export function GeneralChip({ id }: { id: string }) {
  const g = GENERALS[id];
  return (
    <span className="gen-chip" title={g.bio}>
      {g.name}
      {g.star > 0 && <b> ★{g.star}</b>}
    </span>
  );
}
