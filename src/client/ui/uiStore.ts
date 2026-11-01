import { create } from 'zustand';
import type { HeroId } from '../../engine';

export type Panel = 'khaiHoang' | 'chieuHien' | 'moBinh' | 'dieuQuan' | 'tanCong' | 'keSach' | 'tuyetKy' | 'players' | null;

interface Ui {
  panel: Panel;
  landPick: { start: number; cells: string[] } | null;
  heroInfo: HeroId | null;
  showHelp: boolean;
  guideOpen: boolean;
  showLog: boolean;
  focus: 'battle' | 'overview' | null;
  shakeAmt: { v: number; at: number };
  banner: { title: string; sub?: string; color?: string; at: number } | null;
  setPanel: (p: Panel) => void;
  setLandPick: (l: Ui['landPick']) => void;
  setHeroInfo: (h: HeroId | null) => void;
  setHelp: (v: boolean) => void;
  setGuide: (v: boolean) => void;
  setLog: (v: boolean) => void;
  setFocus: (f: Ui['focus']) => void;
  shake: (v: number) => void;
  showBanner: (title: string, sub?: string, color?: string) => void;
}

export const useUi = create<Ui>((set) => ({
  panel: null,
  landPick: null,
  heroInfo: null,
  showHelp: false,
  // Lần đầu chơi: mở sẵn hướng dẫn; sau đó nhớ lựa chọn của người chơi trên máy này
  guideOpen: (() => {
    try {
      const saved = localStorage.getItem('hkn:guide');
      if (saved !== null) return saved === '1';
    } catch {
      /* bỏ qua */
    }
    return typeof window !== 'undefined' && window.innerWidth > 760;
  })(),
  showLog: false,
  focus: null,
  shakeAmt: { v: 0, at: 0 },
  banner: null,
  setPanel: (panel) => set({ panel, landPick: panel === 'khaiHoang' ? null : null }),
  setLandPick: (landPick) => set({ landPick }),
  setHeroInfo: (heroInfo) => set({ heroInfo }),
  setHelp: (showHelp) => set({ showHelp }),
  setGuide: (guideOpen) => {
    try {
      localStorage.setItem('hkn:guide', guideOpen ? '1' : '0');
    } catch {
      /* bỏ qua */
    }
    set({ guideOpen });
  },
  setLog: (showLog) => set({ showLog }),
  setFocus: (focus) => set({ focus }),
  shake: (v) => set({ shakeAmt: { v, at: Date.now() } }),
  showBanner: (title, sub, color) => set({ banner: { title, sub, color, at: Date.now() } }),
}));
