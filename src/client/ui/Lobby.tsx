import { HERO_IDS, HEROES, MAX_PLAYERS, MIN_PLAYERS } from '../../engine';
import { canStart } from '../../net/protocol';
import { useStore } from '../store';
import { HeroCard } from './common';

export function Lobby() {
  const lobby = useStore((s) => s.lobby);
  const you = useStore((s) => s.you);
  const mode = useStore((s) => s.mode);
  const send = useStore((s) => s.send);
  const leave = useStore((s) => s.leave);
  const conn = useStore((s) => s.conn);
  if (!lobby || !you) {
    return (
      <div className="center-msg">
        <div className="spinner" />
        <p>{conn === 'closed' ? 'Mất kết nối, đang thử lại…' : 'Đang vào phòng…'}</p>
        <button className="btn ghost" onClick={leave}>
          Quay lại
        </button>
      </div>
    );
  }
  const isHost = lobby.hostId === you;
  const me = lobby.seats.find((s) => s.id === you);
  const why = canStart(lobby.seats);
  const link = `${location.origin}${location.pathname}?phong=${lobby.code}`;

  return (
    <div className="lobby">
      <header className="lobby-head">
        <div>
          <h1>Sảnh chờ</h1>
          {mode === 'online' ? (
            <p>
              Mã phòng: <b className="code">{lobby.code}</b>{' '}
              <button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(link).catch(() => undefined)}>
                Sao chép link mời
              </button>
            </p>
          ) : (
            <p>Chơi thử với máy, không cần mạng.</p>
          )}
        </div>
        <button className="btn ghost" onClick={leave}>
          Rời phòng
        </button>
      </header>

      <section className="seats">
        <h2>
          Người chơi ({lobby.seats.length}/{MAX_PLAYERS}) <span className="muted">· cần {MIN_PLAYERS}–{MAX_PLAYERS} người</span>
        </h2>
        <div className="seat-list">
          {lobby.seats.map((s) => {
            const h = s.heroId ? HEROES[s.heroId] : null;
            return (
              <div key={s.id} className={`seat${s.id === you ? ' me' : ''}`} style={{ ['--hc' as string]: h?.color ?? '#555' }}>
                <div className="seat-seal">{h ? h.name.split(' ').slice(-1)[0] : '?'}</div>
                <div className="seat-info">
                  <b>{s.name}</b>
                  {s.id === lobby.hostId && <span className="tag">Chủ phòng</span>}
                  {s.isBot && <span className="tag">Máy</span>}
                  {!s.connected && <span className="tag warn">Mất kết nối</span>}
                  <div className="muted">{h ? h.name : 'Chưa chọn anh hùng'}</div>
                </div>
                {isHost && s.isBot && (
                  <button className="btn small ghost" onClick={() => send({ t: 'removeSeat', id: s.id })}>
                    Bỏ
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="lobby-actions">
          {isHost && (
            <button className="btn" disabled={lobby.seats.length >= MAX_PLAYERS} onClick={() => send({ t: 'addBot' })}>
              + Thêm máy chơi cùng
            </button>
          )}
          {isHost ? (
            <button className="btn gold big" disabled={!!why} onClick={() => send({ t: 'start' })} title={why ?? ''}>
              Bắt đầu ván
            </button>
          ) : (
            <span className="muted">Đợi chủ phòng bắt đầu…</span>
          )}
          {why && <span className="muted small">{why}</span>}
        </div>
      </section>

      <section>
        <h2>Chọn anh hùng {me?.heroId ? <span className="muted">· bạn đã chọn {HEROES[me.heroId].name}</span> : null}</h2>
        <div className="hero-grid">
          {HERO_IDS.map((h) => {
            const owner = lobby.seats.find((s) => s.heroId === h);
            const takenBy = owner && owner.id !== you ? owner.name : null;
            return (
              <HeroCard
                key={h}
                heroId={h}
                taken={takenBy && !(mode === 'local' && owner?.isBot) ? takenBy : null}
                picked={owner?.id === you}
                onPick={() => send({ t: 'pickHero', heroId: h })}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
