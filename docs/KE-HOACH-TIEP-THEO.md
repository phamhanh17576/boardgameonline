# Kế hoạch — thiết kế lại theo tranh Đông Hồ

**Trạng thái: đã xong** (đã gộp vào `main`, đã đưa lên Cloudflare, đã cập nhật bản xem trước trên claude.ai).

## Đã làm
- 17 trận có nguồn Toàn thư/Cương mục; chủ phòng chọn 2/3/4/6/8 trận, rút ngẫu nhiên, xếp theo năm.
- 8 chân dung anh hùng kiểu Đông Hồ (Figma AI) — `src/client/art/heroes/`.
- Giao diện 2D Đông Hồ: `styles.css`, `theme.ts`, bộ icon `ui/Icon.tsx`, font Bevan + Pridi + Be Vietnam Pro.
- Sa bàn 3D: vật liệu toon + viền mực (`scene/toon.tsx`), bàn gỗ và bản đồ giấy dó (`Table.tsx`),
  chiến trường theo địa hình (`Battlefield.tsx`), bàn người chơi có tượng in chân dung (`PlayerBoard.tsx`),
  lính gỗ (`Troops.tsx`), giấy màu/mực (`Fx.tsx`), không dùng hậu kỳ phát sáng (`Scene.tsx`).
- Chơi với máy có thể chỉ định trận: `?tran=bachDang1288,chiLang1427`.

## Ý tưởng làm tiếp
- Cho chủ phòng chọn trận cụ thể ngay trong sảnh (giáo viên dạy theo bài).
- Thêm anh hùng các thời Lý, Lê sơ, Tây Sơn (Lý Thường Kiệt, Lê Lợi, Quang Trung).
- In bản giấy: xuất thẻ anh hùng, thẻ trận, bàn chơi ra PDF khổ A4 để chơi trên lớp.
