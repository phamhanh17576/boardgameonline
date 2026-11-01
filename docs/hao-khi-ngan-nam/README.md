# HÀO KHÍ NGÀN NĂM

> Bản thiết kế v0.2 · 01/11/2026 · thay cho bản nháp *Vạn Thắng Vương* v0.1 (thời 12 sứ quân giờ là một trận đánh trong game này).
> **Chọn anh hùng → xây lãnh địa → chiêu mộ tướng → cùng giữ nước nhưng tranh nhau công trạng → ai nhiều Uy danh nhất thắng.**
> **4–6 người** · 60–75 phút · 12+ tuổi · thiết kế cho chơi online.
>
> 🎮 **Bản chơi thử online** (thời Trần: Vân Đồn + Bạch Đằng 1288, 8 anh hùng) nằm trong thư mục gốc của repo. Các con số trong bản thử đã được chỉnh lại sau mô phỏng 400 ván; nơi nào khác với tài liệu này thì **mã nguồn `src/engine/content/` là bản đúng**. Nội dung sử của bản thử đã đối chiếu nguyên văn Toàn thư: xem [nguon-toan-thu.md](../nguon-toan-thu.md).

| Tài liệu | Nội dung |
|---|---|
| **README.md** (file này) | Luật chơi |
| [nhan-vat.md](nhan-vat.md) | 16 anh hùng có thể chọn: kỹ năng, điểm yếu, cách cân bằng, sử liệu làm căn cứ |
| [tran-danh.md](tran-danh.md) | 18 trận đánh có thật: chỉ số trong game và phần "Sử ký" |

---

## 1. Ý tưởng cốt lõi

- Mỗi người chơi **là một anh hùng** trong sử Việt (Ngô Quyền, Lý Thường Kiệt, Trần Hưng Đạo, Quang Trung…). Mỗi người có **kỹ năng nội tại**, **tuyệt kỹ**, và nếu kỹ năng mạnh thì kèm **điểm yếu**.
- Ván chơi đi qua **4 thời đại** của lịch sử. Mỗi thời đại lật **2 trận đánh có thật** theo đúng thứ tự năm. Trận đánh có điều kiện chiến thuật theo sử: Bạch Đằng cần Gỗ để cắm cọc, Như Nguyệt cần dựng phòng tuyến, Vân Đồn đánh vào thuyền lương…
- **Vừa hợp tác vừa cạnh tranh.** Cả bàn phải cùng góp quân thì mới thắng trận. Nhưng **ai đóng góp nhiều nhất thì được nhiều điểm nhất**, nên ai cũng muốn **tranh công**: tấn công quân của người khác, đột kích hậu phương của nhau. Đánh nhau quá đà thì cả bàn thua trận.
- **Học sử trong lúc chơi:** khi lật trận, game hiện **bối cảnh**. Khi xong trận, game hiện **diễn biến thật theo sử sách**. Nếu tướng đúng lịch sử đánh trận của mình (*Đúng người đúng trận*), người đó được thưởng và game mở khóa câu nói hoặc thơ văn của nhân vật.

> **Lưu ý về tính hư cấu:** việc anh hùng các thời đại **gặp nhau** trong một ván là hư cấu của trò chơi (*"anh linh hội tụ"*). Còn **nhân vật, trận đánh, chiến thuật, năm tháng** đều theo sử sách. Mỗi thông tin được gắn nhãn **[Chính sử]** hoặc **[Tương truyền]**.

### Lấy gì từ các game bạn thích
| Game | Cơ chế lấy về |
|---|---|
| **Splendor** | Mua **Tướng phụ** bằng tài nguyên; mỗi tướng cho **giảm giá vĩnh viễn** nên càng chơi càng mạnh |
| **Harmonies** | Xếp ô địa hình lên **lãnh địa** cá nhân, tạo **hình mẫu** để sinh tài nguyên, thành lũy và điểm |
| **Cuộc đua sao chổi** | **Kế sách** để công và thủ; đột kích cướp đồ của nhau |
| Game chọn nhân vật | Mỗi anh hùng một lối chơi riêng, cân bằng bằng **điểm yếu** |

---

## 2. Thành phần

| Thành phần | Ghi chú |
|---|---|
| **16 thẻ Anh hùng** | Xem [nhan-vat.md](nhan-vat.md) |
| **Bảng Lãnh địa** cá nhân | Lưới lục giác 19 ô |
| **100 ô Địa hình** | 🟨 Ruộng · 🟩 Rừng · ⬜ Núi · 🟦 Sông · 🟥 Làng |
| **Tài nguyên** | 🌾 Lúa · 🪵 Gỗ · ⛏️ Sắt · 🪙 Tiền |
| **Quân** 🪖 | Mỗi người 15 quân |
| **18 thẻ Trận đánh** | Chia làm 4 thời đại. Xem [tran-danh.md](tran-danh.md) |
| **48 thẻ Tướng phụ** | 3 tầng, đều là nhân vật lịch sử hoặc binh chủng có thật |
| **30 thẻ Kế sách** | |
| **8 thẻ Danh hiệu** | Mỗi ván dùng 3 |
| **Thanh Lòng dân** | Mỗi người một thanh, từ 0 đến 10, bắt đầu ở 5 |

---

## 3. Chuẩn bị

1. Mỗi người **chọn 1 Anh hùng**. Không ai được chọn trùng. Thiếu người thì thêm **máy chơi cùng** cho đủ 4–6.
2. Mỗi người nhận 3 ô khởi đầu (Ruộng, Rừng, Núi), **2 🌾, 1 🪙, 2 Quân**, cộng thêm thay đổi riêng nếu thẻ Anh hùng có ghi.
3. Chia thẻ Trận đánh theo 4 thời đại. Mỗi thời đại **rút ngẫu nhiên 2 trận rồi xếp theo thứ tự năm**. Tổng cộng 8 trận.
   *(Chế độ "Sử thi": chơi đủ 18 trận, khoảng 2,5 giờ.)*
4. Lật 6 ô vào **Chợ đất**, và lật 4 Tướng phụ ở mỗi tầng vào **Chợ tướng**.
5. Lật ngẫu nhiên 3 **Danh hiệu**. Mỗi người rút 2 **Kế sách**, giữ 1.

---

## 4. Cấu trúc ván chơi

```
Thời đại I → II → III → IV
  └─ mỗi thời đại có 2 Trận đánh
       └─ mỗi Trận:  ① Lật trận  →  ② 2 vòng hành động  →  ③ Giải quyết trận
```

### ① Lật trận
Lật thẻ Trận đánh tiếp theo và đặt lên **Chiến trường**. Game hiện phần **Bối cảnh** (2–3 câu). Thẻ trận ghi:
- **Năm, phe địch, tướng chỉ huy hai bên**
- **Sức địch**: ví dụ *4 × số người chơi*
- **Địa hình**: 🟦 Sông, ⬜ Núi, 🏯 Thành, 🟥 Làng. Một số kỹ năng anh hùng phụ thuộc vào địa hình
- **Chiến thuật lịch sử**: các tài nguyên cần góp vào để mô phỏng chiến thuật thật. Ví dụ Bạch Đằng 938 cần *3 🪵 + 1 ⛏️* (cọc gỗ đầu bịt sắt)
- **Đúng người đúng trận**: tên anh hùng đã chỉ huy trận này trong lịch sử

### ② Hai vòng hành động
Mỗi người đi **2 lượt** cho mỗi trận. Mỗi lượt gồm **1 hành động chính**, cộng thêm **tối đa 1 Kế sách**.

| # | Hành động | Mô tả |
|---|---|---|
| A | **Khai hoang** 🌱 | Lấy 2 ô liền nhau trong Chợ đất, đặt vào lãnh địa (phải kề ô đã có). Ô đầu hàng giá 1 🪙 |
| B | **Thu thuế** 🌾 | Nhận tài nguyên từ các vùng trong lãnh địa (bảng ở phần 5). Giữ tối đa 10 tài nguyên |
| C | **Chiêu hiền** 🧑‍✈️ | Mua 1 Tướng phụ: trả giá in trên thẻ trừ đi giảm giá. Hoặc trả 1 🪙 để giữ chỗ một thẻ (giữ tối đa 2) |
| D | **Mộ binh** 🪖 | Trả 1 🌾 cho mỗi Quân, tối đa 3 Quân |
| E | **Điều quân** 🚩 | Đưa tối đa 4 Quân ra chiến trường, **và/hoặc** góp tài nguyên vào **ô Chiến thuật** của trận |
| F | **Tấn công** ⚔️ | **Tranh công** hoặc **Đột kích hậu phương** người chơi khác (phần 6) |
| G | **Mưu kế** 📜 | Rút 2 Kế sách, giữ 1 (giới hạn số Kế sách trên tay = chỉ số Mưu của anh hùng) |

### ③ Giải quyết trận
1. **Lực phe ta** = tổng Quân của mọi người trên chiến trường + **Võ** của anh hùng và Tướng phụ của những người **có quân trên chiến trường**.
2. Nếu **ô Chiến thuật đã góp đủ** thì Sức địch giảm **30%** (làm tròn lên). Đây là cái lợi của việc đánh đúng cách người xưa đã đánh.
3. **Lực phe ta ≥ Sức địch thì thắng trận.**

**Khi thắng**, tính **Đóng góp** của từng người: số Quân trên chiến trường cộng số tài nguyên đã góp vào ô Chiến thuật.

| Thứ hạng đóng góp | Thưởng |
|---|---|
| Hạng 1 | ★ Lớn (ghi trên thẻ, thường là 5) |
| Hạng 2 | ★ Vừa (thường là 3) |
| Những người khác có góp | 1★ |
| Mỗi người đã góp **tài nguyên vào ô Chiến thuật** | +1★ (*hiểu binh pháp*) |
| **Đúng người đúng trận** (nếu anh hùng đó có góp quân) | +2★, đồng thời mở khóa câu nói hoặc thơ văn của nhân vật |

Bằng điểm đóng góp thì người có nhiều tài nguyên Chiến thuật hơn xếp trên. Vẫn bằng nữa thì chia đều, làm tròn xuống.

**Khi thua**: tất cả −1 Lòng dân. Người **đóng góp ít nhất** (kể cả người không góp gì) **−2★**, vì *giặc đến nhà mà không ra sức*.

**Sau trận:** mỗi người mất **một nửa số Quân** đã đưa ra (làm tròn lên); số còn lại trở về. Tài nguyên đã góp vào Chiến thuật thì mất hẳn.
Sau đó game hiện **Sử ký** của trận: diễn biến thật, kết quả, ý nghĩa và nguồn. Nếu bàn chơi thua trong khi lịch sử thắng, game ghi: *"Trên thực tế, cha ông đã chiến thắng nhờ…"*

---

## 5. Lãnh địa và hình mẫu

Một **vùng** là các ô **cùng loại nằm liền nhau**.

| Địa hình | Thu thuế |
|---|---|
| 🟨 Ruộng → 🌾 | Mỗi vùng cho số ô của vùng (tối đa 3); +1 nếu vùng kề Sông |
| 🟩 Rừng → 🪵 | Mỗi vùng cho số ô (tối đa 3) |
| ⬜ Núi → ⛏️ | Mỗi vùng cho số ô (tối đa 3) |
| 🟥 Làng → 🪙 | Mỗi Làng kề ít nhất 2 loại địa hình khác nhau cho 1 🪙 |
| 🟦 Sông | Không sinh tài nguyên, nhưng nhiều anh hùng và hình mẫu cần đến |

| Hình mẫu | Hiệu quả |
|---|---|
| Vùng Núi từ 3 ô | **Thành lũy**: +2 Thủ |
| Vùng Sông từ 3 ô | **Thủy trại**: +1 Võ trong các trận có 🟦 |
| Làng có đủ 6 ô xung quanh | **Ấp đông dân**: +1 Lòng dân (một lần) |
| Vùng bất kỳ từ 5 ô | Cuối game +2★ |

> 💡 Chỗ phải tính toán: vùng chỉ tính tối đa 3 ô, nên nhiều vùng nhỏ cho nhiều tài nguyên hơn. Nhưng Thành lũy, Thủy trại và Danh hiệu lại cần vùng to.

---

## 6. Tấn công người chơi khác

### Tranh công ⚔️ (đánh vào Quân của đối thủ đang ở chiến trường)
1. Tốn **1 🌾**.
2. **Lực tấn công** = Võ (của anh hùng và các Tướng phụ) + Kế sách + số Sắt bỏ ra.
   **Lực phòng thủ** = Thủ + Thành lũy + Kế sách + số Sắt bỏ ra.
3. Hai bên **bí mật chọn số Sắt** muốn bỏ ra, rồi lật cùng lúc. Sắt đã bỏ thì mất, dù thắng hay thua.
4. Người tấn công **thắng** (lực lớn hơn hẳn) thì **2 Quân** của đối thủ ở chiến trường bị loại, và người tấn công nhận **1 Chiến công (+1★)**.
   Người tấn công **thua** (hòa cũng tính là thua) thì người phòng thủ nhận 1 Chiến công.

> Tranh công làm **giảm tổng lực phe ta**. Phá đối thủ quá tay thì cả bàn có thể thua trận. Đây là chỗ giằng co giữa *giữ nước* và *giành công*.

### Đột kích hậu phương 🔥 (đánh vào kho của đối thủ)
- Giao chiến giống như trên. Thắng thì **cướp 3 tài nguyên** tùy chọn.
- Người tấn công **−1 Lòng dân**. Ngoại lệ: không mất nếu đánh người đang **dẫn đầu ★**.

### Luật chống bắt nạt
- Không được tấn công **cùng một người 2 lượt liên tiếp**.
- Người bị đánh mà **thua** được **+1 Lòng dân** và nhận thẻ **Phục thù** (+2 lực khi đánh lại đúng người đó).
- **Lòng dân bằng 0** thì không được Đột kích.

---

## 7. Tướng phụ (ví dụ, xem danh sách đầy đủ ở nhan-vat.md)

Tướng phụ là **nhân vật lịch sử** mà bạn có thể chiêu mộ. Mỗi người cho giảm giá vĩnh viễn, Võ, Thủ, điểm ★ và đôi khi một kỹ năng nhỏ. Mặt sau mỗi thẻ có **2 dòng tiểu sử**.

| Tầng | Tướng phụ | Giá | Giảm giá | Võ | Thủ | ★ | Kỹ năng nhỏ |
|---|---|---|---|---|---|---|---|
| I | Thủy binh Bạch Đằng | 2🪵 1🌾 | 🪵 | 1 | 0 | 0 | +1 Võ ở trận có 🟦 |
| I | Dân binh làng xã | 2🌾 | 🌾 | 1 | 1 | 0 | — |
| I | Thợ rèn binh khí | 2🪵 1⛏️ | ⛏️ | 0 | 0 | 0 | — |
| II | **Yết Kiêu** | 3🪵 2🌾 | 🪵 | 2 | 0 | 1 | Trận có 🟦: Sức địch −1 |
| II | **Phạm Ngũ Lão** | 3⛏️ 2🌾 | ⛏️ | 3 | 0 | 1 | — |
| II | **Lê Lai** | 2🌾 2🪙 | 🌾 | 1 | 1 | 2 | Bỏ thẻ này: hủy 1 lần thua Tranh công của bạn |
| II | **Ngô Thì Nhậm** | 3🪙 2🪵 | 🪙 | 0 | 2 | 2 | Mưu +1 |
| III | **Trần Nhật Duật** | 4⛏️ 3🪙 | — | 3 | 1 | 3 | Trận Hàm Tử: +2★ |
| III | **Trần Bình Trọng** | 4⛏️ 2🌾 | — | 2 | 3 | 3 | Trận thua: bạn không bị −2★ |
| III | **Nguyễn Xí** | 4⛏️ 3🌾 | — | 3 | 2 | 3 | — |

---

## 8. Kế sách (ví dụ)

| Kế sách | Loại | Hiệu ứng |
|---|---|---|
| Nghi binh | Công | Xem đối thủ đã chọn bao nhiêu Sắt **trước khi** bạn chọn |
| Tập kích ban đêm | Công | Đối thủ không được dùng Kế sách phòng thủ |
| Ly gián | Công | 1 Tướng phụ của đối thủ không được tính đến hết lượt sau của họ |
| Vườn không nhà trống | Thủ | Nếu bạn thua bị Đột kích, kẻ tấn công không lấy được gì |
| Tiếp viện | Thủ | +3 Thủ |
| Kết minh | Ngoại giao | Bạn và 1 người (phải đồng ý) không được tấn công nhau trong 1 trận; mỗi bên +1★ |
| Hội nghị Diên Hồng | Đặc biệt | Cả bàn bỏ phiếu "Đánh!" (đa số đồng ý): mọi người +1 Quân ra chiến trường |
| Mùa màng bội thu | Kinh tế | +3 🌾 |

---

## 9. Danh hiệu (mỗi ván lật 3 trong 8)

| Danh hiệu | Điều kiện | ★ |
|---|---|---|
| Vạn Thắng | Nhiều Chiến công nhất | +5 |
| Nhân Chủ | Lòng dân cao nhất | +4 |
| Hiền Tài Hội Tụ | Nhiều Tướng phụ nhất | +4 |
| Trụ Cột Quốc Gia | Nhiều lần đứng Hạng 1 đóng góp nhất | +4 |
| Tinh Thông Binh Pháp | Góp tài nguyên Chiến thuật ở nhiều trận nhất | +3 |
| Thủy Quân Hùng Mạnh | Vùng Sông lớn nhất | +3 |
| Núi Sông Hiểm Trở | Nhiều Thành lũy nhất | +3 |
| Kho Lẫm Đầy Đủ | Vùng Ruộng lớn nhất | +3 |

Nếu nhiều người cùng đạt: mỗi người được số điểm đó trừ 1.

---

## 10. Kết thúc và tính điểm

Game kết thúc sau **trận cuối cùng của Thời đại IV**. Cộng Uy danh ★ từ:
1. ★ thưởng từ các trận đánh
2. ★ trên Tướng phụ
3. Chiến công
4. Danh hiệu
5. Vùng từ 5 ô: +2★ mỗi vùng
6. Lòng dân: từ 8 trở lên **+4★** · từ 5 đến 7 **+1★** · từ 2 trở xuống **−3★**

**Ai nhiều ★ nhất thắng.** Nếu hòa, người có Lòng dân cao hơn thắng.

**Kết thúc chung:** nếu bàn chơi **thắng ít nhất 6/8 trận** thì cả bàn mở khóa **"Non sông thu về một mối"**, gồm một đoạn tổng kết lịch sử và huy hiệu sưu tập.

---

## 11. Học sử trong game

| Tính năng | Mô tả |
|---|---|
| **Bối cảnh** | Hiện khi lật trận (2–3 câu) |
| **Sử ký** | Hiện sau trận: diễn biến, kết quả, ý nghĩa, nguồn sử liệu |
| **Đúng người đúng trận** | Mở khóa câu nói hoặc thơ văn thật của nhân vật |
| **Thẻ nhân vật mặt sau** | Tiểu sử và mục **"Vì sao có kỹ năng này"**, nối từng kỹ năng với một sự kiện thật |
| **Sổ tay Sử Việt** | Bộ sưu tập: chơi đủ trận nào thì mở khóa trang đó |
| **Chế độ lớp học** (tùy chọn) | Đầu mỗi trận có 1 câu hỏi nhanh, trả lời đúng +1 🌾 |

**Nguyên tắc nội dung:**
1. Mọi sự kiện phải dẫn được về sử liệu: *Đại Việt sử ký toàn thư*, *Khâm định Việt sử thông giám cương mục*, *Đại Nam thực lục*, sách giáo khoa Lịch sử.
2. Chi tiết nào chỉ có trong truyền thuyết, văn học hoặc dã sử thì gắn nhãn **[Tương truyền]**.
3. Số liệu mà các nguồn ghi khác nhau (quân số, ngày tháng) thì ghi khoảng hoặc ghi "theo …".
4. Trước khi phát hành, **giáo viên Lịch sử hoặc chuyên gia đọc duyệt** toàn bộ nội dung.
