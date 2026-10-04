import React from 'react';
import { UserData, UPGRADE_CONFIG } from '../types/game';
import { Shield, Magnet, Crosshair, Rocket, Bomb, Activity } from 'lucide-react';

interface AvionicsPanelProps {
  userData: UserData;
}

export const AvionicsPanel: React.FC<AvionicsPanelProps> = ({ userData }) => {
  const cannonDps = [30, 60, 100, 150, 240][userData.upgrades.cannon - 1];
  const magnetRadius = 60 + userData.upgrades.magnet * 45;
  const hullHp = 100 + (userData.upgrades.health - 1) * 35;
  const missileDps = userData.upgrades.missile === 0 ? 0 : 70 * 2;

  return (
    <div className="hidden xl:flex flex-col justify-between w-80 h-full p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md text-slate-200 select-none">
      <div>
        {/* Craft Specs Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-blue-400 tracking-wider">CRAFT AVIONICS</div>
            <div className="text-sm font-bold text-white">SKY PHANTOM X-7</div>
            <div className="text-[11px] font-mono text-emerald-400">STATUS: COMBAT READY</div>
          </div>
        </div>

        {/* Live Weaponry Telemetry */}
        <div className="my-4 space-y-3">
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            WEAPON & SUBSYSTEM METRICS
          </div>

          {/* Cannon */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>主雷射砲 (LV.{userData.upgrades.cannon})</span>
              </div>
              <span className="font-mono text-[11px] text-cyan-400 font-bold tabular-nums">
                {cannonDps} 威力
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {userData.upgrades.cannon === 5
                ? '五向超載重型雷射光束 · 貫穿光輝'
                : userData.upgrades.cannon >= 3
                ? '散角三叉電漿重彈 · 覆蓋面打擊'
                : '前向高速雙聯雷射炮火'}
            </p>
          </div>

          {/* Armor */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>複合裝甲 (LV.{userData.upgrades.health})</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 font-bold tabular-nums">
                HP {hullHp}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${(hullHp / 240) * 100}%` }}
              />
            </div>
          </div>

          {/* Magnet */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Magnet className="w-3.5 h-3.5 text-amber-400" />
                <span>重力磁吸 (LV.{userData.upgrades.magnet})</span>
              </div>
              <span className="font-mono text-[11px] text-amber-400 font-bold tabular-nums">
                {magnetRadius}px 半徑
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              重力吸附周圍掉落星星，自動加速牽引
            </p>
          </div>

          {/* Missiles */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                <Rocket className="w-3.5 h-3.5 text-rose-400" />
                <span>巡弋飛彈 (LV.{userData.upgrades.missile})</span>
              </div>
              <span className="font-mono text-[11px] text-rose-400 font-bold tabular-nums">
                {userData.upgrades.missile > 0 ? `${missileDps} 破甲` : '未解鎖'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {userData.upgrades.missile > 0
                ? '雙聯裝自動自導尋標高爆微型飛彈'
                : '可在機庫解鎖加裝側翼巡弋飛彈巢'}
            </p>
          </div>

          {/* Mega Bomb */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                <Bomb className="w-3.5 h-3.5 text-purple-400" />
                <span>EMP超能炸彈</span>
              </div>
              <span className="font-mono text-[11px] text-purple-400 font-bold tabular-nums">
                x{userData.upgrades.megaBomb} 發/出擊
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              瞬間抹除全屏敵軍彈幕並造成大範圍 EMP 衝擊傷害
            </p>
          </div>
        </div>
      </div>

      {/* Cumulative Stats */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5 font-mono">
        <div className="flex justify-between text-slate-400">
          <span>累積救出人質</span>
          <span className="text-white font-bold">{userData.totalHostagesRescued} 名</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>擊沉霸主戰艦</span>
          <span className="text-white font-bold">{userData.totalBossesDefeated} 艘</span>
        </div>
      </div>
    </div>
  );
};
