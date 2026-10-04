export type GameState = 'HANGAR' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export interface UserUpgrades {
  cannon: number; // 1 - 5
  magnet: number; // 1 - 5
  health: number; // 1 - 5
  missile: number; // 0 - 5
  megaBomb: number; // 0 - 3 (Number of Mega Bombs per run)
}

export interface UserData {
  stars: number;
  highScore: number;
  upgrades: UserUpgrades;
  totalSorties: number;
  totalBossesDefeated: number;
  totalHostagesRescued: number;
  medals: {
    destroy70: boolean;
    destroy100: boolean;
    allHostages: boolean;
    untouched: boolean;
  };
}

export interface UpgradeDetail {
  name: string;
  nameEn: string;
  desc: string;
  max: number;
  costs: number[];
  icon: string;
}

export const UPGRADE_CONFIG: Record<keyof UserUpgrades, UpgradeDetail> = {
  cannon: {
    name: '主雷射重砲',
    nameEn: 'Main Laser Cannon',
    desc: '提高射速、增加發射彈道數量與重裝貫穿威力',
    max: 5,
    costs: [0, 60, 140, 300, 650],
    icon: 'Crosshair',
  },
  magnet: {
    name: '重力磁場',
    nameEn: 'Star Magnet',
    desc: '大幅擴展戰機重力圈，全方位自動吸附掉落星星',
    max: 5,
    costs: [0, 40, 100, 220, 480],
    icon: 'Magnet',
  },
  health: {
    name: '能量裝甲',
    nameEn: 'Hull Armor',
    desc: '強化機體複合裝甲，提高耐久度上限並減輕撞擊受損',
    max: 5,
    costs: [0, 50, 120, 260, 520],
    icon: 'Shield',
  },
  missile: {
    name: '側翼巡弋飛彈',
    nameEn: 'Wing Cruise Missiles',
    desc: '加裝自導追蹤巡弋飛彈，精準索敵摧毀空中與地面目標',
    max: 5,
    costs: [80, 160, 340, 650, 1100],
    icon: 'Rocket',
  },
  megaBomb: {
    name: '戰術EMP核彈',
    nameEn: 'Mega Bomb EMP',
    desc: '出擊時攜帶全螢幕清屏EMP超能炸彈，瞬間消除彈幕並重創敵艦',
    max: 3,
    costs: [120, 300, 700],
    icon: 'Bomb',
  },
};

export interface RunStats {
  score: number;
  starsGained: number;
  enemiesTotal: number;
  enemiesDestroyed: number;
  hostagesTotal: number;
  hostagesSaved: number;
  hullDamageTaken: boolean;
  bossDefeated: boolean;
  flightTimeSec: number;
}
