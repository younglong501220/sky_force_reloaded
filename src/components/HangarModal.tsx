import React from 'react';
import { UserData, UPGRADE_CONFIG, UserUpgrades } from '../types/game';
import { sound } from '../audio/soundEngine';
import { Shield, Magnet, Crosshair, Rocket, Bomb, Award, Play, Volume2, VolumeX } from 'lucide-react';

interface HangarModalProps {
  userData: UserData;
  onUpgrade: (type: keyof UserUpgrades) => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  userData,
  onUpgrade,
  onStartGame,
  isMuted,
  onToggleSound,
}) => {
  const getIcon = (type: keyof UserUpgrades) => {
    switch (type) {
      case 'cannon':
        return <Crosshair className="w-5 h-5 text-cyan-400" />;
      case 'magnet':
        return <Magnet className="w-5 h-5 text-amber-400" />;
      case 'health':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'missile':
        return <Rocket className="w-5 h-5 text-rose-400" />;
      case 'megaBomb':
        return <Bomb className="w-5 h-5 text-purple-400" />;
    }
  };

  const handleBuy = (type: keyof UserUpgrades) => {
    sound.init();
    onUpgrade(type);
  };

  const handleDeploy = () => {
    sound.init();
    sound.playClick();
    onStartGame();
  };

  const upgradeKeys = Object.keys(UPGRADE_CONFIG) as (keyof UserUpgrades)[];

  // Count medals earned
  const medalsCount = Object.values(userData.medals).filter(Boolean).length;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-slate-950/95 text-slate-100 overflow-y-auto select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
              HANGAR BAY 01
            </span>
          </div>
          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>
        </div>

        {/* Title branding */}
        <div className="text-center my-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-sky-500">
            SKY FORCE
          </h1>
          <p className="text-[11px] sm:text-xs font-mono tracking-widest text-slate-400 mt-0.5">
            RELOADED // 傲氣雄鷹：重裝上陣
          </p>
        </div>

        {/* Resource Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl mb-4">
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">星星庫存</div>
            <div className="text-base sm:text-lg font-bold text-amber-400 font-mono tabular-nums flex items-center justify-center gap-1">
              <span>★</span>
              <span>{userData.stars}</span>
            </div>
          </div>
          <div className="text-center border-x border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">最高得分</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400 font-mono tabular-nums">
              {userData.highScore.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">解鎖戰勳</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono tabular-nums flex items-center justify-center gap-1">
              <Award className="w-4 h-4" />
              <span>{medalsCount} / 4</span>
            </div>
          </div>
        </div>

        {/* Tech Tree List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {upgradeKeys.map((key) => {
            const detail = UPGRADE_CONFIG[key];
            const currentLevel = userData.upgrades[key];
            const isMax = currentLevel >= detail.max;
            const cost = isMax ? 0 : detail.costs[currentLevel];
            const canAfford = userData.stars >= cost && !isMax;

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/70 hover:border-cyan-500/30 rounded-xl transition-all shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getIcon(key)}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>{detail.name}</span>
                      <span className="text-[10px] font-mono font-normal text-slate-500 hidden sm:inline">
                        {detail.nameEn}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{detail.desc}</p>
                    {/* Level Pips */}
                    <div className="flex gap-1.5 mt-2">
                      {Array.from({ length: detail.max }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 sm:w-4 h-1.5 rounded-xs transition-all ${
                            idx < currentLevel
                              ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                <button
                  onClick={() => handleBuy(key)}
                  disabled={!canAfford}
                  className={`flex flex-col items-center justify-center min-w-[76px] py-1.5 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
                    isMax
                      ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-default'
                      : canAfford
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95'
                      : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] uppercase">{isMax ? 'MAXED' : 'UPGRADE'}</span>
                  {!isMax && (
                    <span className="text-[11px] tabular-nums font-extrabold flex items-center gap-0.5">
                      ★ {cost}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="pt-4 border-t border-slate-800/80 mt-3 flex flex-col gap-2">
        <button
          onClick={handleDeploy}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm sm:text-base font-black tracking-widest uppercase rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>出擊戰鬥 (DEPLOY MISSION)</span>
        </button>
        <p className="text-center text-[10px] font-mono text-slate-500">
          滑鼠/觸控滑動操控戰機 · 空白鍵[SPACE]發射EMP核彈 · 停留綠色光圈救援人質
        </p>
      </div>
    </div>
  );
};
