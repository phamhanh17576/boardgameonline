# Kế hoạch làm tiếp — thiết kế lại theo tranh Đông Hồ

Nhánh đang làm: `thiet-ke-dong-ho` (bản trên `main` và Cloudflare vẫn là bản cũ, đang chạy tốt).

## Đã xong trên nhánh này
- 17 trận có nguồn Toàn thư/Cương mục, chủ phòng chọn 2/3/4/6/8 trận, rút ngẫu nhiên xếp theo năm (`src/engine/content/battles.ts`, engine đã cân bằng, test qua).
- 8 avatar Đông Hồ (Figma AI): `src/client/art/heroes/*.webp`, `src/client/art/index.ts` (AVATAR, AVATAR_SM). Ảnh gốc: `art/raw/`.
- Font Bevan (tiêu đề) + Pridi (đọc sử) đã cài npm; cần import trong `src/client/main.tsx` (thay Noto Serif):
  `@fontsource/bevan/vietnamese-400.css`, `latin-400.css`; `@fontsource/pridi/vietnamese-400.css`, `latin-400.css`, `vietnamese-600.css`, `latin-600.css`.
- Giao diện 2D viết lại xong: `styles.css`, `theme.ts` (INK, PAPER, DIEP, CHAM, SON, HOE, LA), `ui/Icon.tsx` (bộ icon SVG), `ui/common.tsx`, `Home`, `Lobby` (chọn số trận), `GameHud`, `Panels`, `Modals`, `Guide`.
- `scene/toon.tsx` (vật liệu toon, viền mực `<Ink/>`, `InkCtx`, canvasTexture, speckle, cloud), `scene/Table.tsx` (bàn gỗ + bản đồ giấy dó).

## Còn phải làm (theo thứ tự)
1. **`scene/Battlefield.tsx`** (đã xoá bản cũ, cần viết lại): đế sa bàn W=11.4 × D=7.2 có texture theo địa hình; núi đá vôi (LatheGeometry) phía xa; theo `BATTLES[id].terrain`:
   - `river`: nước chàm có sóng vảy cá (canvas texture trượt), thủy triều rút khi `battleResolved` (y 0.06 → -0.32), cọc gỗ cho `bachDang938`, `bachDang1288`, `chiLang981` (số cọc theo Gỗ đã góp), nước ngả đỏ khi thắng Bạch Đằng 1288; thuyền giặc thân cong (ExtrudeGeometry) có buồm nẹp tre; thuyền nhẹ quân ta màu son.
   - `marsh`: nước rộng màu xanh rêu, lau sậy instanced, thuyền độc mộc.
   - `pass`: đường đất, núi hai bên, cổng ải đá có mái cong.
   - `citadel`: tường thành vuông, 4 tháp, cổng có mái 2 tầng; thắng thì cờ giặc hạ, cờ son kéo lên.
   - `plain`: ruộng vàng/xanh có bờ, nhà mái cong (`Roof` ExtrudeGeometry đầu đao vểnh), lều trại giặc.
   - Quân giặc: lính gỗ thân xám chàm hoặc thuyền; thắng thì đổ nghiêng/chìm so le, thua thì tiến lên bờ ta.
   - Burst dùng màu `'paper'` (giấy màu) hoặc `'ink'` (mực).
   - Export `Soldier`, `Roof`, `House`, `Karst` để dùng lại.
2. **`scene/PlayerBoard.tsx`**: khay gỗ lục giác toon + `<Ink/>`, ô đất toon màu `TERRAIN_COLOR` có trang trí (cây tán tròn, núi, nhà mái cong, nét ruộng, sóng); **tượng đứng in avatar** (`AVATAR[heroId]` làm texture, khung mực, đế gỗ, dùng `<Billboard lockX lockZ>`); nhãn tên dùng `.name-plate` + avatar nhỏ.
3. **`scene/Troops.tsx`**: dùng `Soldier` thân màu `HEROES[heroId].color`, nón vàng hoè, bỏ `GOLD`.
4. **`scene/Fx.tsx`**: burst nhận màu `'paper'` → hạt vuông nhiều màu (son, hoè, chàm, lá), `'ink'` → mực đen; bỏ AdditiveBlending; ring màu son/chàm không phát sáng.
5. **`scene/Scene.tsx`**: nền `PAPER`, sương cùng màu; bỏ EffectComposer/Bloom; `gl antialias`; `InkCtx.Provider value={!low}`; đèn hemisphere ấm + directional đổ bóng mềm; FxDirector bỏ emoji trong floatText (dùng chữ: "+3 Lúa").
6. Sửa mọi chỗ còn import `GOLD`, `LACQUER_*` từ theme. Chạy `npm run typecheck`, `npm test`.
7. Chụp ảnh kiểm tra (Playwright, script trong scratchpad cũ: `shot-local.cjs`, `play-full.cjs`, `guide-shot.cjs`; chạy `npx wrangler dev` trước) ở máy tính + điện thoại, sửa lỗi.
8. Gộp vào `main`, `npm run build && CI=1 npx wrangler deploy` (đăng nhập lại: `npx wrangler login --device --browser=false`, gửi mã cho người dùng), cập nhật bản xem trước claude.ai (`npm run build:single`, chuyển `dist-single/index.html` sang dạng artifact, publish lại URL https://claude.ai/artifact/S1PHYG8N5Q6iZc7twWwbDi).
