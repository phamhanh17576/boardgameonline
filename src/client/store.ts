import { create } from 'zustand';
import type { Action, GameEvent, GameView } from '../engine';
import { LocalRoom } from '../net/localRoom';
import { normalizeCode, type ClientMsg, type LobbyInfo, type ServerMsg } from '../net/protocol';

type Mode = 'online' | 'local' | null;
type ConnState = 'idle' | 'connecting' | 'open' | 'closed' | 'failed';

export interface ChatLine {
  from: string;
  text: string;
  at: number;
}

interface Store {
  mode: Mode;
  conn: ConnState;
  name: string;
  code: string;
  you: string | null;
  lobby: LobbyInfo | null;
  view: GameView | null;
  toast: { text: string; at: number } | null;
  chat: ChatLine[];
  /** Hàng đợi hiệu ứng (sự kiện mới chưa phát) */
  fx: GameEvent[];
  lastSeq: number;
  setName: (n: string) => void;
  connectOnline: (code: string, name: string) => void;
  startLocal: (name: string) => void;
  leave: () => void;
  send: (m: ClientMsg) => void;
  act: (a: Action) => void;
  consumeFx: (seq: number) => void;
  showToast: (text: string) => void;
}

let socket: WebSocket | null = null;
let local: LocalRoom | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let retry = 0;

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* bỏ qua */
  }
};

export const useStore = create<Store>((set, get) => {
  const onServer = (m: ServerMsg) => {
    switch (m.t) {
      case 'welcome':
        set({ you: m.you });
        if (get().mode === 'online') safeSet(`hkn:token:${get().code}`, m.token);
        break;
      case 'lobby':
        set({ lobby: m.lobby });
        if (!m.lobby.started) set({ view: null, fx: [], lastSeq: 0 });
        break;
      case 'state': {
        const prev = get().lastSeq;
        const fresh = m.view.events.filter((e) => e.seq > prev);
        set((s) => ({ view: m.view, fx: prev === 0 ? [] : [...s.fx, ...fresh].slice(-40), lastSeq: m.view.eventSeq }));
        break;
      }
      case 'error':
        get().showToast(m.message);
        break;
      case 'chat':
        set((s) => ({ chat: [...s.chat, { from: m.from, text: m.text, at: m.at }].slice(-50) }));
        break;
    }
  };

  const openSocket = () => {
    const { code, name } = get();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    set({ conn: 'connecting' });
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${proto}://${location.host}/api/rooms/${code}/ws`);
    } catch {
      set({ conn: 'failed' });
      return;
    }
    socket = ws;
    let opened = false;
    ws.onopen = () => {
      opened = true;
      retry = 0;
      set({ conn: 'open' });
      ws.send(JSON.stringify({ t: 'hello', name, token: safeGet(`hkn:token:${code}`) ?? undefined } satisfies ClientMsg));
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ t: 'ping' })), 20_000);
    };
    ws.onmessage = (e) => {
      try {
        onServer(JSON.parse(e.data));
      } catch {
        /* bỏ qua */
      }
    };
    ws.onclose = () => {
      if (socket !== ws || get().mode !== 'online') return;
      if (!opened && retry === 0) {
        set({ conn: 'failed' });
        return;
      }
      set({ conn: 'closed' });
      retry += 1;
      setTimeout(() => get().mode === 'online' && socket === ws && openSocket(), Math.min(8000, 800 * retry));
    };
  };

  return {
    mode: null,
    conn: 'idle',
    name: safeGet('hkn:name') ?? '',
    code: '',
    you: null,
    lobby: null,
    view: null,
    toast: null,
    chat: [],
    fx: [],
    lastSeq: 0,
    setName: (n) => {
      set({ name: n });
      safeSet('hkn:name', n);
    },
    connectOnline: (code, name) => {
      get().leave();
      const c = normalizeCode(code);
      set({ mode: 'online', code: c, name, lobby: null, view: null, you: null, chat: [], fx: [], lastSeq: 0 });
      safeSet('hkn:name', name);
      try {
        {
          const q = new URLSearchParams(location.search);
          q.set('phong', c);
          history.replaceState(null, '', `?${q}`);
        }
      } catch {
        /* bỏ qua */
      }
      openSocket();
    },
    startLocal: (name) => {
      get().leave();
      set({ mode: 'local', code: 'MAY', name, lobby: null, view: null, you: null, conn: 'open', fx: [], lastSeq: 0 });
      safeSet('hkn:name', name);
      local = new LocalRoom(onServer);
      local.send({ t: 'hello', name });
    },
    leave: () => {
      if (socket) {
        const s = socket;
        socket = null;
        s.close();
      }
      if (pingTimer) clearInterval(pingTimer);
      local?.close();
      local = null;
      set({ mode: null, conn: 'idle', lobby: null, view: null, you: null, fx: [], lastSeq: 0 });
      try {
        const q = new URLSearchParams(location.search);
        q.delete('phong');
        const rest = q.toString();
        history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : ''));
      } catch {
        /* bỏ qua */
      }
    },
    send: (m) => {
      if (get().mode === 'local') local?.send(m);
      else if (socket?.readyState === 1) socket.send(JSON.stringify(m));
      else get().showToast('Mất kết nối, đang thử lại…');
    },
    act: (a) => get().send({ t: 'action', action: a }),
    consumeFx: (seq) => set((s) => ({ fx: s.fx.filter((e) => e.seq > seq) })),
    showToast: (text) => set({ toast: { text, at: Date.now() } }),
  };
});

export const useMe = () => {
  const view = useStore((s) => s.view);
  const you = useStore((s) => s.you);
  return view?.players.find((p) => p.id === you) ?? null;
};

// Chỉ khi chạy `npm run dev`: cho phép công cụ kiểm thử phát sự kiện giả (xem hoạt cảnh thắng/thua).
if (import.meta.env.DEV) (window as unknown as { __hknStore: typeof useStore }).__hknStore = useStore;
