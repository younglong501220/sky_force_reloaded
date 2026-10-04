import React, { useState, useEffect } from 'react';
import { UserData, UserUpgrades, UPGRADE_CONFIG, RunStats, GameState } from './types/game';
import { sound } from './audio/soundEngine';
import { GameCanvas } from './game/GameCanvas';
import { HangarModal } from './components/HangarModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { TacticalConsole } from './components/TacticalConsole';
import { AvionicsPanel } from './components/AvionicsPanel';

const STORAGE_KEY = 'skyforce_reloaded_save_v2';

const DEFAULT_USER_DATA: UserData = {
  stars: 150, // Initial budget for testing upgrades right away
  highScore: 0,
  upgrades: {
    cannon: 1,
    magnet: 1,
    health: 1,
    missile: 0,
    megaBomb: 1,
  },
  totalSorties: 0,
  totalBossesDefeated: 0,
  totalHostagesRescued: 0,
  medals: {
    destroy70: false,
    destroy100: false,
    allHostages: false,
    untouched: false,
  },
};

export default function App() {
  const [userData, setUserData] = useState<UserData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_USER_DATA,
          ...parsed,
          upgrades: { ...DEFAULT_USER_DATA.upgrades, ...(parsed.upgrades || {}) },
          medals: { ...DEFAULT_USER_DATA.medals, ...(parsed.medals || {}) },
        };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_USER_DATA;
  });

  const [gameState, setGameState] = useState<GameState>('HANGAR');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [bombCount, setBombCount] = useState<number>(1);
  const [lastStats, setLastStats] = useState<RunStats | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // Ignore
    }
  }, [userData]);

  const handleToggleSound = () => {
    sound.init();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleUpgrade = (type: keyof UserUpgrades) => {
    const config = UPGRADE_CONFIG[type];
    const curLevel = userData.upgrades[type];
    if (curLevel >= config.max) return;

    const cost = config.costs[curLevel];
    if (userData.stars >= cost) {
      sound.playUpgrade();
      setUserData((prev) => ({
        ...prev,
        stars: prev.stars - cost,
        upgrades: {
          ...prev.upgrades,
          [type]: curLevel + 1,
        },
      }));
    }
  };

  const handleStartGame = () => {
    sound.init();
    sound.playClick();
    setBombCount(userData.upgrades.megaBomb);
    setIsPaused(false);
    setIsNewHighScore(false);
    setUserData((prev) => ({
      ...prev,
      totalSorties: prev.totalSorties + 1,
    }));
    setGameState('PLAYING');
  };

  const handleGameOver = (stats: RunStats) => {
    setLastStats(stats);
    let newHigh = false;
    let finalHighScore = userData.highScore;
    if (stats.score > userData.highScore) {
      newHigh = true;
      finalHighScore = stats.score;
    }
    setIsNewHighScore(newHigh);

    setUserData((prev) => ({
      ...prev,
      stars: prev.stars + stats.starsGained,
      highScore: finalHighScore,
      totalHostagesRescued: prev.totalHostagesRescued + stats.hostagesSaved,
    }));

    setGameState('GAMEOVER');
  };

  const handleVictory = (stats: RunStats) => {
    const finalScore = stats.score + 3000;
    const bonusStars = 35;
    setLastStats({
      ...stats,
      score: finalScore,
      starsGained: stats.starsGained + bonusStars,
    });

    let newHigh = false;
    let finalHighScore = userData.highScore;
    if (finalScore > userData.highScore) {
      newHigh = true;
      finalHighScore = finalScore;
    }
    setIsNewHighScore(newHigh);

    // Medals evaluation
    const killRatio = stats.enemiesTotal > 0 ? (stats.enemiesDestroyed / stats.enemiesTotal) * 100 : 0;
    const is70Kill = killRatio >= 70;
    const is100Kill = killRatio >= 95;
    const isAllHostages = stats.hostagesTotal > 0 && stats.hostagesSaved >= stats.hostagesTotal;
    const isUntouched = !stats.hullDamageTaken;

    setUserData((prev) => ({
      ...prev,
      stars: prev.stars + stats.starsGained + bonusStars,
      highScore: finalHighScore,
      totalBossesDefeated: prev.totalBossesDefeated + 1,
      totalHostagesRescued: prev.totalHostagesRescued + stats.hostagesSaved,
      medals: {
        destroy70: prev.medals.destroy70 || is70Kill,
        destroy100: prev.medals.destroy100 || is100Kill,
        allHostages: prev.medals.allHostages || isAllHostages,
        untouched: prev.medals.untouched || isUntouched,
      },
    }));

    setGameState('VICTORY');
  };

  const handleStarsCollected = (count: number) => {
    // Star count is synced in game loop, also saved on run end
  };

  const handleResetSave = () => {
    setUserData(DEFAULT_USER_DATA);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center p-0 md:p-4 overflow-hidden select-none">
      {/* Outer 1440px desktop baseline container */}
      <div className="w-full h-full max-w-[1440px] flex items-center justify-center gap-4 sm:gap-6">
        {/* Left Side: Tactical Briefing & Medals */}
        <TacticalConsole
          userData={userData}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onResetSave={handleResetSave}
        />

        {/* Central Vertical Arcade Game Frame */}
        <div className="relative w-full h-full max-w-[540px] max-h-[940px] bg-slate-900 border-0 sm:border sm:border-slate-800 rounded-none sm:rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col">
          {/* Game Canvas or Hangar Screen */}
          {gameState === 'HANGAR' ? (
            <HangarModal
              userData={userData}
              onUpgrade={handleUpgrade}
              onStartGame={handleStartGame}
              isMuted={isMuted}
              onToggleSound={handleToggleSound}
            />
          ) : (
            <GameCanvas
              userData={userData}
              onGameOver={handleGameOver}
              onVictory={handleVictory}
              onStarsCollected={handleStarsCollected}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onBombUsed={(remaining) => setBombCount(remaining)}
              bombCount={bombCount}
            />
          )}

          {/* Modal Overlays */}
          {gameState === 'GAMEOVER' && lastStats && (
            <GameOverModal
              stats={lastStats}
              onRestart={handleStartGame}
              onOpenHangar={() => setGameState('HANGAR')}
            />
          )}

          {gameState === 'VICTORY' && lastStats && (
            <VictoryModal
              stats={lastStats}
              onRestart={handleStartGame}
              onOpenHangar={() => setGameState('HANGAR')}
              isNewHighScore={isNewHighScore}
            />
          )}
        </div>

        {/* Right Side: Avionics & Craft Weaponry Telemetry */}
        <AvionicsPanel userData={userData} />
      </div>
    </div>
  );
}
