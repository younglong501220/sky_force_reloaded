import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UserData, RunStats } from '../types/game';
import { sound } from '../audio/soundEngine';

interface GameCanvasProps {
  userData: UserData;
  onGameOver: (stats: RunStats) => void;
  onVictory: (stats: RunStats) => void;
  onStarsCollected: (starsCount: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onBombUsed?: (bombsRemaining: number) => void;
  bombCount: number;
}

// Particle class
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;

  constructor(x: number, y: number, color: string, speedMult: number = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8 * speedMult;
    this.vy = (Math.random() - 0.5) * 8 * speedMult;
    this.radius = 2 + Math.random() * 4;
    this.color = color;
    this.alpha = 1;
    this.decay = 0.02 + Math.random() * 0.03;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.alpha -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Smoke particle for missile trail
class SmokeParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 3 + Math.random() * 3;
    this.alpha = 0.6;
  }

  update(): void {
    this.y += 1.2;
    this.radius += 0.25;
    this.alpha -= 0.025;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Bullet class
class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  dmg: number;
  color: string;
  radius: number;

  constructor(x: number, y: number, vx: number, vy: number, isPlayer: boolean, dmg: number, color: string = '#00f6ff', radius: number = 3.5) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isPlayer = isPlayer;
    this.dmg = dmg;
    this.color = color;
    this.radius = radius;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Laser trail
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius * 1.8;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 1.6, this.y - this.vy * 1.6);
    ctx.stroke();
    ctx.restore();
  }
}

// Homing Missile class
class HomingMissile {
  x: number;
  y: number;
  target: Enemy | null;
  vx: number;
  vy: number;
  speed: number;
  life: number;

  constructor(x: number, y: number, target: Enemy | null) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = -6;
    this.speed = 11;
    this.life = 140;
  }

  update(enemies: Enemy[], particles: (Particle | SmokeParticle)[]): void {
    this.life--;

    // Re-acquire target if current is dead or off-screen
    if (!this.target || this.target.hp <= 0 || this.target.y > this.y) {
      let minDist = 9999;
      let closest: Enemy | null = null;
      for (const e of enemies) {
        if (e.hp > 0 && e.y < this.y) {
          const dist = Math.hypot(e.x - this.x, e.y - this.y);
          if (dist < minDist) {
            minDist = dist;
            closest = e;
          }
        }
      }
      this.target = closest;
    }

    if (this.target && this.target.hp > 0) {
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.vx += Math.cos(angle) * 1.1;
      this.vy += Math.sin(angle) * 1.1;
      const currentSpeed = Math.hypot(this.vx, this.vy);
      this.vx = (this.vx / currentSpeed) * this.speed;
      this.vy = (this.vy / currentSpeed) * this.speed;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (Math.random() < 0.65) {
      particles.push(new SmokeParticle(this.x, this.y));
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
    ctx.fillStyle = '#ff7b00';
    ctx.fillRect(-2, -7, 4, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -9, 4, 3);
    ctx.restore();
  }
}

// Enemy class
type EnemyType = 'scout' | 'gunship' | 'turret' | 'interceptor' | 'boss';

class Enemy {
  x: number;
  y: number;
  type: EnemyType;
  timer: number;
  hp: number;
  maxHp: number;
  radius: number;
  vx: number;
  vy: number;
  scoreVal: number;
  starsDrop: number;
  isGround: boolean = false;
  phase: number = 1;

  constructor(x: number, y: number, type: EnemyType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.timer = Math.floor(Math.random() * 20);

    if (type === 'scout') {
      this.hp = 40;
      this.maxHp = 40;
      this.radius = 16;
      this.vx = (Math.random() - 0.5) * 1.8;
      this.vy = 2.2;
      this.scoreVal = 100;
      this.starsDrop = 2;
    } else if (type === 'interceptor') {
      this.hp = 65;
      this.maxHp = 65;
      this.radius = 18;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = 3.2;
      this.scoreVal = 180;
      this.starsDrop = 3;
    } else if (type === 'gunship') {
      this.hp = 220;
      this.maxHp = 220;
      this.radius = 30;
      this.vx = 0;
      this.vy = 1.1;
      this.scoreVal = 400;
      this.starsDrop = 7;
    } else if (type === 'turret') {
      this.hp = 140;
      this.maxHp = 140;
      this.radius = 22;
      this.vx = 0;
      this.vy = 0.85; // moves with terrain
      this.scoreVal = 250;
      this.starsDrop = 5;
      this.isGround = true;
    } else {
      // Boss: Titan Overlord
      this.hp = 2200;
      this.maxHp = 2200;
      this.radius = 70;
      this.vx = 1.6;
      this.vy = 0.5;
      this.scoreVal = 6000;
      this.starsDrop = 45;
      this.phase = 1;
    }
  }

  update(player: Player, bullets: Bullet[], width: number, onBossPhaseChange?: () => void): void {
    this.timer++;
    this.x += this.vx;
    this.y += this.vy;

    if (this.type === 'scout') {
      if (this.timer % 65 === 0 && this.y < player.y - 70) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bullets.push(new Bullet(this.x, this.y + 12, Math.cos(angle) * 4.6, Math.sin(angle) * 4.6, false, 14, '#ef4444', 3.5));
        sound.playEnemyShoot();
      }
    } else if (this.type === 'interceptor') {
      if (this.x < 30 || this.x > width - 30) this.vx *= -1;
      if (this.timer % 50 === 0 && this.y < player.y - 50) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bullets.push(new Bullet(this.x - 8, this.y + 10, Math.cos(angle - 0.15) * 5, Math.sin(angle - 0.15) * 5, false, 12, '#f97316', 3.5));
        bullets.push(new Bullet(this.x + 8, this.y + 10, Math.cos(angle + 0.15) * 5, Math.sin(angle + 0.15) * 5, false, 12, '#f97316', 3.5));
        sound.playEnemyShoot();
      }
    } else if (this.type === 'gunship') {
      this.vx = Math.sin(this.timer * 0.04) * 2.2;
      if (this.timer % 48 === 0) {
        bullets.push(new Bullet(this.x - 14, this.y + 18, -0.6, 5.2, false, 16, '#f43f5e', 4));
        bullets.push(new Bullet(this.x + 14, this.y + 18, 0.6, 5.2, false, 16, '#f43f5e', 4));
        sound.playEnemyShoot();
      }
    } else if (this.type === 'turret') {
      if (this.timer % 75 === 0 && this.y < player.y + 100) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = -1; i <= 1; i++) {
          bullets.push(new Bullet(this.x, this.y, Math.cos(angle + i * 0.22) * 4.2, Math.sin(angle + i * 0.22) * 4.2, false, 14, '#eab308', 3.5));
        }
        sound.playEnemyShoot();
      }
    } else if (this.type === 'boss') {
      if (this.y < 125) {
        this.vy = 0.55;
      } else {
        this.vy = 0;
      }

      if (this.x < 90 || this.x > width - 90) {
        this.vx *= -1;
      }

      // Phase 2 check
      if (this.hp < this.maxHp * 0.45 && this.phase === 1) {
        this.phase = 2;
        sound.playBossAlarm();
        if (onBossPhaseChange) onBossPhaseChange();
      }

      const fireInterval = this.phase === 2 ? 32 : 52;
      if (this.timer % fireInterval === 0) {
        if (this.phase === 1) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            bullets.push(new Bullet(this.x, this.y, Math.cos(a + this.timer * 0.02) * 4.2, Math.sin(a + this.timer * 0.02) * 4.2, false, 18, '#f43f5e', 4.5));
          }
        } else {
          // Phase 2: Spiral helix bullet hell
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
            bullets.push(new Bullet(this.x, this.y, Math.cos(a + this.timer * 0.06) * 5.4, Math.sin(a + this.timer * 0.06) * 5.4, false, 20, '#ef4444', 5));
          }
        }
        sound.playEnemyShoot();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
    ctx.save();

    // 1. Dynamic projection shadow
    const shadowOffset = this.isGround ? 5 : 28;
    ctx.save();
    ctx.translate(this.x + 10, this.y + shadowOffset);
    ctx.fillStyle = 'rgba(2, 6, 14, 0.42)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Enemy body
    ctx.translate(this.x, this.y);

    if (this.type === 'scout') {
      const grad = ctx.createLinearGradient(-15, -15, 15, 15);
      grad.addColorStop(0, '#f87171');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(16, -14);
      ctx.lineTo(0, -6);
      ctx.lineTo(-16, -14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.type === 'interceptor') {
      const grad = ctx.createLinearGradient(-18, -18, 18, 18);
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(1, '#9a3412');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(18, -8);
      ctx.lineTo(8, -16);
      ctx.lineTo(0, -10);
      ctx.lineTo(-8, -16);
      ctx.lineTo(-18, -8);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'gunship') {
      // Armored Cruiser
      ctx.fillStyle = '#334155';
      ctx.fillRect(-24, -16, 48, 32);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-24, -16, 48, 32);

      // Jet engines
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-18, -20, 10, 6);
      ctx.fillRect(8, -20, 10, 6);

      // Cockpit red visor
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, 4, 24, 6);
    } else if (this.type === 'turret') {
      // Bunker base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating cannon
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      ctx.rotate(angle);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -5, 20, 10);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, -3, 6, 6);
    } else if (this.type === 'boss') {
      // Titan Overlord
      const isPhase2 = this.phase === 2;
      const bGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 70);
      bGrad.addColorStop(0, isPhase2 ? '#7f1d1d' : '#1e293b');
      bGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isPhase2 ? '#ef4444' : '#00e5ff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Wing sponsons
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-70, -18, 25, 36);
      ctx.fillRect(45, -18, 25, 36);

      // Core pulsating reactor
      const pPulse = (Math.sin(this.timer * 0.15) + 1) * 0.5;
      ctx.fillStyle = isPhase2 ? `rgba(239, 68, 68, ${0.7 + pPulse * 0.3})` : `rgba(0, 229, 255, ${0.7 + pPulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = isPhase2 ? '#ef4444' : '#00e5ff';
      ctx.stroke();
    }

    // Health bar above enemy when damaged
    if (this.hp < this.maxHp && this.type !== 'boss') {
      const barW = this.radius * 1.8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW * (this.hp / this.maxHp), 4);
    }

    ctx.restore();
  }
}

// Hostage Rescue Zone class
class RescueZone {
  x: number;
  y: number;
  radius: number = 30;
  progress: number = 0; // 0 - 100
  rescued: boolean = false;
  pulseTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(player: Player, stars: Star[], onRescue: () => void): void {
    this.y += 0.85; // moves with sea/terrain
    this.pulseTimer += 0.05;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist < this.radius + 18) {
      this.progress += 1.0;
      if (this.progress >= 100 && !this.rescued) {
        this.rescued = true;
        sound.playRescue();
        onRescue();
        // Shower of stars
        for (let i = 0; i < 9; i++) {
          stars.push(new Star(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30));
        }
      }
    } else {
      if (this.progress > 0 && !this.rescued) {
        this.progress -= 0.6;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.rescued) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Radar ping ring
    const pingScale = 1 + (Math.sin(this.pulseTimer * 2) + 1) * 0.2;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pingScale, 0, Math.PI * 2);
    ctx.stroke();

    // Base landing pad outline
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress circle fill
    if (this.progress > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (this.progress / 100)));
      ctx.stroke();

      // Text prompt
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(this.progress)}% RESCUE`, 0, -this.radius - 8);
    } else {
      ctx.fillStyle = '#2dd4bf';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HOVER TO RESCUE', 0, -this.radius - 8);
    }

    // Survivor figure
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-2.5, -1, 5, 8);

    ctx.restore();
  }
}

// Star class
class Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  collected: boolean = false;
  rot: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4.5;
    this.vy = (Math.random() - 0.5) * 4.5 - 2;
  }

  update(player: Player, magnetLevel: number, onCollect: () => void): void {
    this.rot += 0.08;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy = this.vy * 0.95 + 0.38; // gravity float

    // Magnet radius
    const magnetRadius = 60 + magnetLevel * 45;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist < magnetRadius) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      const speed = 12 + magnetLevel * 2.2;
      this.vx += Math.cos(angle) * speed * 0.3;
      this.vy += Math.sin(angle) * speed * 0.3;
    }

    // Collect check
    if (dist < player.radius + 12) {
      this.collected = true;
      sound.playStar();
      onCollect();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 7, -Math.sin((18 + i * 72) * Math.PI / 180) * 7);
      ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 3, -Math.sin((54 + i * 72) * Math.PI / 180) * 3);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Player Fighter Craft class
class Player {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number = 20;
  maxHp: number;
  hp: number;
  shootTimer: number = 0;
  missileTimer: number = 0;
  tilt: number = 0;
  invulnerableTimer: number = 0;

  constructor(width: number, height: number, healthLevel: number) {
    this.x = width / 2;
    this.y = height - 120;
    this.targetX = this.x;
    this.targetY = this.y;
    this.maxHp = 100 + (healthLevel - 1) * 35;
    this.hp = this.maxHp;
  }

  update(
    inputX: number,
    inputY: number,
    width: number,
    height: number,
    cannonLevel: number,
    missileLevel: number,
    bullets: Bullet[],
    missiles: HomingMissile[],
    enemies: Enemy[]
  ): void {
    const dx = inputX - this.x;
    const dy = inputY - this.y;
    this.x += dx * 0.18;
    this.y += dy * 0.18;

    this.x = Math.max(26, Math.min(width - 26, this.x));
    this.y = Math.max(40, Math.min(height - 40, this.y));

    this.tilt = dx * 0.05;
    this.tilt = Math.max(-0.45, Math.min(0.45, this.tilt));

    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    // Cannon shooting
    this.shootTimer++;
    const fireInterval = Math.max(5, 9 - cannonLevel);
    if (this.shootTimer >= fireInterval) {
      this.shootTimer = 0;
      this.fireCannons(cannonLevel, bullets);
    }

    // Wing Missiles
    if (missileLevel > 0) {
      this.missileTimer++;
      const missileInterval = 44 - missileLevel * 5;
      if (this.missileTimer >= missileInterval) {
        this.missileTimer = 0;
        this.fireMissiles(missiles, enemies);
      }
    }
  }

  fireCannons(lvl: number, bullets: Bullet[]): void {
    sound.playShoot(lvl);
    if (lvl === 1) {
      bullets.push(new Bullet(this.x, this.y - 20, 0, -18, true, 26));
    } else if (lvl === 2) {
      bullets.push(new Bullet(this.x - 10, this.y - 18, 0, -19, true, 25));
      bullets.push(new Bullet(this.x + 10, this.y - 18, 0, -19, true, 25));
    } else if (lvl === 3) {
      bullets.push(new Bullet(this.x, this.y - 22, 0, -20, true, 30));
      bullets.push(new Bullet(this.x - 14, this.y - 14, -1.3, -19, true, 22));
      bullets.push(new Bullet(this.x + 14, this.y - 14, 1.3, -19, true, 22));
    } else if (lvl === 4) {
      bullets.push(new Bullet(this.x - 6, this.y - 22, 0, -20, true, 26));
      bullets.push(new Bullet(this.x + 6, this.y - 22, 0, -20, true, 26));
      bullets.push(new Bullet(this.x - 18, this.y - 12, -2.2, -19, true, 24));
      bullets.push(new Bullet(this.x + 18, this.y - 12, 2.2, -19, true, 24));
    } else {
      // Level 5 Overcharged Hyper Laser Cannon
      bullets.push(new Bullet(this.x, this.y - 24, 0, -23, true, 44, '#38bdf8', 4.5));
      bullets.push(new Bullet(this.x - 12, this.y - 18, -1.2, -21, true, 28));
      bullets.push(new Bullet(this.x + 12, this.y - 18, 1.2, -21, true, 28));
      bullets.push(new Bullet(this.x - 22, this.y - 12, -3.4, -19, true, 24));
      bullets.push(new Bullet(this.x + 22, this.y - 12, 3.4, -19, true, 24));
    }
  }

  fireMissiles(missiles: HomingMissile[], enemies: Enemy[]): void {
    let target: Enemy | null = null;
    let minDist = 9999;
    for (const e of enemies) {
      if (e.hp > 0 && e.y < this.y) {
        const dist = Math.hypot(e.x - this.x, e.y - this.y);
        if (dist < minDist) {
          minDist = dist;
          target = e;
        }
      }
    }
    sound.playMissile();
    missiles.push(new HomingMissile(this.x - 18, this.y, target));
    missiles.push(new HomingMissile(this.x + 18, this.y, target));
  }

  hit(dmg: number): boolean {
    if (this.invulnerableTimer > 0) return false;
    this.hp -= dmg;
    this.invulnerableTimer = 22;
    sound.playExplosion(false);
    return true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Dynamic projection shadow on sea / terrain
    const shadowOffset = 32;
    ctx.save();
    ctx.translate(this.x + shadowOffset * 0.45, this.y + shadowOffset);
    ctx.rotate(this.tilt * 0.4);
    ctx.scale(0.85, 0.85);
    ctx.fillStyle = 'rgba(2, 6, 15, 0.45)';
    this.drawMesh(ctx, true);
    ctx.restore();

    // 2. Fighter body
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    if (this.invulnerableTimer % 4 < 2) {
      // Twin thruster exhaust plumes
      const pGrad = ctx.createLinearGradient(0, 18, 0, 48);
      pGrad.addColorStop(0, '#38bdf8');
      pGrad.addColorStop(0.5, '#0284c7');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;

      // Left thruster
      ctx.beginPath();
      ctx.moveTo(-7, 20);
      ctx.lineTo(-3, 20);
      ctx.lineTo(-5, 36 + Math.random() * 10);
      ctx.fill();

      // Right thruster
      ctx.beginPath();
      ctx.moveTo(3, 20);
      ctx.lineTo(7, 20);
      ctx.lineTo(5, 36 + Math.random() * 10);
      ctx.fill();

      this.drawMesh(ctx, false);
    }

    ctx.restore();
  }

  drawMesh(ctx: CanvasRenderingContext2D, isShadow: boolean): void {
    if (!isShadow) {
      const grad = ctx.createLinearGradient(-26, -26, 26, 26);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.4, '#0284c7');
      grad.addColorStop(1, '#082f49');
      ctx.fillStyle = grad;
    }

    // Sleek fighter fuselage
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(9, -8);
    ctx.lineTo(28, 8);
    ctx.lineTo(25, 18);
    ctx.lineTo(7, 16);
    ctx.lineTo(6, 22);
    ctx.lineTo(-6, 22);
    ctx.lineTo(-7, 16);
    ctx.lineTo(-25, 18);
    ctx.lineTo(-28, 8);
    ctx.lineTo(-9, -8);
    ctx.closePath();
    ctx.fill();

    if (!isShadow) {
      // Cockpit canopy glow
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, -7, 4.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing energy lines
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-22, 12);
      ctx.lineTo(-8, 6);
      ctx.moveTo(22, 12);
      ctx.lineTo(8, 6);
      ctx.stroke();

      // Wingtip lights
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-26, 14, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(26, 14, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  userData,
  onGameOver,
  onVictory,
  onStarsCollected,
  isPaused,
  onTogglePause,
  onBombUsed,
  bombCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live HUD states
  const [hudHp, setHudHp] = useState<number>(100);
  const [hudMaxHp, setHudMaxHp] = useState<number>(100);
  const [hudScore, setHudScore] = useState<number>(0);
  const [hudStars, setHudStars] = useState<number>(0);
  const [bossHp, setBossHp] = useState<{ current: number; max: number; phase: number } | null>(null);
  const [bossWarning, setBossWarning] = useState<boolean>(false);

  // Engine refs
  const inputRef = useRef<{ x: number; y: number; touching: boolean }>({ x: 240, y: 600, touching: false });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const shakeRef = useRef<number>(0);

  // Entities refs
  const playerRef = useRef<Player | null>(null);
  const bulletsRef = useRef<Bullet[]>([]);
  const missilesRef = useRef<HomingMissile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const starsRef = useRef<Star[]>([]);
  const rescueZonesRef = useRef<RescueZone[]>([]);
  const particlesRef = useRef<(Particle | SmokeParticle)[]>([]);
  const islandsRef = useRef<{ x: number; y: number; size: number }[]>([]);
  const cloudsRef = useRef<{ x: number; y: number; scale: number; speed: number }[]>([]);

  // Mega bomb shockwave animation ref
  const shockwaveRef = useRef<{ active: boolean; radius: number; maxRadius: number; x: number; y: number } | null>(null);

  // Stats tracker
  const statsRef = useRef<RunStats>({
    score: 0,
    starsGained: 0,
    enemiesTotal: 0,
    enemiesDestroyed: 0,
    hostagesTotal: 0,
    hostagesSaved: 0,
    hullDamageTaken: false,
    bossDefeated: false,
    flightTimeSec: 0,
  });

  const stageProgressRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const bossSpawnedRef = useRef<boolean>(false);
  const isFinishedRef = useRef<boolean>(false);

  // Trigger Mega Bomb EMP
  const triggerMegaBomb = useCallback(() => {
    if (bombCount <= 0 || isFinishedRef.current || isPaused) return;
    if (onBombUsed) onBombUsed(bombCount - 1);
    sound.playMegaBomb();
    shakeRef.current = 24;

    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 480;
    const h = canvas ? canvas.height : 800;

    shockwaveRef.current = {
      active: true,
      radius: 20,
      maxRadius: Math.max(w, h) * 1.2,
      x: playerRef.current ? playerRef.current.x : w / 2,
      y: playerRef.current ? playerRef.current.y : h / 2,
    };

    // Clear all enemy bullets
    bulletsRef.current = bulletsRef.current.filter((b) => b.isPlayer);

    // Deal heavy damage to all enemies on screen
    enemiesRef.current.forEach((e) => {
      e.hp -= 420;
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push(new Particle(e.x, e.y, '#38bdf8', 1.5));
      }
      if (e.hp <= 0) {
        sound.playExplosion(e.type === 'boss');
        statsRef.current.score += e.scoreVal;
        statsRef.current.enemiesDestroyed++;
        for (let i = 0; i < e.starsDrop; i++) {
          starsRef.current.push(new Star(e.x, e.y));
        }
      }
    });
  }, [bombCount, isPaused, onBombUsed]);

  // Keyboard and Pointer listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' || e.key === 'b' || e.key === 'B') {
        triggerMegaBomb();
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        onTogglePause();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerMegaBomb, onTogglePause]);

  // Main game initialization and loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const updateSize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const w = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const h = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

    // Initialize player
    const player = new Player(w, h, userData.upgrades.health);
    playerRef.current = player;
    setHudHp(player.hp);
    setHudMaxHp(player.maxHp);
    inputRef.current.x = w / 2;
    inputRef.current.y = h - 120;

    // Initialize environment islands & clouds
    islandsRef.current = [];
    for (let i = 0; i < 6; i++) {
      islandsRef.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 45 + Math.random() * 65,
      });
    }

    cloudsRef.current = [];
    for (let i = 0; i < 5; i++) {
      cloudsRef.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        scale: 0.8 + Math.random() * 1.1,
        speed: 1.1 + Math.random() * 0.9,
      });
    }

    isFinishedRef.current = false;
    let animId: number;
    let startTime = Date.now();

    const loop = () => {
      if (isPaused) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const curW = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
      const curH = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

      statsRef.current.flightTimeSec = Math.floor((Date.now() - startTime) / 1000);

      // Handle keyboard navigation
      const speed = 7.5;
      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) {
        inputRef.current.x -= speed;
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) {
        inputRef.current.x += speed;
      }
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) {
        inputRef.current.y -= speed;
      }
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) {
        inputRef.current.y += speed;
      }
      inputRef.current.x = Math.max(26, Math.min(curW - 26, inputRef.current.x));
      inputRef.current.y = Math.max(40, Math.min(curH - 40, inputRef.current.y));

      ctx.save();

      // Screen shake
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current;
        const sy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(sx, sy);
        shakeRef.current *= 0.9;
        if (shakeRef.current < 0.5) shakeRef.current = 0;
      }

      // 1. Sea background
      const seaGrad = ctx.createLinearGradient(0, 0, 0, curH);
      seaGrad.addColorStop(0, '#04172c');
      seaGrad.addColorStop(1, '#032a48');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, curW, curH);

      // Subtle water shimmer lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      const gridOffset = (Date.now() * 0.04) % 40;
      for (let y = gridOffset; y < curH; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(curW, y);
        ctx.stroke();
      }

      // 2. Islands and Terrain
      islandsRef.current.forEach((isl) => {
        isl.y += 0.85;
        if (isl.y > curH + 100) {
          isl.y = -100;
          isl.x = Math.random() * curW;
        }

        // Island shadow
        ctx.fillStyle = 'rgba(2, 6, 18, 0.45)';
        ctx.beginPath();
        ctx.arc(isl.x + 14, isl.y + 24, isl.size, 0, Math.PI * 2);
        ctx.fill();

        // Island base
        const islGrad = ctx.createRadialGradient(isl.x, isl.y, 6, isl.x, isl.y, isl.size);
        islGrad.addColorStop(0, '#2e5d3c');
        islGrad.addColorStop(0.7, '#1b4327');
        islGrad.addColorStop(1, '#0d2817');
        ctx.fillStyle = islGrad;
        ctx.beginPath();
        ctx.arc(isl.x, isl.y, isl.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Rescue Zones
      rescueZonesRef.current.forEach((rz) => {
        rz.update(player, starsRef.current, () => {
          statsRef.current.hostagesSaved++;
          statsRef.current.score += 600;
        });
        rz.draw(ctx);
      });
      rescueZonesRef.current = rescueZonesRef.current.filter((rz) => !rz.rescued && rz.y < curH + 60);

      // 4. Update player
      player.update(
        inputRef.current.x,
        inputRef.current.y,
        curW,
        curH,
        userData.upgrades.cannon,
        userData.upgrades.missile,
        bulletsRef.current,
        missilesRef.current,
        enemiesRef.current
      );
      setHudHp(Math.max(0, player.hp));

      // 5. Spawn enemy waves
      stageProgressRef.current += 0.12;
      spawnTimerRef.current++;

      // Spawning rescue zones periodically
      if (spawnTimerRef.current % 400 === 0 && !bossSpawnedRef.current) {
        statsRef.current.hostagesTotal++;
        rescueZonesRef.current.push(new RescueZone(80 + Math.random() * (curW - 160), -40));
      }

      // Enemy progression waves
      if (stageProgressRef.current < 110) {
        if (spawnTimerRef.current % 45 === 0) {
          statsRef.current.enemiesTotal++;
          enemiesRef.current.push(new Enemy(50 + Math.random() * (curW - 100), -30, 'scout'));
        }
        if (spawnTimerRef.current % 150 === 0) {
          statsRef.current.enemiesTotal++;
          enemiesRef.current.push(new Enemy(60 + Math.random() * (curW - 120), -40, 'turret'));
        }
      } else if (stageProgressRef.current >= 110 && stageProgressRef.current < 270) {
        if (spawnTimerRef.current % 60 === 0) {
          statsRef.current.enemiesTotal++;
          enemiesRef.current.push(new Enemy(50 + Math.random() * (curW - 100), -30, 'interceptor'));
        }
        if (spawnTimerRef.current % 85 === 0) {
          statsRef.current.enemiesTotal++;
          enemiesRef.current.push(new Enemy(70 + Math.random() * (curW - 140), -50, 'gunship'));
        }
        if (spawnTimerRef.current % 120 === 0) {
          statsRef.current.enemiesTotal++;
          enemiesRef.current.push(new Enemy(50 + Math.random() * (curW - 100), -40, 'turret'));
        }
      } else if (stageProgressRef.current >= 270 && !bossSpawnedRef.current) {
        bossSpawnedRef.current = true;
        statsRef.current.enemiesTotal++;
        setBossWarning(true);
        sound.playBossAlarm();
        setTimeout(() => setBossWarning(false), 3500);

        const boss = new Enemy(curW / 2, -100, 'boss');
        enemiesRef.current.push(boss);
      }

      // 6. Enemies update & draw
      let bossEntity: Enemy | null = null;
      enemiesRef.current.forEach((e) => {
        e.update(player, bulletsRef.current, curW, () => {
          shakeRef.current = 18;
        });
        e.draw(ctx, player.x, player.y);
        if (e.type === 'boss') {
          bossEntity = e;
        }
      });

      if (bossEntity) {
        setBossHp({ current: (bossEntity as Enemy).hp, max: (bossEntity as Enemy).maxHp, phase: (bossEntity as Enemy).phase });
      } else {
        setBossHp(null);
      }

      // 7. Bullets update & collision
      bulletsRef.current.forEach((b) => b.update());
      bulletsRef.current.forEach((b) => b.draw(ctx));

      // Player bullets hit enemies
      bulletsRef.current.forEach((b) => {
        if (b.isPlayer) {
          enemiesRef.current.forEach((e) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
              e.hp -= b.dmg;
              b.y = -9999;
              particlesRef.current.push(new Particle(b.x, b.y, '#38bdf8', 0.8));

              if (e.hp <= 0) {
                sound.playExplosion(e.type === 'boss');
                shakeRef.current = e.type === 'boss' ? 24 : 8;
                statsRef.current.score += e.scoreVal;
                statsRef.current.enemiesDestroyed++;

                // Drop stars
                for (let i = 0; i < e.starsDrop; i++) {
                  starsRef.current.push(new Star(e.x, e.y));
                }

                if (e.type === 'boss') {
                  statsRef.current.bossDefeated = true;
                  // Victory sequence
                  if (!isFinishedRef.current) {
                    isFinishedRef.current = true;
                    setTimeout(() => {
                      onVictory(statsRef.current);
                    }, 1400);
                  }
                }
              }
            }
          });
        } else {
          // Enemy bullets hit player
          if (Math.hypot(b.x - player.x, b.y - player.y) < player.radius + b.radius) {
            b.y = 9999;
            statsRef.current.hullDamageTaken = true;
            const didHit = player.hit(b.dmg);
            if (didHit) {
              shakeRef.current = 14;
              for (let i = 0; i < 12; i++) {
                particlesRef.current.push(new Particle(player.x, player.y, '#ef4444'));
              }
              if (player.hp <= 0 && !isFinishedRef.current) {
                isFinishedRef.current = true;
                setTimeout(() => {
                  onGameOver(statsRef.current);
                }, 500);
              }
            }
          }
        }
      });

      // 8. Missiles update & collision
      missilesRef.current.forEach((m) => {
        m.update(enemiesRef.current, particlesRef.current);
        m.draw(ctx);
        enemiesRef.current.forEach((e) => {
          if (Math.hypot(m.x - e.x, m.y - e.y) < e.radius + 8) {
            e.hp -= 70;
            m.life = 0;
            sound.playExplosion(false);
            for (let i = 0; i < 14; i++) {
              particlesRef.current.push(new Particle(m.x, m.y, '#f97316'));
            }
            if (e.hp <= 0) {
              sound.playExplosion(e.type === 'boss');
              shakeRef.current = e.type === 'boss' ? 24 : 8;
              statsRef.current.score += e.scoreVal;
              statsRef.current.enemiesDestroyed++;
              for (let i = 0; i < e.starsDrop; i++) {
                starsRef.current.push(new Star(e.x, e.y));
              }
              if (e.type === 'boss' && !isFinishedRef.current) {
                statsRef.current.bossDefeated = true;
                isFinishedRef.current = true;
                setTimeout(() => {
                  onVictory(statsRef.current);
                }, 1400);
              }
            }
          }
        });
      });

      // Clean invalid bullets, missiles, enemies
      bulletsRef.current = bulletsRef.current.filter((b) => b.y > -20 && b.y < curH + 20);
      missilesRef.current = missilesRef.current.filter((m) => m.life > 0);
      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0 && e.y < curH + 130);

      // 9. Draw player
      player.draw(ctx);

      // 10. Stars update & draw
      starsRef.current.forEach((s) => {
        s.update(player, userData.upgrades.magnet, () => {
          statsRef.current.starsGained++;
          statsRef.current.score += 25;
          onStarsCollected(1);
        });
        s.draw(ctx);
      });
      starsRef.current = starsRef.current.filter((s) => !s.collected && s.y < curH + 30);

      // 11. Mega Bomb EMP Shockwave expansion
      if (shockwaveRef.current && shockwaveRef.current.active) {
        shockwaveRef.current.radius += 24;
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(shockwaveRef.current.x, shockwaveRef.current.y, shockwaveRef.current.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (shockwaveRef.current.radius >= shockwaveRef.current.maxRadius) {
          shockwaveRef.current.active = false;
        }
      }

      // 12. Particles update & draw
      particlesRef.current.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // 13. Top layer clouds for atmospheric altitude
      cloudsRef.current.forEach((c) => {
        c.y += c.speed;
        if (c.y > curH + 150) {
          c.y = -150;
          c.x = Math.random() * curW;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        const cGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 75);
        cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
        cGrad.addColorStop(0.7, 'rgba(203, 213, 225, 0.06)');
        cGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Update HUD scores
      setHudScore(statsRef.current.score);
      setHudStars(statsRef.current.starsGained);

      ctx.restore();

      if (!isFinishedRef.current) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateSize);
    };
  }, [userData, onGameOver, onVictory, onStarsCollected, isPaused]);

  // Touch and Mouse handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    sound.init();
    inputRef.current.touching = true;
    const rect = e.currentTarget.getBoundingClientRect();
    inputRef.current.x = e.clientX - rect.left;
    inputRef.current.y = e.clientY - rect.top;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (inputRef.current.touching) {
      const rect = e.currentTarget.getBoundingClientRect();
      inputRef.current.x = e.clientX - rect.left;
      inputRef.current.y = e.clientY - rect.top;
    }
  };

  const handlePointerUp = () => {
    inputRef.current.touching = false;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Boss Warning Banner */}
      {bossWarning && (
        <div className="absolute top-24 left-0 right-0 py-3 bg-red-950/80 border-y border-red-500 text-center animate-pulse pointer-events-none z-20">
          <p className="text-xs uppercase tracking-widest text-red-300 font-mono">WARNING // HIGH THREAT DETECTED</p>
          <h2 className="text-xl font-black text-red-500 tracking-wider">TITAN OVERLORD APPROACHING</h2>
        </div>
      )}

      {/* Top Tactical HUD Bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between pointer-events-none z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
        {/* Armor & Hull Meter */}
        <div className="flex flex-col gap-1 w-44">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-300">
            <span>ARMOR</span>
            <span className="tabular-nums font-semibold">{hudHp} / {hudMaxHp}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 border border-cyan-500/40 rounded-sm overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 transition-all duration-150 rounded-sm"
              style={{ width: `${Math.max(0, Math.min(100, (hudHp / hudMaxHp) * 100))}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-cyan-300/80 tracking-wide mt-0.5">
            SCORE: <span className="tabular-nums font-bold text-white">{hudScore}</span>
          </div>
        </div>

        {/* Boss HP Bar in middle if active */}
        {bossHp && (
          <div className="flex-1 max-w-[200px] mx-2 flex flex-col items-center">
            <div className="text-[10px] font-mono text-red-400 font-bold tracking-wider mb-0.5">
              {bossHp.phase === 2 ? 'BOSS · RAGE OVERDRIVE' : 'TITAN OVERLORD'}
            </div>
            <div className="h-2 w-full bg-slate-900 border border-red-500/60 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${bossHp.phase === 2 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-red-600'}`}
                style={{ width: `${Math.max(0, Math.min(100, (bossHp.current / bossHp.max) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Collected Stars & Controls */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 border border-amber-500/30 rounded text-amber-300 font-mono text-xs font-bold shadow-sm">
            <span>★</span>
            <span className="tabular-nums">+{hudStars}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePause}
              className="px-2 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono transition-colors"
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Super Weapon Trigger (Mega Bomb) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1">
        <button
          onClick={triggerMegaBomb}
          disabled={bombCount <= 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-xs font-bold tracking-wider transition-all duration-150 ${
            bombCount > 0
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/25 active:scale-95'
              : 'bg-slate-900/70 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <span>EMP BOMB</span>
          <span className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 text-[10px] tabular-nums">
            x{bombCount}
          </span>
        </button>
        <span className="text-[10px] font-mono text-slate-400/80 pr-1">[SPACE / B]</span>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
          <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-xl text-center max-w-xs shadow-2xl">
            <h3 className="text-xl font-bold tracking-wider text-white mb-2">MISSION PAUSED</h3>
            <p className="text-xs text-slate-400 font-mono mb-5">
              Drag or use WASD/Arrows to maneuver. Press [SPACE] for EMP Blast.
            </p>
            <button
              onClick={onTogglePause}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md"
            >
              Resume Flight
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
