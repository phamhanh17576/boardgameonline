import type { BattleDef, BattleId, GeneralDef, SourceNote, StratDef, StratId, TitleDef, TitleId } from '../types';

const TT = (where: string): SourceNote => ({ tag: 'CS', source: `Đại Việt sử ký toàn thư, ${where}`, verified: true });
const UNIT: SourceNote = { tag: 'TT', source: 'Binh chủng chung (không phải nhân vật lịch sử)', verified: true };

// ---------------------------------------------------------------- Tướng phụ
export const GENERALS: Record<string, GeneralDef> = {
  // Tầng I — binh chủng
  danBinh: { id: 'danBinh', name: 'Dân binh hương ấp', tier: 1, cost: { lua: 2 }, bonus: 'lua', vo: 1, thu: 1, star: 0, bio: 'Thời Trần, vương hầu được mộ gia đồng, hương binh, thổ hào làm quân cần vương.', note: TT('Bản kỷ q.5, lời bàn của Ngô Sĩ Liên'), isUnit: true, copies: 2 },
  thuyBinh: { id: 'thuyBinh', name: 'Thủy binh', tier: 1, cost: { go: 2, lua: 1 }, bonus: 'go', vo: 1, thu: 0, star: 0, ability: 'riverVo', abilityText: '+1 Võ ở trận có sông', bio: 'Quân Trần đánh giặc chủ yếu trên sông nước bằng thuyền nhẹ.', note: UNIT, isUnit: true, copies: 2 },
  cungNo: { id: 'cungNo', name: 'Cung nỏ thủ', tier: 1, cost: { sat: 2, go: 1 }, bonus: 'sat', vo: 1, thu: 1, star: 0, bio: 'Cung nỏ là vũ khí tầm xa quan trọng của quân đội Đại Việt.', note: UNIT, isUnit: true, copies: 2 },
  thoRen: { id: 'thoRen', name: 'Thợ rèn binh khí', tier: 1, cost: { go: 2, lua: 1 }, bonus: 'sat', vo: 0, thu: 1, star: 0, bio: 'Rèn giáo mác, sửa sang khí giới cho quân.', note: UNIT, isUnit: true, copies: 2 },
  thuongNhan: { id: 'thuongNhan', name: 'Thương nhân Vân Đồn', tier: 1, cost: { lua: 2, go: 1 }, bonus: 'tien', vo: 0, thu: 0, star: 0, ability: 'incomeTien', abilityText: 'Thu thuế: +1 Tiền', bio: 'Toàn thư chép người Vân Đồn lấy buôn bán làm nghề sinh sống.', note: TT('Bản kỷ q.5, đầu 1288'), isUnit: true, copies: 2 },
  kyBinh: { id: 'kyBinh', name: 'Kỵ binh', tier: 1, cost: { sat: 2, lua: 1 }, bonus: 'tien', vo: 2, thu: 0, star: 0, bio: 'Quân cưỡi ngựa đánh nhanh trên bộ.', note: UNIT, isUnit: true, copies: 2 },

  // Tầng II — tướng tài (đều có trong Toàn thư)
  yetKieu: { id: 'yetKieu', name: 'Yết Kiêu', tier: 2, cost: { go: 3, lua: 2 }, bonus: 'go', vo: 2, thu: 0, star: 1, ability: 'enemyMinus1', abilityText: 'Có quân ở trận: Sức địch −1', bio: 'Gia nô của Hưng Đạo Vương. Năm 1285 ông giữ thuyền chờ chủ ở bến Bãi Tân, giúp Vương thoát khỏi quân kỵ đuổi theo.', note: TT('Bản kỷ q.5, năm Ất Dậu 1285'), isUnit: false, copies: 1 },
  daTuong: { id: 'daTuong', name: 'Dã Tượng', tier: 2, cost: { sat: 3, lua: 2 }, bonus: 'sat', vo: 2, thu: 1, star: 1, bio: 'Gia nô của Hưng Đạo Vương, theo Vương ra trận; về sau có công trong việc dẹp Ô Mã Nhi, Toa Đô.', note: TT('Bản kỷ q.5 (1285) và q.6 (1300)'), isUnit: false, copies: 1 },
  lePhuTran: { id: 'lePhuTran', name: 'Lê Phụ Trần', tier: 2, cost: { lua: 3, tien: 2 }, bonus: 'lua', vo: 1, thu: 2, star: 2, bio: 'Năm 1258 ở Bình Lệ Nguyên, ông một mình một ngựa xông vào trận giặc, nét mặt tự nhiên; khi vua lui quân, ông lấy ván thuyền che tên cho vua.', note: TT('Bản kỷ q.5, tháng Chạp năm Đinh Tỵ'), isUnit: false, copies: 1 },
  doKhacChung: { id: 'doKhacChung', name: 'Đỗ Khắc Chung', tier: 2, cost: { tien: 3, lua: 1 }, bonus: 'tien', vo: 0, thu: 1, star: 2, ability: 'dotKichThu', abilityText: '+2 Thủ khi bị Đột kích', bio: 'Năm 1285 ông xin đi sứ trại giặc, đối đáp với Ô Mã Nhi: "Chó nhà cắn người lạ, đâu phải ý chủ." Ô Mã Nhi khen: "Nước ấy có người tài, chưa dễ mưu đồ."', note: TT('Bản kỷ q.5, năm Ất Dậu 1285'), isUnit: false, copies: 1 },
  satThat: { id: 'satThat', name: 'Quân thích chữ "Sát Thát"', tier: 2, cost: { sat: 2, lua: 2, tien: 1 }, bonus: 'lua', vo: 3, thu: 0, star: 1, bio: 'Toàn thư chép năm 1285 giặc bắt được quân ta, thấy ai cũng thích hai chữ "Sát Thát" (giết giặc Thát) vào cánh tay.', note: TT('Bản kỷ q.5, năm Ất Dậu 1285'), isUnit: false, copies: 2 },
  thuyenNhe: { id: 'thuyenNhe', name: 'Đội thuyền nhẹ khiêu chiến', tier: 2, cost: { go: 3, tien: 1 }, bonus: 'go', vo: 2, thu: 0, star: 1, ability: 'riverVo', abilityText: '+1 Võ ở trận có sông', bio: 'Ở Bạch Đằng, quân ta nhân lúc nước triều lên khiêu chiến rồi giả thua, dụ giặc vào bãi cọc.', note: TT('Bản kỷ q.5, ngày 8 tháng 3 năm Mậu Tý 1288'), isUnit: false, copies: 1 },

  // Tầng III — danh tướng
  phamNguLao: { id: 'phamNguLao', name: 'Phạm Ngũ Lão', tier: 3, cost: { sat: 4, lua: 2, tien: 1 }, bonus: 'sat', vo: 3, thu: 1, star: 3, ability: 'moBinhPlus', abilityText: 'Mộ binh: +1 Quân', bio: 'Môn khách của Hưng Đạo Vương, được giao quản quân Thánh Dực hữu vệ. Ngô Sĩ Liên khen "học vấn của Phạm điện súy thấy ở câu thơ".', note: TT('Bản kỷ q.5 và q.6'), isUnit: false, copies: 1 },
  tranBinhTrong: { id: 'tranBinhTrong', name: 'Trần Bình Trọng', tier: 3, cost: { sat: 3, lua: 3, go: 1 }, bonus: 'lua', vo: 2, thu: 3, star: 3, ability: 'noLossPenalty', abilityText: 'Trận thua: không bị trừ ★ vì ít đóng góp', bio: 'Năm 1285 bị giặc bắt, không ăn, giặc hỏi có muốn làm vương đất Bắc không, ông thét: "Ta thà làm quỷ nước Nam, chứ không làm vương đất Bắc."', note: TT('Bản kỷ q.5, năm Ất Dậu 1285'), isUnit: false, copies: 1 },
  tranNhatDuat: { id: 'tranNhatDuat', name: 'Trần Nhật Duật', tier: 3, cost: { tien: 3, sat: 2, go: 2 }, bonus: 'tien', vo: 3, thu: 1, star: 3, ability: 'incomeTien', abilityText: 'Thu thuế: +1 Tiền', bio: 'Chiêu Văn Vương. Năm 1285 quân của ông có người Tống mặc áo Tống, cầm cung tên đánh giặc ở Hàm Tử.', note: TT('Bản kỷ q.5, năm Ất Dậu 1285'), isUnit: false, copies: 1 },
  nguyenKhoai: { id: 'nguyenKhoai', name: 'Nguyễn Khoái', tier: 3, cost: { sat: 3, go: 3, lua: 1 }, bonus: 'go', vo: 4, thu: 1, star: 3, ability: 'riverVo', abilityText: '+1 Võ ở trận có sông', bio: 'Ở trận Bạch Đằng 1288, ông chỉ huy quân Thánh Dực dũng nghĩa, bắt được Bình chương Áo Lỗ Xích; sau được ban đất, gọi là Khoái lộ.', note: TT('Bản kỷ q.5, năm Mậu Tý 1288'), isUnit: false, copies: 1 },
  doHanh: { id: 'doHanh', name: 'Đỗ Hành', tier: 3, cost: { sat: 2, go: 2, tien: 2 }, bonus: 'sat', vo: 3, thu: 2, star: 3, bio: 'Nội minh tự Đỗ Hành bắt được Ô Mã Nhi ở Bạch Đằng, dâng lên Thượng hoàng.', note: TT('Bản kỷ q.5, năm Mậu Tý 1288'), isUnit: false, copies: 1 },
};

export const GENERAL_IDS = Object.keys(GENERALS);

// ---------------------------------------------------------------- Kế sách
export const STRATS: Record<StratId, StratDef> = {
  coHieu: { id: 'coHieu', name: 'Cờ hiệu xung trận', timing: 'attack', text: 'Khi tấn công: +2 lực.', copies: 6 },
  tiepVien: { id: 'tiepVien', name: 'Tiếp viện', timing: 'defense', text: 'Khi bị tấn công: +3 Thủ.', copies: 6 },
  vuonKhong: { id: 'vuonKhong', name: 'Vườn không nhà trống', timing: 'defense', text: 'Khi bị tấn công mà thua: bị Đột kích thì không mất gì; bị Tranh công thì chỉ mất 1 Quân.', copies: 4 },
  muaMang: { id: 'muaMang', name: 'Mùa màng bội thu', timing: 'instant', text: 'Nhận ngay 3 Lúa.', copies: 5 },
  renBinh: { id: 'renBinh', name: 'Rèn binh khí', timing: 'instant', text: 'Nhận ngay 2 Sắt.', copies: 6 },
  dienHong: { id: 'dienHong', name: 'Hội nghị Diên Hồng', timing: 'instant', text: 'Mọi người được +1 Quân ở chiến trường; bạn +1★. ("Đều nói: Đánh! Muôn người cùng một lời.")', copies: 3 },
};
export const STRAT_IDS = Object.keys(STRATS) as StratId[];

// ---------------------------------------------------------------- Trận đánh
export const BATTLES: Record<BattleId, BattleDef> = {
  vanDon1288: {
    id: 'vanDon1288',
    name: 'Trận Vân Đồn',
    year: 'Tháng Chạp năm Đinh Hợi (đầu năm 1288)',
    enemy: 'Thủy quân và đoàn thuyền vận lương nhà Nguyên',
    enemyCommander: 'Thủy quân Nguyên (Toàn thư không ghi tên người chỉ huy đoàn thuyền lương)',
    ourCommander: 'Nhân Huệ Vương Trần Khánh Dư',
    strengthPerPlayer: 8,
    strengthBase: -8,
    river: true,
    tacticBase: { go: 2, lua: 1 },
    tacticName: 'Mai phục đánh thuyền lương',
    tacticWhy: 'Khánh Dư đoán quân giặc đã qua, thuyền vận lương ắt ở phía sau, bèn thu nhặt tàn quân chờ sẵn để đánh.',
    rightHeroes: ['tranKhanhDu'],
    intro: 'Lần thứ ba quân Nguyên sang. Thủy quân giặc phạm vào Vân Đồn; Phó tướng Trần Khánh Dư đánh bất lợi, Thượng hoàng sai trung sứ đến xích ông về. Khánh Dư xin hoãn hai ba ngày để lập công chuộc tội.',
    dienBien: [
      'Khánh Dư đoán biết quân giặc đã qua, thuyền vận lương ắt ở phía sau, bèn thu nhặt tàn quân chờ đợi.',
      'Lát sau thuyền vận lương quả nhiên đến. Quân ta đánh tan, thu được lương thực khí giới của giặc nhiều không kể xiết, bắt sống cũng rất nhiều.',
      'Thượng hoàng nói: "Thứ mà quân Nguyên trông cậy là lương thảo khí giới, nay đã bị ta lấy được." Rồi thả tù binh về doanh trại Nguyên báo tin; quân Nguyên quả nhiên rút lui.',
    ],
    yNghia: 'Đánh vào hậu cần của giặc. Toàn thư chép: năm ấy dân chúng không bị tàn phá thảm như năm trước, "Khánh Dư có dự công".',
    note: TT('Bản kỷ q.5, Kỷ nhà Trần, Nhân Tông năm Trùng Hưng thứ 3'),
    chain: { battle: 'bachDang1288', minusPerPlayer: 1, text: 'Giặc mất lương: Sức địch ở Bạch Đằng −1 mỗi người chơi.' },
    rewardFirst: 5,
    rewardSecond: 3,
  },
  bachDang1288: {
    id: 'bachDang1288',
    name: 'Trận Bạch Đằng',
    year: 'Ngày 8 tháng 3 năm Mậu Tý (9/4/1288)',
    enemy: 'Thủy quân Nguyên — Ô Mã Nhi, Áo Lỗ Xích, đoàn thuyền lương Trương Văn Hổ',
    enemyCommander: 'Ô Mã Nhi, Áo Lỗ Xích, Trương Văn Hổ',
    ourCommander: 'Hưng Đạo Vương Trần Quốc Tuấn',
    strengthPerPlayer: 8,
    strengthBase: -8,
    river: true,
    tacticBase: { go: 3, sat: 1 },
    tacticName: 'Bãi cọc gỗ phủ cỏ',
    tacticWhy: 'Hưng Đạo Vương cho cắm cọc ở sông Bạch Đằng, phủ cỏ lên trên; nhân lúc nước triều lên thì khiêu chiến giả thua; nước rút, thuyền giặc mắc cạn hết.',
    rightHeroes: ['tranHungDao'],
    intro: 'Quân Nguyên hội ở sông Bạch Đằng để đón thuyền lương của bọn Trương Văn Hổ, nhưng không gặp. Trước đó, Hưng Đạo Vương đã cho cắm cọc ở sông Bạch Đằng, phủ cỏ lên trên.',
    dienBien: [
      'Hôm ấy, nhân lúc nước triều lên, quân ta khiêu chiến rồi giả thua chạy; giặc kéo quân đuổi theo. Quân ta đánh hăng.',
      'Nước rút, thuyền giặc mắc cạn hết. Nguyễn Khoái chỉ huy quân Thánh Dực dũng nghĩa bắt được Bình chương Áo Lỗ Xích. Quân của hai vua kéo đến đánh lớn; người Nguyên chết đuối nhiều không kể xiết, nước sông vì thế đỏ ngầu.',
      'Khi Trương Văn Hổ đến, phục binh hai bờ đổ ra đánh. Nước triều rút rất nhanh, thuyền lương của Văn Hổ mắc trên cọc, lật đổ gần hết.',
      'Đỗ Hành bắt được Ô Mã Nhi dâng lên Thượng hoàng. Thoát Hoan và A Thai dẫn quân trốn về.',
    ],
    yNghia: 'Chấm dứt cuộc xâm lược lần thứ ba của nhà Nguyên. Vua Nhân Tông có thơ: "Xã tắc lưỡng hồi lao thạch mã, Sơn hà thiên cổ điện kim âu" (Xã tắc hai phen chồn ngựa đá, Non sông nghìn thuở vững âu vàng).',
    note: TT('Bản kỷ q.5, Kỷ nhà Trần, Nhân Tông năm Trùng Hưng thứ 4'),
    rewardFirst: 6,
    rewardSecond: 3,
  },
};

// ---------------------------------------------------------------- Danh hiệu
export const TITLES: Record<TitleId, TitleDef> = {
  vanThang: { id: 'vanThang', name: 'Vạn Thắng', text: 'Nhiều Chiến công nhất', star: 5 },
  nhanChu: { id: 'nhanChu', name: 'Nhân Chủ', text: 'Lòng dân cao nhất', star: 4 },
  hienTai: { id: 'hienTai', name: 'Hiền Tài Hội Tụ', text: 'Nhiều Tướng phụ nhất', star: 4 },
  truCot: { id: 'truCot', name: 'Trụ Cột Quốc Gia', text: 'Đứng hạng 1 đóng góp nhiều trận nhất', star: 4 },
  binhPhap: { id: 'binhPhap', name: 'Tinh Thông Binh Pháp', text: 'Góp Chiến thuật ở nhiều trận nhất', star: 3 },
  thuyQuan: { id: 'thuyQuan', name: 'Thủy Quân Hùng Mạnh', text: 'Vùng Sông lớn nhất', star: 3 },
  nuiSong: { id: 'nuiSong', name: 'Núi Sông Hiểm Trở', text: 'Nhiều Thành lũy nhất', star: 3 },
  khoLam: { id: 'khoLam', name: 'Kho Lẫm Đầy Đủ', text: 'Vùng Ruộng lớn nhất', star: 3 },
};
export const TITLE_IDS = Object.keys(TITLES) as TitleId[];
