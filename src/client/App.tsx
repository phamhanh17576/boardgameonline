import { lazy, Suspense, useMemo } from 'react';
import { useStore } from './store';
import { isLowPower } from './theme';
import { LogDrawer, MyBar, PlayersStrip, TopBar } from './ui/GameHud';
import { Home } from './ui/Home';
import { Lobby } from './ui/Lobby';
import {
  BannerDirector,
  BattleIntroModal,
  BattleResultModal,
  ChoiceModal,
  CombatModal,
  FinalModal,
  HelpModal,
  HeroInfoModal,
  Toast,
} from './ui/Modals';
import { PanelHost } from './ui/Panels';
import { useUi } from './ui/uiStore';

const GameScene = lazy(() => import('./scene/Scene').then((m) => ({ default: m.GameScene })));

export function App() {
  const mode = useStore((s) => s.mode);
  const lobby = useStore((s) => s.lobby);
  const view = useStore((s) => s.view);
  const showLog = useUi((s) => s.showLog);
  const low = useMemo(isLowPower, []);

  let body;
  if (!mode) body = <Home />;
  else if (!view || !lobby?.started) body = <Lobby />;
  else
    body = (
      <div className="game">
        <div className="scene-wrap">
          <Suspense fallback={<div className="center-msg"><div className="spinner" /><p>Đang dựng sa bàn…</p></div>}>
            <GameScene view={view} low={low} />
          </Suspense>
        </div>
        <TopBar view={view} />
        <PlayersStrip view={view} />
        <PanelHost view={view} />
        <MyBar view={view} />
        {showLog && <LogDrawer view={view} />}
        <CombatModal view={view} />
        <ChoiceModal view={view} />
        <BattleIntroModal view={view} />
        <BattleResultModal view={view} />
        <FinalModal view={view} />
        <BannerDirector view={view} />
      </div>
    );

  return (
    <>
      {body}
      <HeroInfoModal />
      <HelpModal />
      <Toast />
    </>
  );
}
