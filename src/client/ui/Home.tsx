import { useState } from 'react';
import { normalizeCode, randomCode } from '../../net/protocol';
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

  return (
    <div className="home">
      <div className="home-card">
        <div className="home-seal">豪氣</div>
        <h1 className="home-title">Hào Khí Ngàn Năm</h1>
        <p className="home-sub">Board game lịch sử Việt Nam · 4–6 người · Bản thử thời Trần: Vân Đồn &amp; Bạch Đằng 1288</p>

        <label className="field">
          <span>Tên của bạn</span>
          <input value={name} maxLength={24} placeholder="Ví dụ: Hạnh" onChange={(e) => setName(e.target.value)} autoFocus />
        </label>

        <div className="home-actions">
          {initialCode && !OFFLINE_ONLY && (
            <button className="btn red big" disabled={!nameOk} onClick={() => connectOnline(initialCode, name.trim())}>
              Vào phòng {initialCode}
            </button>
          )}
          <button className={`btn big ${initialCode ? '' : 'gold'}`} disabled={!nameOk} onClick={() => startLocal(name.trim())}>
            Chơi thử với máy
          </button>
          {OFFLINE_ONLY ? (
            <p className="home-foot">
              Đây là bản xem trước: chỉ chơi với máy. Bản chơi online nhiều người chạy trên Cloudflare (xem README trong repo).
            </p>
          ) : (
          <>
          <div className="or">hoặc chơi online cùng bạn bè</div>
          <div className="join-row">
            <input value={code} maxLength={8} placeholder="Mã phòng" onChange={(e) => setCode(normalizeCode(e.target.value))} />
            <button className="btn" disabled={!nameOk || code.length < 3} onClick={() => connectOnline(code, name.trim())}>
              Vào phòng
            </button>
          </div>
          <button className="btn ghost" disabled={!nameOk} onClick={() => connectOnline(randomCode(), name.trim())}>
            Tạo phòng mới
          </button>
          </>
          )}
          {conn === 'failed' && (
            <p className="warn">
              Không kết nối được máy chủ phòng chơi. Bản online cần chạy trên Cloudflare (xem hướng dẫn trong README). Bạn vẫn có thể bấm
              &nbsp;<b>Chơi thử với máy</b>.
            </p>
          )}
        </div>
        <button className="link" onClick={() => setHelp(true)}>
          Luật chơi nhanh
        </button>
        <p className="home-foot">
          Nội dung sử lấy từ <i>Đại Việt sử ký toàn thư</i>. Mỗi thông tin có nhãn <span className="src-tag cs">Chính sử</span> hoặc{' '}
          <span className="src-tag tt">Tương truyền</span>.
        </p>
      </div>
    </div>
  );
}
