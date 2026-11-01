// Avatar anh hùng — tranh khắc gỗ Đông Hồ, vẽ bằng Figma AI (ảnh gốc 1024px trong art/raw).
import type { HeroId } from '../../engine';
import baTrieu from './heroes/baTrieu.webp';
import baTrieuSm from './heroes/baTrieu-sm.webp';
import haiBaTrung from './heroes/haiBaTrung.webp';
import haiBaTrungSm from './heroes/haiBaTrung-sm.webp';
import nguyenTrai from './heroes/nguyenTrai.webp';
import nguyenTraiSm from './heroes/nguyenTrai-sm.webp';
import tranHungDao from './heroes/tranHungDao.webp';
import tranHungDaoSm from './heroes/tranHungDao-sm.webp';
import tranKhanhDu from './heroes/tranKhanhDu.webp';
import tranKhanhDuSm from './heroes/tranKhanhDu-sm.webp';
import tranQuangKhai from './heroes/tranQuangKhai.webp';
import tranQuangKhaiSm from './heroes/tranQuangKhai-sm.webp';
import tranQuocToan from './heroes/tranQuocToan.webp';
import tranQuocToanSm from './heroes/tranQuocToan-sm.webp';
import tranThuDo from './heroes/tranThuDo.webp';
import tranThuDoSm from './heroes/tranThuDo-sm.webp';

export const AVATAR: Record<HeroId, string> = { baTrieu, haiBaTrung, nguyenTrai, tranHungDao, tranKhanhDu, tranQuangKhai, tranQuocToan, tranThuDo };
export const AVATAR_SM: Record<HeroId, string> = {
  baTrieu: baTrieuSm,
  haiBaTrung: haiBaTrungSm,
  nguyenTrai: nguyenTraiSm,
  tranHungDao: tranHungDaoSm,
  tranKhanhDu: tranKhanhDuSm,
  tranQuangKhai: tranQuangKhaiSm,
  tranQuocToan: tranQuocToanSm,
  tranThuDo: tranThuDoSm,
};
