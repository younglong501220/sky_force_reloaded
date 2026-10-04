import React from 'react';
import { RunStats } from '../types/game';
import { RotateCcw, Wrench, Skull } from 'lucide-react';

interface GameOverModalProps {
  stats: RunStats;
  onRestart: () => void;
  onOpenHangar: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onOpenHangar,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl shadow-rose-950/50 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl mb-3">
            <Skull className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <div className="text-[11px] font-mono tracking-widest text-rose-400 uppercase">
            MISSION FAILED // 戰機墜毀
          </div>
          <h2 className="text-2xl font-black tracking-wide text-white mt-0.5">
            CRAFT DESTROYED
          </h2>
        </div>

        {/* Stats Debrief */}
        <div className="my-5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>本次得分 (SCORE)</span>
            <span className="font-bold text-cyan-400 tabular-nums text-sm">{stats.score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>回收星星 (STARS GAINED)</span>
            <span className="font-bold text-amber-400 tabular-nums flex items-center gap-1">
              ★ +{stats.starsGained}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>拯救人質 (HOSTAGES SAVED)</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {stats.hostagesSaved} / {stats.hostagesTotal}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>擊落敵機 (ENEMIES DOWNED)</span>
            <span className="font-bold text-slate-200 tabular-nums">{stats.enemiesDestroyed}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
            <span>作戰時長 (FLIGHT TIME)</span>
            <span className="tabular-nums">{stats.flightTimeSec}s</span>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 mb-5">
          收集的星星已存入機庫，可前往升級主雷射砲、裝甲與自導飛彈！
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再次出擊 (RETRY MISSION)</span>
          </button>
          <button
            onClick={onOpenHangar}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-semibold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>返回機庫升級 (ENTER HANGAR)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
