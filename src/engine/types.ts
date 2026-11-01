// Kiểu dữ liệu dùng chung cho engine luật chơi "Hào Khí Ngàn Năm".
// Engine là hàm thuần (pure): nhận state + action, trả về state mới.

export type Res = 'lua' | 'go' | 'sat' | 'tien';
export const RES_KEYS: Res[] = ['lua', 'go', 'sat', 'tien'];
export type Resources = Record<Res, number>;

export type Terrain = 'ruong' | 'rung' | 'nui' | 'song' | 'lang';
export const TERRAINS: Terrain[] = ['ruong', 'rung', 'nui', 'song', 'lang'];
/** Lãnh địa: khoá "q,r" (toạ độ lục giác axial) -> địa hình */
export type Territory = Record<string, Terrain>;

export type HeroId =
  | 'tranHungDao'
  | 'tranQuangKhai'
  | 'tranKhanhDu'
  | 'tranQuocToan'
  | 'tranThuDo'
  | 'haiBaTrung'
  | 'baTrieu'
  | 'nguyenTrai';

export type BattleId =
  | 'haiBaTrung40'
  | 'baTrieu248'
  | 'lyBi542'
  | 'daTrach548'
  | 'bachDang938'
  | 'dinh968'
  | 'chiLang981'
  | 'ungChau1075'
  | 'nhuNguyet1077'
  | 'dongBoDau1258'
  | 'chuongDuong1285'
  | 'vanDon1288'
  | 'bachDang1288'
  | 'totDong1426'
  | 'chiLang1427'
  | 'dongQuan1427'
  | 'ngocHoi1789';

export type BattleTerrain = 'river' | 'pass' | 'citadel' | 'marsh' | 'plain';

export type StratId = 'coHieu' | 'tiepVien' | 'vuonKhong' | 'muaMang' | 'dienHong' | 'renBinh';

export type TitleId =
  | 'vanThang'
  | 'nhanChu'
  | 'hienTai'
  | 'truCot'
  | 'binhPhap'
  | 'thuyQuan'
  | 'nuiSong'
  | 'khoLam';

/** Ghi chú nguồn sử cho mỗi thông tin hiển thị trong game. */
export interface SourceNote {
  /** CS = chính sử, TT = tương truyền / văn học / còn tranh luận */
  tag: 'CS' | 'TT';
  /** Tên nguồn, ví dụ "Đại Việt sử ký toàn thư, Bản kỷ, Kỷ nhà Trần" */
  source: string;
  /** Đã đối chiếu với nguyên văn bản dịch hay chưa */
  verified: boolean;
}

export interface SkillDef {
  name: string;
  text: string;
  why: string;
  note: SourceNote;
}

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  era: string;
  role: string;
  difficulty: 1 | 2 | 3;
  vo: number;
  thu: number;
  muu: number;
  passive: SkillDef;
  ultimate: SkillDef & { needsTarget?: boolean; options?: { id: 'a' | 'b'; label: string }[] };
  drawbacks: SkillDef[];
  rightBattles: BattleId[];
  /** Màu nhấn của tượng / quân */
  color: string;
  quote?: { text: string; note: SourceNote };
  dsm: number;
  start?: { troops?: number; res?: Partial<Resources> };
}

export type GeneralAbility =
  | 'riverVo' // +1 Võ trong trận có sông
  | 'enemyMinus1' // Sức địch -1 nếu có quân ở chiến trường
  | 'noLossPenalty' // Trận thua: không bị trừ ★ vì ít đóng góp
  | 'incomeTien' // Thu thuế: +1 Tiền
  | 'moBinhPlus' // Mộ binh: +1 Quân
  | 'dotKichThu'; // +2 Thủ khi bị Đột kích

export interface GeneralDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  cost: Partial<Resources>;
  bonus: Res | null;
  vo: number;
  thu: number;
  star: number;
  ability?: GeneralAbility;
  abilityText?: string;
  bio: string;
  note: SourceNote;
  isUnit: boolean;
  copies: number;
}

export interface StratDef {
  id: StratId;
  name: string;
  timing: 'attack' | 'defense' | 'instant';
  text: string;
  copies: number;
}

export interface BattleDef {
  id: BattleId;
  name: string;
  year: string;
  /** Dùng để xếp các trận theo thứ tự thời gian */
  sortYear: number;
  era: string;
  terrain: BattleTerrain;
  enemy: string;
  enemyCommander: string;
  ourCommander: string;
  /** Độ khó riêng của trận (cộng vào sức địch mỗi người chơi) */
  difficulty: number;
  river: boolean;
  tacticBase: Partial<Resources>;
  tacticName: string;
  tacticWhy: string;
  rightHeroes: HeroId[];
  intro: string;
  dienBien: string[];
  yNghia: string;
  note: SourceNote;
  /** Thắng trận này thì trận sau bị giảm Sức địch (x số người chơi) */
  chain?: { battle: BattleId; minusPerPlayer: number; text: string };
  rewardFirst: number;
  rewardSecond: number;
}

export interface TitleDef {
  id: TitleId;
  name: string;
  text: string;
  star: number;
}

export interface StarEntry {
  amount: number;
  reason: string;
}

export interface PlayerState {
  id: string;
  name: string;
  heroId: HeroId;
  isBot: boolean;
  seat: number;
  res: Resources;
  /** Quân trong tay (chưa ra trận) */
  reserve: number;
  territory: Territory;
  generals: string[];
  reserved: string[];
  strats: StratId[];
  longDan: number;
  star: number;
  starLog: StarEntry[];
  chienCong: number;
  /** Có thẻ Phục thù với những người này */
  revengeVs: string[];
  prevTurnTargets: string[];
  curTurnTargets: string[];
  ultUsedBattle: boolean;
  villageDone: string[];
  stats: { firstPlaces: number; tacticBattles: number; battlesWithTroops: number; attacksWon: number };
}

export interface BattleState {
  id: BattleId;
  troops: Record<string, number>;
  tactic: Record<string, Resources>;
  enemyMod: number;
  /** Ghi nhận hiệu ứng đặc biệt đang chờ khi giải quyết trận */
  khaiHoan: string[]; // người kích hoạt "Tụng giá hoàn kinh sư"
  binhNgo: string[]; // người kích hoạt "Bình Ngô đại cáo"
}

export type AttackMode = 'tranhCong' | 'dotKich';

export interface CombatState {
  attackerId: string;
  defenderId: string;
  mode: AttackMode;
  bids: Record<string, number | null>;
  strats: Record<string, StratId | null>;
}

export interface CombatResult {
  attackerId: string;
  defenderId: string;
  mode: AttackMode;
  atk: number;
  def: number;
  atkBid: number;
  defBid: number;
  atkStrat: StratId | null;
  defStrat: StratId | null;
  attackerWon: boolean;
  troopsRemoved: number;
  stolen: Partial<Resources>;
  usesMuu: boolean;
}

export interface BattleResult {
  battleId: BattleId;
  won: boolean;
  power: number;
  enemy: number;
  tacticComplete: boolean;
  contributions: { playerId: string; troops: number; tactic: number; total: number; stars: number; reasons: string[] }[];
  rightHeroPlayers: string[];
  chainApplied: boolean;
}

export type GamePhase = 'battleIntro' | 'action' | 'combat' | 'choice' | 'battleResult' | 'gameOver';

export interface TurnState {
  playerId: string;
  actionTaken: boolean;
  stratPlayed: boolean;
  extraDieuQuan: number;
  extraAttack: number;
  number: number;
}

export interface GameEvent {
  seq: number;
  type:
    | 'battleStart'
    | 'turnStart'
    | 'tilePlaced'
    | 'income'
    | 'generalBought'
    | 'generalReserved'
    | 'troopsRecruited'
    | 'troopsMoved'
    | 'tacticCommitted'
    | 'attackDeclared'
    | 'combatResolved'
    | 'stratPlayed'
    | 'ultimate'
    | 'battleResolved'
    | 'gameOver'
    | 'info';
  playerId?: string;
  targetId?: string;
  data?: Record<string, unknown>;
  text: string;
}

export interface FinalScore {
  playerId: string;
  total: number;
  base: number;
  regions5: number;
  longDan: number;
  titles: { id: TitleId; star: number }[];
  rank: number;
}

export interface GameState {
  version: 1;
  seed: number;
  rngState: number;
  phase: GamePhase;
  players: PlayerState[];
  order: string[];
  battleOrder: BattleId[];
  battleIndex: number;
  round: number;
  roundsPerBattle: number;
  turnIndex: number;
  turn: TurnState;
  turnCounter: number;
  battle: BattleState;
  wonBattles: BattleId[];
  landDeck: Terrain[];
  landRow: Terrain[];
  generalDecks: Record<1 | 2 | 3, string[]>;
  market: Record<1 | 2 | 3, string[]>;
  stratDeck: StratId[];
  stratDiscard: StratId[];
  combat: CombatState | null;
  lastCombat: CombatResult | null;
  pendingChoice: { playerId: string; options: StratId[] } | null;
  ready: string[];
  lastResult: BattleResult | null;
  titles: TitleId[];
  events: GameEvent[];
  eventSeq: number;
  final: FinalScore[] | null;
}

export type Action =
  | { type: 'ready'; pid: string }
  | { type: 'khaiHoang'; pid: string; start: number; cells: [string, string] }
  | { type: 'thuThue'; pid: string }
  | { type: 'chieuHien'; pid: string; generalId: string }
  | { type: 'giuCho'; pid: string; generalId: string }
  | { type: 'moBinh'; pid: string; count: number }
  | { type: 'dieuQuan'; pid: string; troops: number; tactic: Partial<Resources> }
  | { type: 'tanCong'; pid: string; targetId: string; mode: AttackMode }
  | { type: 'datSat'; pid: string; amount: number; strat: StratId | null }
  | { type: 'muuKe'; pid: string }
  | { type: 'chonKeSach'; pid: string; strat: StratId }
  | { type: 'keSach'; pid: string; strat: StratId }
  | { type: 'tuyetKy'; pid: string; option?: 'a' | 'b'; targetId?: string }
  | { type: 'ketThucLuot'; pid: string };

export interface PlayerSetup {
  id: string;
  name: string;
  heroId: HeroId;
  isBot: boolean;
}

export interface GameOptions {
  seed: number;
  players: PlayerSetup[];
  roundsPerBattle?: number;
  /** Số trận rút ngẫu nhiên (mặc định 4) — bỏ qua nếu có battleOrder */
  battleCount?: number;
  battleOrder?: BattleId[];
}

/** Trạng thái đã ẩn thông tin bí mật, gửi cho từng người chơi. */
export interface GameView extends Omit<GameState, 'players' | 'landDeck' | 'generalDecks' | 'stratDeck' | 'combat' | 'rngState'> {
  players: (Omit<PlayerState, 'strats'> & { strats: StratId[] | null; stratCount: number })[];
  landDeckCount: number;
  generalDeckCounts: Record<1 | 2 | 3, number>;
  stratDeckCount: number;
  combat: (Omit<CombatState, 'bids' | 'strats'> & { submitted: string[]; myBid: number | null }) | null;
  viewerId: string | null;
}
