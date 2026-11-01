import { useState } from 'react';
import { HERO_IDS } from '../../engine';
import { normalizeCode, randomCode } from '../../net/protocol';
import { AVATAR, AVATAR_SM } from '../art';
import { useStore } from '../store';
import { useUi } from './uiStore';

const OFFLINE_ONLY = import.meta.env.MODE === 'single';

export function Home() {
  const storedName = useStore((s) => s.name);
  const connectOnline = useStore((s) => s.connectOnline);
  const startLocal = useStore((s) => s.startLocal);
  const conn = useStore((s) => s.conn);
  const setHelp = useUi((s) => s.setHelp);
  const initialCode = (() => {
    try {
      return normalizeCode(new URLSearchParams(location.search).get('phong') ?? '');
    } catch {
      return '';
    }
  })();
  const [name, setName] = useState(storedName);
  const [code, setCode] = useState(initialCode);
  const nameOk = name.trim().length > 0;
  const others = HERO_IDS.filter((h) => h !== 'tranHungDao').slice(0, 4);

  return (
    <main className="home">
      <div className="home-grid">
        <section>
          <h1 className="home-title">Hào Khí Ngàn Năm</h1>
          <p className="home-sub">
            Bốn đến sáu người cùng đánh những trận có thật trong sử Việt, từ khởi binh của Hai Bà Trưng đến Ngọc Hồi – Đống Đa, và tranh nhau Uy danh.
          </p>
          <form className="sheet home-form" onSubmit={(e) => e.preventDefault()}>
            <label className="field" htmlFor="ten">
              Tên của bạn
              <input id="ten" value={name} maxLength={24} placeholder="Ví dụ: Hạnh" onChange={(e) => setName(e.target.value)} autoFocus />
            </label>
            {initialCode && !OFFLINE_ONLY && (
              <button type="button" className="btn son big" disabled={!nameOk} onClick={() => connectOnline(initialCode, name.trim())}>
                Vào phòng {initialCode}
              </button>
            )}
            <button type="button" className={`btn big ${initialCode && !OFFLINE_ONLY ? '' : 'son'}`} disabled={!nameOk} onClick={() => startLocal(name.trim())}>
              Chơi thử với máy
            </button>
            {OFFLINE_ONLY ? (
              <p className="home-foot">Bản xem trước chỉ chơi được với máy. Bản online nhiều người chạy trên Cloudflare.</p>
            ) : (
              <>
                <div className="or">Chơi online cùng bạn bè</div>
                <div className="join-row">
                  <input id="ma-phong" aria-label="Mã phòng" value={code} maxLength={8} placeholder="Mã phòng" onChange={(e) => setCode(normalizeCode(e.target.value))} />
                  <button type="button" className="btn cham" disabled={!nameOk || code.length < 3} onClick={() => connectOnline(code, name.trim())}>
                    Vào phòng
                  </button>
                </div>
                <button type="button" className="btn ghost" disabled={!nameOk} onClick={() => connectOnline(randomCode(), name.trim())}>
                  Tạo phòng mới và mời bạn bè
                </button>
              </>
            )}
            {conn === 'failed' && <p className="warn">Không kết nối được máy chủ phòng chơi. Bạn vẫn có thể chơi thử với máy.</p>}
          </form>
          <p className="home-foot">
            Nội dung sử trích từ <i>Đại Việt sử ký toàn thư</i>. Chi tiết dân gian được ghi rõ là tương truyền.{' '}
            <button className="link" onClick={() => setHelp(true)}>
              Đọc luật chơi
            </button>
          </p>
        </section>
        <section className="home-art" aria-label="Các anh hùng trong game">
          <div className="home-print">
            <img src={AVATAR.tranHungDao} alt="Trần Hưng Đạo, tranh khắc gỗ Đông Hồ" />
          </div>
          <div className="home-strip">
            {others.map((h) => (
              <img key={h} src={AVATAR_SM[h]} alt="" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
