// Phòng chơi chạy ngay trong trình duyệt (chơi với máy, không cần máy chủ).
// Xử lý cùng bộ tin nhắn như Durable Object để giao diện dùng chung.
import { applyAction, botAction, viewFor, waitingFor, type GameState } from '../engine';
import {
  addBotSeat,
  canStart,
  cleanName,
  cleanSettings,
  DEFAULT_SETTINGS,
  freeHeroes,
  startFromSeats,
  type ClientMsg,
  type RoomSettings,
  type Seat,
  type ServerMsg,
} from './protocol';

const BOT_DELAY_MS = 750;

export class LocalRoom {
  private seats: Seat[] = [];
  private game: GameState | null = null;
  private settings: RoomSettings = DEFAULT_SETTINGS;
  private nextId = 1;
  private you = 'p0';
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(private emit: (m: ServerMsg) => void) {}

  send(msg: ClientMsg) {
    queueMicrotask(() => this.handle(msg));
  }

  close() {
    if (this.timer) clearTimeout(this.timer);
  }

  private err(message: string) {
    this.emit({ t: 'error', message });
  }

  private push() {
    this.emit({ t: 'lobby', lobby: { code: 'MAY', hostId: this.you, seats: this.seats, started: !!this.game, settings: this.settings } });
    if (this.game) this.emit({ t: 'state', view: viewFor(this.game, this.you) });
  }

  private handle(msg: ClientMsg) {
    switch (msg.t) {
      case 'hello': {
        if (!this.seats.some((s) => s.id === this.you)) {
          this.seats.push({ id: this.you, name: cleanName(msg.name), heroId: null, isBot: false, connected: true });
          for (let i = 0; i < 4; i++) addBotSeat(this.seats, `b${this.nextId++}`);
        }
        this.emit({ t: 'welcome', you: this.you, token: 'local' });
        break;
      }
      case 'pickHero': {
        const me = this.seats.find((s) => s.id === this.you)!;
        if (me.heroId === msg.heroId) break;
        const bot = this.seats.find((s) => s.isBot && s.heroId === msg.heroId);
        if (bot) bot.heroId = me.heroId ?? freeHeroes(this.seats).filter((h) => h !== msg.heroId)[0] ?? null;
        else if (!freeHeroes(this.seats).includes(msg.heroId)) return this.err('Anh hùng này đã có người chọn.');
        me.heroId = msg.heroId;
        if (bot && !bot.heroId) this.seats = this.seats.filter((s) => s !== bot);
        break;
      }
      case 'addBot':
        if (this.game) return this.err('Ván đã bắt đầu.');
        if (!addBotSeat(this.seats, `b${this.nextId++}`)) return this.err('Không thể thêm máy (đủ 6 người hoặc hết anh hùng).');
        break;
      case 'removeSeat':
        if (this.game) return this.err('Ván đã bắt đầu.');
        this.seats = this.seats.filter((s) => s.id !== msg.id || !s.isBot);
        break;
      case 'start': {
        const why = canStart(this.seats);
        if (why) return this.err(why);
        this.game = startFromSeats(this.seats, this.settings);
        break;
      }
      case 'action': {
        if (!this.game) return this.err('Ván chưa bắt đầu.');
        const r = applyAction(this.game, msg.action);
        if (!r.ok) return this.err(r.error);
        this.game = r.state;
        break;
      }
      case 'settings':
        if (this.game) return this.err('Ván đã bắt đầu.');
        this.settings = cleanSettings(this.settings, msg.settings ?? {});
        break;
      case 'backToLobby':
        this.game = null;
        break;
      case 'chat':
        this.emit({ t: 'chat', from: this.seats.find((s) => s.id === this.you)?.name ?? 'Bạn', text: msg.text, at: Date.now() });
        return;
      case 'ping':
        return this.emit({ t: 'pong' });
    }
    this.push();
    this.schedule();
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const g = this.game;
    if (!g || g.phase === 'gameOver') return;
    const bot = waitingFor(g).find((pid) => this.seats.find((s) => s.id === pid)?.isBot);
    if (!bot) return;
    this.timer = setTimeout(() => {
      if (!this.game) return;
      const a = botAction(this.game, bot);
      const r = a ? applyAction(this.game, a) : null;
      if (r?.ok) this.game = r.state;
      else {
        const end = applyAction(this.game, { type: 'ketThucLuot', pid: bot });
        if (end.ok) this.game = end.state;
      }
      this.push();
      this.schedule();
    }, BOT_DELAY_MS);
  }
}
