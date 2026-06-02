import {
  CANVAS_DPR,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CLAW,
  GROUND_HEIGHT,
  GIFT_CONFIG,
  ITEMS,
  MINER,
  WALLS,
  getGiftForItem,
} from './config.js';
import { loadSprites } from './assets.js';

const GamePhase = {
  Intro: 'INTRO',
  Playing: 'PLAYING',
};

const HookState = {
  Swinging: 'swinging',
  Extending: 'extending',
  Reeling: 'reeling',
};

const CLAW_DISPLAY_WIDTH = 65;
const CLAW_DISPLAY_HEIGHT = 65;
const MINER_DISPLAY_HEIGHT = 85;
const GRAB_SHAKE_FRAMES = 10;
const GRAB_SHAKE_MAGNITUDE = 6;
const GRAB_SPARK_COUNT = 14;

class SparkParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.alpha = 1;
    this.size = Math.random() * 3 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.04;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#E0F7FA';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size);
    ctx.lineTo(this.x + this.size, this.y);
    ctx.lineTo(this.x, this.y + this.size);
    ctx.lineTo(this.x - this.size, this.y);
    ctx.fill();
    ctx.restore();
  }
}

export class MiningGame {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   onGift: (gift: import('./config.js').GiftConfig) => void,
   *   onReady?: () => void,
   *   onClawStart?: () => void,
   *   onClawStop?: () => void,
   *   onItemGrab?: (item: import('./config.js').MineItem) => void,
   *   onProposalReveal?: () => void,
   *   onIntroComplete?: () => void,
   * }} callbacks
   */
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.setupPortraitCanvas();

    this.gamePhase = GamePhase.Intro;
    this.state = HookState.Swinging;
    this.angle = CLAW.swingMin;
    this.swingDir = 1;
    this.length = 36;
    this.attached = null;
    this.paused = false;
    this._clawActive = false;
    this.pivotX = CANVAS_WIDTH / 2;
    this.pivotY = GROUND_HEIGHT - 10;
    this.shakeTimer = 0;
    this.grabSparks = [];

    this.miner = {
      x: -200,
      y: 0,
      targetX: 0,
      walkSpeed: MINER.introWalkSpeed,
      bobPhase: 0,
    };

    this.items = [];

    /** @type {import('./assets.js').SpriteSheet | null} */
    this.sprites = null;

    this.resetMinerPosition(true);

    this.sparkles = Array.from({ length: 40 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: GROUND_HEIGHT + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT),
      vy: -0.3 - Math.random() * 0.8,
      life: Math.random(),
    }));

    this.resetItems();
    this.bindInput();

    loadSprites()
      .then((sprites) => {
        this.sprites = sprites;
        if (!sprites.miner?.complete) {
          console.error(
            'Miner sprite unavailable — expected',
            'assets/sprites/miner.png (lowercase .png)',
          );
        }
        if (!sprites.cave?.complete) {
          console.error(
            'Cave background unavailable — expected',
            'assets/sprites/cave-bg.png (hyphen, lowercase)',
          );
        }
        this.resetMinerPosition(true);
        this.updatePivot();
        this.callbacks.onReady?.();
      })
      .catch((err) => console.warn('Sprite load failed, using fallbacks:', err));
  }

  /** 9:16 logical space (540×960) at 2× backing store for crisp mobile rendering */
  setupPortraitCanvas() {
    const baseWidth = CANVAS_WIDTH;
    const baseHeight = CANVAS_HEIGHT;

    this.canvas.width = baseWidth * CANVAS_DPR;
    this.canvas.height = baseHeight * CANVAS_DPR;
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100dvh';
    this.ctx.setTransform(CANVAS_DPR, 0, 0, CANVAS_DPR, 0, 0);
  }

  getMinerDimensions() {
    const img = this.sprites?.miner;
    const height = MINER_DISPLAY_HEIGHT;
    const width = img?.complete
      ? (img.naturalWidth / img.naturalHeight) * height
      : 45;
    return { width, height };
  }

  resetMinerPosition(offScreen) {
    const { width, height } = this.getMinerDimensions();
    this.miner.targetX = CANVAS_WIDTH / 2 - width / 2;
    this.miner.y = 8;
    this.miner.x = offScreen ? -width - 48 : this.miner.targetX;
    this.miner.bobPhase = 0;
    this.updatePivot();
  }

  updatePivot() {
    const { width } = this.getMinerDimensions();
    const bob =
      this.gamePhase === GamePhase.Intro && this.miner.x < this.miner.targetX
        ? Math.sin(this.miner.bobPhase) * 3
        : 0;
    const groundOffset = MINER.groundDrawOffset;
    // Re-anchored to miner base center line (platform / boot shadow)
    this.pivotX = this.miner.x + width / 2;
    this.pivotY = this.miner.y + bob + groundOffset + MINER.pivotFootOffsetY;
  }

  resetItems() {
    this.items = ITEMS.map((item) => ({
      ...item,
      collected: false,
      active: true,
    }));
  }

  getItemHitRadius(item) {
    const visualRadius = item.radius * 1.2;
    return visualRadius + CLAW.clawRadius;
  }

  reset() {
    this.gamePhase = GamePhase.Intro;
    this.state = HookState.Swinging;
    this.angle = CLAW.swingMin;
    this.swingDir = 1;
    this.length = 36;
    this.attached = null;
    this.paused = false;
    this._clawActive = false;
    this.shakeTimer = 0;
    this.grabSparks = [];
    this.resetMinerPosition(true);
    this.resetItems();
  }

  spawnGrabSparks(x, y) {
    for (let i = 0; i < GRAB_SPARK_COUNT; i++) {
      this.grabSparks.push(new SparkParticle(x, y));
    }
  }

  updateGrabSparks() {
    for (const spark of this.grabSparks) {
      spark.update();
    }
    this.grabSparks = this.grabSparks.filter((s) => s.alpha > 0);
  }

  bindInput() {
    this._touchLaunchGuard = false;

    this._handleLaunchInput = (event) => {
      if (event.type === 'touchstart') {
        event.preventDefault();
        this._touchLaunchGuard = true;
        setTimeout(() => {
          this._touchLaunchGuard = false;
        }, 400);
      }

      if (event.type === 'mousedown' && this._touchLaunchGuard) {
        return;
      }

      if (this.paused || this.gamePhase !== GamePhase.Playing) {
        return;
      }

      if (this.state === HookState.Swinging) {
        this.launch();
      }
    };

    this._onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowDown') {
        e.preventDefault();
        this._handleLaunchInput(e);
      }
    };

    window.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('touchstart', this._handleLaunchInput, { passive: false });
    this.canvas.addEventListener('mousedown', this._handleLaunchInput);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    this.canvas.removeEventListener('touchstart', this._handleLaunchInput);
    this.canvas.removeEventListener('mousedown', this._handleLaunchInput);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  launch() {
    if (
      this.gamePhase !== GamePhase.Playing ||
      this.state !== HookState.Swinging ||
      this.paused
    ) {
      return false;
    }
    this.state = HookState.Extending;
    this.length = 40;
    this.syncClawAudio();
    return true;
  }

  syncClawAudio() {
    const active = this.state === HookState.Extending || this.state === HookState.Reeling;
    if (active === this._clawActive) return;
    this._clawActive = active;
    if (active) this.callbacks.onClawStart?.();
    else this.callbacks.onClawStop?.();
  }

  get tip() {
    return {
      x: this.pivotX + Math.sin(this.angle) * this.length,
      y: this.pivotY + Math.cos(this.angle) * this.length,
    };
  }

  updateIntro(dt) {
    const { width } = this.getMinerDimensions();

    if (this.miner.x < this.miner.targetX) {
      this.miner.x = Math.min(this.miner.targetX, this.miner.x + this.miner.walkSpeed * dt);
      this.miner.bobPhase += dt * 14;
    } else {
      this.miner.x = this.miner.targetX;
      this.gamePhase = GamePhase.Playing;
      this.angle = CLAW.swingMin;
      this.swingDir = 1;
      this.callbacks.onIntroComplete?.();
    }

    this.updatePivot();
  }

  update(dt) {
    this.updateGrabSparks();

    if (this.gamePhase === GamePhase.Intro) {
      this.updateIntro(dt);
      this.sparkles.forEach((s) => {
        s.y += s.vy;
        s.life += dt * 0.4;
        if (s.y < GROUND_HEIGHT || s.life > 1) {
          s.x = Math.random() * CANVAS_WIDTH;
          s.y = GROUND_HEIGHT + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 40);
          s.life = 0;
        }
      });
      return;
    }

    if (this.paused) return;

    this.sparkles.forEach((s) => {
      s.y += s.vy;
      s.life += dt * 0.4;
      if (s.y < GROUND_HEIGHT || s.life > 1) {
        s.x = Math.random() * CANVAS_WIDTH;
        s.y = GROUND_HEIGHT + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 40);
        s.life = 0;
      }
    });

    switch (this.state) {
      case HookState.Swinging:
        this.angle += this.swingDir * CLAW.swingSpeed * dt;
        if (this.angle >= CLAW.swingMax) {
          this.angle = CLAW.swingMax;
          this.swingDir = -1;
        } else if (this.angle <= CLAW.swingMin) {
          this.angle = CLAW.swingMin;
          this.swingDir = 1;
        }
        this.length = 38;
        break;

      case HookState.Extending: {
        this.length += CLAW.extendSpeed * dt;
        const hit = this.checkItemHit();
        if (hit) {
          this.attached = hit;
          hit.collected = true;
          this.shakeTimer = GRAB_SHAKE_FRAMES;
          this.spawnGrabSparks(this.tip.x, this.tip.y);
          this.callbacks.onItemGrab?.(hit);
          this.state = HookState.Reeling;
          this.syncClawAudio();
          break;
        }
        if (this.hitsWallOrBounds() || this.length >= this.maxReach()) {
          this.state = HookState.Reeling;
          this.syncClawAudio();
        }
        break;
      }

      case HookState.Reeling: {
        const weight = this.attached?.weight ?? 1;
        this.length -= (CLAW.reelSpeed / weight) * dt;
        if (this.length <= 38) {
          this.length = 38;
          if (this.attached) {
            this.bankItem(this.attached);
            this.attached = null;
          }
          this.state = HookState.Swinging;
          this.syncClawAudio();
        }
        break;
      }
    }
  }

  maxReach() {
    const margin = 24;
    const maxY = CANVAS_HEIGHT - margin;
    const maxX = CANVAS_WIDTH - margin;
    const minX = margin;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const limits = [];
    if (cos > 0.01) limits.push((maxY - this.pivotY) / cos);
    if (sin > 0.01) limits.push((maxX - this.pivotX) / sin);
    if (sin < -0.01) limits.push((minX - this.pivotX) / sin);
    return Math.min(...limits.filter((n) => n > 0), CANVAS_HEIGHT * 0.88);
  }

  hitsWallOrBounds() {
    const { x, y } = this.tip;
    if (x < 12 || x > CANVAS_WIDTH - 12 || y > CANVAS_HEIGHT - 12) return true;
    if (y < GROUND_HEIGHT + 8) return true;

    for (const w of WALLS) {
      if (distPointToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < CLAW.clawRadius + 4) return true;
    }
    return false;
  }

  checkItemHit() {
    const { x, y } = this.tip;
    let closest = null;
    let closestDistSq = Infinity;

    for (const item of this.items) {
      if (!item.active) continue;
      if (item.collected && item !== this.attached) continue;

      const dx = item.x - x;
      const dy = item.y - y;
      const hitR = this.getItemHitRadius(item);
      const distSq = dx * dx + dy * dy;

      if (distSq <= hitR * hitR && distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = item;
      }
    }

    return closest;
  }

  bankItem(item) {
    item.active = false;

    const gift = getGiftForItem(item.id);
    if (gift) {
      this.callbacks.onProposalReveal?.();
      this.pause();
      this.callbacks.onGift(gift);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTimer > 0) {
      shakeX = (Math.random() - 0.5) * GRAB_SHAKE_MAGNITUDE;
      shakeY = (Math.random() - 0.5) * GRAB_SHAKE_MAGNITUDE;
      this.shakeTimer--;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawCave(ctx);
    this.drawGround(ctx);
    this.drawSparkles(ctx);
    this.drawItems(ctx);
    this.drawWinchPlatform(ctx);
    this.drawMiner(ctx);
    this.drawWinchPivot(ctx);
    if (this.gamePhase === GamePhase.Playing) {
      this.drawClaw(ctx);
    }
    this.drawGrabSparks(ctx);

    ctx.restore();
  }

  drawGrabSparks(ctx) {
    for (const spark of this.grabSparks) {
      spark.draw(ctx);
    }
  }

  drawGround(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_HEIGHT);
    g.addColorStop(0, '#4a5f7a');
    g.addColorStop(1, '#3d4f6a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = '#2a3548';
    ctx.fillRect(0, GROUND_HEIGHT - 4, CANVAS_WIDTH, 4);
  }

  drawCave(ctx) {
    const baseWidth = CANVAS_WIDTH;
    const baseHeight = CANVAS_HEIGHT;
    const cave = this.sprites?.cave;

    if (cave?.complete && cave.naturalWidth) {
      const imgScale = baseHeight / cave.naturalHeight;
      const newWidth = cave.naturalWidth * imgScale;
      const xOffset = (baseWidth - newWidth) / 2;

      ctx.fillStyle = '#0b0e14';
      ctx.fillRect(0, 0, baseWidth, baseHeight);
      ctx.drawImage(cave, xOffset, 0, newWidth, baseHeight);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, baseHeight);
      grad.addColorStop(0, '#1a2848');
      grad.addColorStop(0.5, '#241838');
      grad.addColorStop(1, '#120c1c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, baseWidth, baseHeight);
    }

    ctx.fillStyle = 'rgba(10, 6, 18, 0.2)';
    ctx.fillRect(0, GROUND_HEIGHT, baseWidth, 40);
  }

  drawSparkles(ctx) {
    for (const s of this.sparkles) {
      const a = 0.15 + Math.sin(s.life * 6) * 0.25;
      ctx.fillStyle = `rgba(110, 251, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawItems(ctx) {
    const diamondImg = this.sprites?.diamond;

    this.items.forEach((item) => {
      if (!item.active) return;
      if (item.collected && item !== this.attached) return;

      const px = item === this.attached ? this.tip.x : item.x;
      const py = item === this.attached ? this.tip.y : item.y;
      const r = item.radius;

      const isSurprise = GIFT_CONFIG.some((gift) => gift.trigger_item_id === item.id);

      if (isSurprise) {
        ctx.save();
        const gradient = ctx.createRadialGradient(px, py, 2, px, py, r * 2.5);
        gradient.addColorStop(0, 'rgba(255, 223, 128, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 180, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (diamondImg?.complete) {
        const size = r * 2.4;
        const offset = size / 2;
        ctx.drawImage(diamondImg, px - offset, py - offset, size, size);
      } else {
        drawDiamondFallback(ctx, px, py, r);
      }
    });
  }

  drawClaw(ctx) {
    const tip = this.tip;

    ctx.strokeStyle = CLAW.cableColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.pivotX, this.pivotY);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();

    const clawImg = this.sprites?.claw;
    if (clawImg?.complete) {
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(this.angle);
      ctx.drawImage(
        clawImg,
        -CLAW_DISPLAY_WIDTH / 2,
        0,
        CLAW_DISPLAY_WIDTH,
        CLAW_DISPLAY_HEIGHT,
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(this.angle);
      drawClawFallback(ctx);
      ctx.restore();
    }
  }

  /** Soft ground shadow — drawn behind the miner */
  drawWinchPlatform(ctx) {
    const { width, height } = this.getMinerDimensions();
    const bob =
      this.gamePhase === GamePhase.Intro && this.miner.x < this.miner.targetX
        ? Math.sin(this.miner.bobPhase) * 3
        : 0;
    const shadowX = this.miner.x + width / 2;
    const shadowY = this.miner.y + bob + MINER.groundDrawOffset + height - 3;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 25, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();
    ctx.restore();
  }

  /** Cable anchor pin — drawn in front of the miner */
  drawWinchPivot(ctx) {
    ctx.fillStyle = '#c8d4e8';
    ctx.beginPath();
    ctx.arc(this.pivotX, this.pivotY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMiner(ctx) {
    const minerImg = this.sprites?.miner;
    const { width, height } = this.getMinerDimensions();
    const bob =
      this.gamePhase === GamePhase.Intro && this.miner.x < this.miner.targetX
        ? Math.sin(this.miner.bobPhase) * 3
        : 0;
    const x = this.miner.x;
    const y = this.miner.y + bob + MINER.groundDrawOffset;

    if (minerImg?.complete) {
      ctx.drawImage(minerImg, x, y, width, height);
    } else {
      ctx.fillStyle = '#ffc84a';
      ctx.fillRect(x, y, width, height - 8);
      ctx.fillStyle = '#3d4f6a';
      ctx.fillRect(x + 4, y + 8, width - 8, 20);
    }
  }
}

function drawDiamondFallback(ctx, x, y, r) {
  ctx.fillStyle = '#d8f8ff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.65, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.65, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawClawFallback(ctx) {
  ctx.fillStyle = '#ffc84a';
  ctx.strokeStyle = '#e6a820';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(-12, 14);
  ctx.lineTo(-8, 18);
  ctx.lineTo(0, 10);
  ctx.lineTo(8, 18);
  ctx.lineTo(12, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function distPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
