import React from 'react';
import { UserData, UPGRADE_CONFIG } from '../types/game';
import { Shield, Award, Crosshair, HelpCircle, Volume2, VolumeX, Flame } from 'lucide-react';

interface TacticalConsoleProps {
  userData: UserData;
  isMuted: boolean;
  onToggleSound: () => void;
  onResetSave: () => void;
}

export const TacticalConsole: React.FC<TacticalConsoleProps> = ({
  userData,
  isMuted,
  onToggleSound,
  onResetSave,
}) => {
  const medalsList = [
    { key: 'destroy70', title: '70% 殲滅敵機', desc: '擊落空域內至少 70% 敵機' },
    { key: 'destroy100', title: '100% 全域殲滅', desc: '不漏過任何敵機，全數殲滅' },
    { key: 'allHostages', title: '全員獲救', desc: '成功救援所有待援軍民' },
    { key: 'untouched', title: '無傷作戰', desc: '機體未受任何子彈或撞擊傷害' },
  ];

  const [confirmReset, setConfirmReset] = React.useState<boolean>(false);

  return (
    <div className="hidden xl:flex flex-col justify-between w-80 h-full p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md text-slate-200 select-none">
      <div>
        {/* Pilot Dossier */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-cyan-400 tracking-wider">PILOT DOSSIER</div>
            <div className="text-sm font-bold text-white">ACE COMMANDER</div>
            <div className="text-[11px] font-mono text-slate-400">出擊次數: {userData.totalSorties}</div>
          </div>
        </div>

        {/* Mission Intel */}
        <div className="my-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-2">
            MISSION INTEL // 作戰簡報
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">代號目標</span>
              <span className="font-semibold text-rose-400">TITAN OVERLORD</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">作戰空域</span>
              <span>群島海域 ALPHA</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">特殊任務</span>
              <span className="text-amber-400">搜救倖存人質</span>
            </div>
          </div>
        </div>

        {/* Medal Armory */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              MEDAL ARMORY // 作戰勳章
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {Object.values(userData.medals).filter(Boolean).length}/4
            </span>
          </div>

          <div className="space-y-2">
            {medalsList.map((m) => {
              const active = userData.medals[m.key as keyof typeof userData.medals];
              return (
                <div
                  key={m.key}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    active
                      ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Award className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span>{m.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400/80 pl-6 mt-0.5">{m.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flight Controls Guide */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>AVIONICS CONTROLS // 操作手冊</span>
          </div>
          <div className="text-[11px] font-mono space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">機體操縱</span>
              <span className="text-cyan-300">滑鼠拖曳 / WASD / 方向鍵</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">主砲射擊</span>
              <span className="text-cyan-300">自動連發 (Auto-Fire)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">戰術EMP</span>
              <span className="text-cyan-300">[SPACE] 或 [B] 鍵</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">人質救援</span>
              <span className="text-cyan-300">懸停於救援停機坪充能</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">暫停遊戲</span>
              <span className="text-cyan-300">[P] 或 [ESC] 鍵</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <button
          onClick={onToggleSound}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? '靜音中' : '音效開啟'}</span>
        </button>
        {confirmReset ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onResetSave();
                setConfirmReset(false);
              }}
              className="text-[11px] font-mono text-rose-400 font-bold hover:underline"
            >
              確認重置
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-[11px] font-mono text-slate-400 hover:text-white"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors"
            title="重設所有升級與星星"
          >
            重置存檔
          </button>
        )}
      </div>
    </div>
  );
};
