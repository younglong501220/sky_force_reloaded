import React from 'react';
import { RunStats } from '../types/game';
import { Trophy, Award, RotateCcw, Wrench, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  stats: RunStats;
  onRestart: () => void;
  onOpenHangar: () => void;
  isNewHighScore: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onRestart,
  onOpenHangar,
  isNewHighScore,
}) => {
  const killRatio = stats.enemiesTotal > 0 ? (stats.enemiesDestroyed / stats.enemiesTotal) * 100 : 0;
  const is70Kill = killRatio >= 70;
  const is100Kill = killRatio >= 95; // realistic threshold
  const isAllHostages = stats.hostagesTotal > 0 && stats.hostagesSaved >= stats.hostagesTotal;
  const isUntouched = !stats.hullDamageTaken;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-cyan-400/50 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-xl mb-3">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
          <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
            MISSION ACCOMPLISHED // 戰役大捷
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white mt-0.5">
            TITAN OVERLORD DEFEATED
          </h2>
          {isNewHighScore && (
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>NEW HIGH SCORE!</span>
            </div>
          )}
        </div>

        {/* Medals Showcase */}
        <div className="my-4 p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 text-center">
            MISSION MEDALS // 關卡勳章
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className={`p-2 rounded flex items-center gap-1.5 border ${is70Kill ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-slate-900/40 border-slate-800 text-slate-600'}`}>
              <Award className={`w-3.5 h-3.5 ${is70Kill ? 'text-cyan-400' : 'text-slate-600'}`} />
              <span>70% 殲滅</span>
            </div>
            <div className={`p-2 rounded flex items-center gap-1.5 border ${is100Kill ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-slate-900/40 border-slate-800 text-slate-600'}`}>
              <Award className={`w-3.5 h-3.5 ${is100Kill ? 'text-cyan-400' : 'text-slate-600'}`} />
              <span>100% 殲滅</span>
            </div>
            <div className={`p-2 rounded flex items-center gap-1.5 border ${isAllHostages ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-600'}`}>
              <Award className={`w-3.5 h-3.5 ${isAllHostages ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>全員獲救</span>
            </div>
            <div className={`p-2 rounded flex items-center gap-1.5 border ${isUntouched ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-slate-900/40 border-slate-800 text-slate-600'}`}>
              <Award className={`w-3.5 h-3.5 ${isUntouched ? 'text-amber-400' : 'text-slate-600'}`} />
              <span>無傷通關</span>
            </div>
          </div>
        </div>

        {/* Stats Debrief */}
        <div className="mb-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>作戰得分 (FINAL SCORE)</span>
            <span className="font-bold text-cyan-400 tabular-nums text-sm">
              {(stats.score + 3000).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>回收星星 (STARS GAINED)</span>
            <span className="font-bold text-amber-400 tabular-nums flex items-center gap-1">
              ★ +{stats.starsGained + 35} (含通關獎勵)
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>救援人質 (RESCUED)</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {stats.hostagesSaved} 名倖存者
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>作戰時長 (FLIGHT TIME)</span>
            <span className="tabular-nums text-slate-400">{stats.flightTimeSec}s</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onOpenHangar}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>前往機庫升級戰機 (HANGAR UPGRADES)</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-semibold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再次出擊 (SORTIE AGAIN)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
