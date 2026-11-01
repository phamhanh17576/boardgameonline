import { BATTLE_COUNT_OPTIONS, BATTLE_IDS, HERO_IDS, HEROES, MAX_PLAYERS, MIN_PLAYERS } from '../../engine';
import { canStart, DEFAULT_SETTINGS } from '../../net/protocol';
import { useStore } from '../store';
import { Avatar, HeroCard } from './common';
import { Icon } from './Icon';

const minutes = (n: number) => `${n * 10}–${n * 13} phút`;

export function Lobby() {
  const lobby = useStore((s) => s.lobby);
  const you = useStore((s) => s.you);
  const mode = useStore((s) => s.mode);
  const send = useStore((s) => s.send);
  const leave = useStore((s) => s.leave);
  const conn = useStore((s) => s.conn);
  const toast = useStore((s) => s.showToast);
  if (!lobby || !you) {
    return (
      <div className="center-msg">
        <div className="spinner" />
        <p>{conn === 'closed' ? 'Mất kết nối, đang thử lại…' : 'Đang vào phòng…'}</p>
        <button className="btn" onClick={leave}>
          Quay lại
        </button>
      </div>
    );
  }
  const isHost = lobby.hostId === you;
  const me = lobby.seats.find((s) => s.id === you);
  const why = canStart(lobby.seats);
  const settings = lobby.settings ?? DEFAULT_SETTINGS;
  const link = `${location.origin}${location.pathname}?phong=${lobby.code}`;
  const copy = () => {
    navigator.clipboard
      ?.writeText(link)
      .then(() => toast('Đã sao chép link mời.'))
      .catch(() => toast(`Link mời: ${link}`));
  };

  return (
    <main className="lobby">
      <div className="lobby-inner">
        <header className="lobby-head">
          <div>
            <h1>Sảnh chờ</h1>
            {mode === 'online' ? (
              <p>
                Mã phòng <b className="code">{lobby.code}</b>{' '}
                <button className="btn small" onClick={copy}>
                  Sao chép link mời
                </button>
              </p>
            ) : (
              <p>Chơi thử với máy, không cần mạng.</p>
            )}
          </div>
          <button className="btn" onClick={leave}>
            <Icon name="roi" size={18} /> Rời phòng
          </button>
        </header>

        <div className="lobby-cols">
          <aside className="lobby-side">
            <section className="sheet">
              <h2>
                Người chơi {lobby.seats.length}/{MAX_PLAYERS}
              </h2>
              <p className="muted small">Cần từ {MIN_PLAYERS} đến {MAX_PLAYERS} người. Thiếu người thì thêm máy chơi cùng.</p>
              <div className="seat-list">
                {lobby.seats.map((s) => {
                  const h = s.heroId ? HEROES[s.heroId] : null;
                  return (
                    <div key={s.id} className={`seat${s.id === you ? ' me' : ''}`}>
                      {s.heroId ? <Avatar heroId={s.heroId} size={44} /> : <span className="seat-empty" />}
                      <div className="seat-info">
                        <b>
                          {s.name}
                          {s.id === lobby.hostId && <span className="tag cham">Chủ phòng</span>}
                          {s.isBot && <span className="tag">Máy</span>}
                          {!s.connected && <span className="tag son">Mất kết nối</span>}
                        </b>
                        <span className="muted small">{h ? h.name : 'Chưa chọn anh hùng'}</span>
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
              {isHost && (
                <button className="btn" disabled={lobby.seats.length >= MAX_PLAYERS} onClick={() => send({ t: 'addBot' })}>
                  Thêm máy chơi cùng
                </button>
              )}
            </section>

            <section className="sheet">
              <h2>Số trận trong ván</h2>
              <div className="seg-row" role="radiogroup" aria-label="Số trận">
                {BATTLE_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={settings.battleCount === n}
                    className={`chip${settings.battleCount === n ? ' on' : ''}`}
                    disabled={!isHost}
                    onClick={() => send({ t: 'settings', settings: { battleCount: n } })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="small">
                Khoảng {minutes(settings.battleCount)}. Game rút ngẫu nhiên {settings.battleCount} trong {BATTLE_IDS.length} trận có thật rồi xếp theo thứ tự năm.
                {!isHost && ' Chủ phòng chọn số trận.'}
              </p>
            </section>

            <section className="sheet son">
              {isHost ? (
                <>
                  <button className="btn son big" disabled={!!why} onClick={() => send({ t: 'start' })}>
                    Bắt đầu ván
                  </button>
                  {why && <p className="small">{why}</p>}
                </>
              ) : (
                <p>Đợi chủ phòng bắt đầu ván.</p>
              )}
            </section>
          </aside>

          <section>
            <h2 style={{ marginBottom: 12, color: 'var(--cham)' }}>
              Chọn anh hùng {me?.heroId ? <span className="muted small">— bạn đang chọn {HEROES[me.heroId].name}</span> : null}
            </h2>
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
      </div>
    </main>
  );
}
