// Cloudflare Worker: phục vụ trang web (thư mục dist) và phòng chơi qua WebSocket.
// Mỗi mã phòng là một Durable Object "Room" giữ trạng thái ván và chạy lượt của máy.
import { DurableObject } from 'cloudflare:workers';
import { applyAction, botAction, viewFor, waitingFor, type GameState, type HeroId } from '../src/engine';
import {
  addBotSeat,
  canStart,
  cleanName,
  cleanSettings,
  DEFAULT_SETTINGS,
  freeHeroes,
  normalizeCode,
  startFromSeats,
  type ClientMsg,
  type LobbyInfo,
  type RoomSettings,
  type Seat,
  type ServerMsg,
} from '../src/net/protocol';

export interface Env {
  ROOM: DurableObjectNamespace<Room>;
  ASSETS: Fetcher;
}

const BOT_DELAY_MS = 1100;
const READY_TIMEOUT_MS = 60_000;
const AWAY_TAKEOVER_MS = 25_000;

interface RoomData {
  code: string;
  hostId: string | null;
  seats: Seat[];
  tokens: Record<string, string>; // token -> seatId
  game: GameState | null;
  nextId: number;
  settings?: RoomSettings;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9]{1,8})\/ws$/);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Cần WebSocket', { status: 426 });
      const code = normalizeCode(m[1]);
      const stub = env.ROOM.get(env.ROOM.idFromName(code));
      return stub.fetch(new Request(`https://room/${code}`, req));
    }
    if (url.pathname === '/api/health') return Response.json({ ok: true });
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;

export class Room extends DurableObject<Env> {
  private data: RoomData | null = null;
  private sockets = new Map<WebSocket, string | null>();
  private awaySince = new Map<string, number>();
  private botTimer: ReturnType<typeof setTimeout> | null = null;
  private readyTimer: ReturnType<typeof setTimeout> | null = null;

  private async load(code: string): Promise<RoomData> {
    if (!this.data) {
      this.data = (await this.ctx.storage.get<RoomData>('room')) ?? { code, hostId: null, seats: [], tokens: {}, game: null, nextId: 1 };
      for (const s of this.data.seats) if (!s.isBot) s.connected = false;
    }
    return this.data;
  }

  private save() {
    if (this.data) void this.ctx.storage.put('room', this.data);
  }

  async fetch(req: Request): Promise<Response> {
    const code = new URL(req.url).pathname.slice(1);
    await this.load(code);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.sockets.set(server, null);
    server.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as ClientMsg;
        this.onMessage(server, msg);
      } catch {
        this.send(server, { t: 'error', message: 'Tin nhắn không hợp lệ.' });
      }
    });
    const onClose = () => this.onClose(server);
    server.addEventListener('close', onClose);
    server.addEventListener('error', onClose);
    return new Response(null, { status: 101, webSocket: client });
  }

  private send(ws: WebSocket, msg: ServerMsg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* socket đã đóng */
    }
  }

  private lobbyInfo(): LobbyInfo {
    const d = this.data!;
    return { code: d.code, hostId: d.hostId, seats: d.seats, started: !!d.game, settings: d.settings ?? DEFAULT_SETTINGS };
  }

  private broadcast() {
    const d = this.data!;
    const lobby = this.lobbyInfo();
    for (const [ws, pid] of this.sockets) {
      this.send(ws, { t: 'lobby', lobby });
      if (d.game) this.send(ws, { t: 'state', view: viewFor(d.game, pid) });
    }
  }

  private onClose(ws: WebSocket) {
    const pid = this.sockets.get(ws);
    this.sockets.delete(ws);
    if (!pid || !this.data) return;
    const stillHere = [...this.sockets.values()].includes(pid);
    if (stillHere) return;
    const seat = this.data.seats.find((s) => s.id === pid);
    if (seat) seat.connected = false;
    this.awaySince.set(pid, Date.now());
    if (!this.data.game) {
      // Ở sảnh chờ: người rời đi thì bỏ ghế
      this.data.seats = this.data.seats.filter((s) => s.id !== pid);
      if (this.data.hostId === pid) this.data.hostId = this.data.seats.find((s) => !s.isBot)?.id ?? null;
    }
    this.save();
    this.broadcast();
    this.schedule();
  }

  private onMessage(ws: WebSocket, msg: ClientMsg) {
    const d = this.data!;
    const pid = this.sockets.get(ws) ?? null;
    const err = (message: string) => this.send(ws, { t: 'error', message });

    if (msg.t === 'ping') return this.send(ws, { t: 'pong' });

    if (msg.t === 'hello') {
      let seatId = msg.token ? d.tokens[msg.token] : undefined;
      let token = msg.token ?? '';
      let seat = seatId ? d.seats.find((s) => s.id === seatId) : undefined;
      if (!seat) {
        if (d.game) return err('Phòng đang chơi. Hãy đợi ván sau hoặc tạo phòng mới.');
        if (d.seats.length >= 6) return err('Phòng đã đủ 6 người.');
        seatId = `p${d.nextId++}`;
        token = crypto.randomUUID();
        d.tokens[token] = seatId;
        seat = { id: seatId, name: cleanName(msg.name), heroId: null, isBot: false, connected: true };
        d.seats.push(seat);
      } else if (!d.game) {
        seat.name = cleanName(msg.name);
      }
      seat.connected = true;
      this.awaySince.delete(seat.id);
      if (!d.hostId || !d.seats.some((s) => s.id === d.hostId && !s.isBot)) d.hostId = seat.id;
      this.sockets.set(ws, seat.id);
      this.send(ws, { t: 'welcome', you: seat.id, token });
      this.save();
      this.broadcast();
      this.schedule();
      return;
    }

    if (!pid) return err('Hãy nhập tên để vào phòng.');
    const isHost = d.hostId === pid;

    switch (msg.t) {
      case 'pickHero': {
        if (d.game) return err('Ván đã bắt đầu.');
        const seat = d.seats.find((s) => s.id === pid)!;
        if (seat.heroId === msg.heroId) return;
        if (!freeHeroes(d.seats).includes(msg.heroId as HeroId)) return err('Anh hùng này đã có người chọn.');
        seat.heroId = msg.heroId;
        break;
      }
      case 'addBot': {
        if (!isHost) return err('Chỉ chủ phòng được thêm máy.');
        if (d.game) return err('Ván đã bắt đầu.');
        if (!addBotSeat(d.seats, `b${d.nextId++}`)) return err('Không thể thêm máy (đủ người hoặc hết anh hùng).');
        break;
      }
      case 'removeSeat': {
        if (!isHost) return err('Chỉ chủ phòng được bỏ ghế.');
        if (d.game) return err('Ván đã bắt đầu.');
        const seat = d.seats.find((s) => s.id === msg.id);
        if (!seat || !seat.isBot) return err('Chỉ bỏ được ghế của máy.');
        d.seats = d.seats.filter((s) => s.id !== msg.id);
        break;
      }
      case 'start': {
        if (!isHost) return err('Chỉ chủ phòng được bắt đầu.');
        if (d.game) return err('Ván đã bắt đầu.');
        const why = canStart(d.seats);
        if (why) return err(why);
        d.game = startFromSeats(d.seats, d.settings ?? DEFAULT_SETTINGS);
        break;
      }
      case 'settings': {
        if (!isHost) return err('Chỉ chủ phòng được đổi cài đặt.');
        if (d.game) return err('Ván đã bắt đầu.');
        d.settings = cleanSettings(d.settings ?? DEFAULT_SETTINGS, msg.settings ?? {});
        break;
      }
      case 'action': {
        if (!d.game) return err('Ván chưa bắt đầu.');
        if (msg.action.pid !== pid) return err('Bạn chỉ được hành động cho chính mình.');
        const r = applyAction(d.game, msg.action);
        if (!r.ok) return err(r.error);
        d.game = r.state;
        break;
      }
      case 'chat': {
        const seat = d.seats.find((s) => s.id === pid);
        const text = String(msg.text ?? '').slice(0, 200).trim();
        if (!text || !seat) return;
        for (const s of this.sockets.keys()) this.send(s, { t: 'chat', from: seat.name, text, at: Date.now() });
        return;
      }
      case 'backToLobby': {
        if (!isHost) return err('Chỉ chủ phòng được quay về sảnh.');
        if (d.game && d.game.phase !== 'gameOver') return err('Ván chưa kết thúc.');
        d.game = null;
        d.seats = d.seats.filter((s) => s.isBot || s.connected);
        break;
      }
      default:
        return err('Lệnh không hợp lệ.');
    }
    this.save();
    this.broadcast();
    this.schedule();
  }

  /** Ai được máy chơi thay: bot, hoặc người rời phòng quá lâu. */
  private autoPlayer(pid: string): boolean {
    const seat = this.data!.seats.find((s) => s.id === pid);
    if (!seat) return true;
    if (seat.isBot) return true;
    if (seat.connected) return false;
    const since = this.awaySince.get(pid) ?? 0;
    return Date.now() - since > AWAY_TAKEOVER_MS;
  }

  private schedule() {
    const g = this.data?.game;
    if (this.botTimer) clearTimeout(this.botTimer);
    if (this.readyTimer) clearTimeout(this.readyTimer);
    this.botTimer = null;
    this.readyTimer = null;
    if (!g || g.phase === 'gameOver') return;
    const waiting = waitingFor(g);
    const auto = waiting.find((pid) => this.autoPlayer(pid));
    if (auto) {
      this.botTimer = setTimeout(() => this.runAuto(auto), BOT_DELAY_MS);
      return;
    }
    // Người vắng chưa quá hạn: hẹn kiểm tra lại
    if (waiting.some((pid) => !this.data!.seats.find((s) => s.id === pid)?.connected)) {
      this.botTimer = setTimeout(() => this.schedule(), AWAY_TAKEOVER_MS);
    }
    // Màn giới thiệu/kết quả: tự sang bước tiếp nếu chờ quá lâu
    if (g.phase === 'battleIntro' || g.phase === 'battleResult') {
      this.readyTimer = setTimeout(() => {
        const game = this.data?.game;
        if (!game) return;
        let s = game;
        for (const pid of waitingFor(s)) {
          const r = applyAction(s, { type: 'ready', pid });
          if (r.ok) s = r.state;
        }
        this.data!.game = s;
        this.save();
        this.broadcast();
        this.schedule();
      }, READY_TIMEOUT_MS);
    }
  }

  private runAuto(pid: string) {
    const d = this.data;
    if (!d?.game) return;
    const a = botAction(d.game, pid);
    let next = d.game;
    if (a) {
      const r = applyAction(d.game, a);
      if (r.ok) next = r.state;
      else {
        const end = applyAction(d.game, { type: 'ketThucLuot', pid });
        if (end.ok) next = end.state;
      }
    }
    d.game = next;
    this.save();
    this.broadcast();
    this.schedule();
  }
}
