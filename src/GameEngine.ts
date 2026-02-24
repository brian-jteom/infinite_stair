export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  state: GameState = 'START';
  score: number = 0;
  highScore: number = 0;
  combo: number = 0;
  
  time: number = 100;
  maxTime: number = 100;
  timeDepletionRate: number = 6;
  
  stairsData: {x: number, y: number, dir: number}[] = [];
  playerIndex: number = 0;
  playerDir: number = 1;
  
  cameraX: number = 0;
  cameraY: number = 0;
  targetCameraX: number = 0;
  targetCameraY: number = 0;
  
  playerVisualX: number = 0;
  playerVisualY: number = 0;
  jumpOffset: number = 0;
  
  particles: Particle[] = [];
  stars: {x: number, y: number, size: number, speed: number}[] = [];
  shakeTimer: number = 0;
  
  lastTime: number = 0;
  animationFrameId: number = 0;
  
  onStateChange: (state: GameState, score: number, highScore: number, combo: number) => void;
  onTimeUpdate: (progress: number) => void;
  
  constructor(
    canvas: HTMLCanvasElement, 
    onStateChange: (state: GameState, score: number, highScore: number, combo: number) => void,
    onTimeUpdate: (progress: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    this.onTimeUpdate = onTimeUpdate;
    
    this.highScore = parseInt(localStorage.getItem('infinite_stairs_highscore') || '0');
    
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    
    this.restart();
    
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const targetStair = this.stairsData[this.playerIndex];
    if (targetStair) {
      this.cameraX = this.targetCameraX = -targetStair.x + this.canvas.width / 2;
      this.cameraY = this.targetCameraY = -targetStair.y + this.canvas.height * 0.7;
    }
  }
  
  restart() {
    this.state = 'START';
    this.score = 0;
    this.combo = 0;
    this.time = this.maxTime;
    this.playerIndex = 0;
    this.playerDir = 1;
    this.particles = [];
    this.shakeTimer = 0;
    
    this.initStairs();
    this.initStars();
    
    const startStair = this.stairsData[0];
    this.playerVisualX = startStair.x;
    this.playerVisualY = startStair.y;
    
    this.cameraX = this.targetCameraX = -startStair.x + this.canvas.width / 2;
    this.cameraY = this.targetCameraY = -startStair.y + this.canvas.height * 0.7;
    
    this.onStateChange(this.state, this.score, this.highScore, this.combo);
    this.onTimeUpdate(100);
  }
  
  initStairs() {
    this.stairsData = [];
    let cx = 0;
    let cy = 0;
    let currentDir = 1;
    
    const STEP_DX = 40;
    const STEP_DY = 24; // Increased height for better look
    
    for(let i=0; i<100; i++) {
      if (Math.random() > 0.6 && i > 5) {
        currentDir = -currentDir;
      }
      this.stairsData.push({ x: cx, y: cy, dir: currentDir });
      cx += currentDir * STEP_DX;
      cy -= STEP_DY;
    }
  }

  initStars() {
    this.stars = [];
    for(let i=0; i<100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.05
      });
    }
  }

  addStairs() {
    let lastStair = this.stairsData[this.stairsData.length - 1];
    let cx = lastStair.x + lastStair.dir * 40;
    let cy = lastStair.y - 24;
    let currentDir = lastStair.dir;
    
    for(let i=0; i<50; i++) {
      if (Math.random() > 0.6) {
        currentDir = -currentDir;
      }
      this.stairsData.push({ x: cx, y: cy, dir: currentDir });
      cx += currentDir * 40;
      cy -= 24;
    }
  }
  
  handleDirection(dir: 'LEFT' | 'RIGHT') {
    const targetDir = dir === 'LEFT' ? -1 : 1;
    if (this.playerDir === targetDir) {
      this.handleInput('CLIMB');
    } else {
      this.handleInput('TURN');
    }
  }

  handleInput(action: 'TURN' | 'CLIMB') {
    if (this.state === 'GAMEOVER') return;
    
    if (this.state === 'START') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
    }
    
    if (action === 'TURN') {
      this.playerDir = -this.playerDir;
    }
    
    const nextStair = this.stairsData[this.playerIndex];
    if (nextStair.dir === this.playerDir) {
      this.playerIndex++;
      this.score++;
      this.combo++;
      
      const timeAdd = Math.max(2, 8 - (this.score * 0.01));
      this.time = Math.min(this.maxTime, this.time + timeAdd);
      
      this.jumpOffset = 20;
      
      if (this.combo % 10 === 0) {
        this.triggerComboEffect();
      }
      
      if (this.playerIndex > this.stairsData.length - 30) {
        this.addStairs();
      }
      
      this.onStateChange(this.state, this.score, this.highScore, this.combo);
    } else {
      this.gameOver();
    }
  }
  
  triggerComboEffect() {
    this.shakeTimer = 150;
    const color = this.getPlayerColor();
    for(let i=0; i<30; i++) {
      this.particles.push({
        x: this.playerVisualX,
        y: this.playerVisualY - 20,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        life: 800,
        maxLife: 800,
        color: color
      });
    }
  }
  
  gameOver() {
    this.state = 'GAMEOVER';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('infinite_stairs_highscore', this.highScore.toString());
    }
    this.shakeTimer = 400;
    
    for(let i=0; i<40; i++) {
      this.particles.push({
        x: this.playerVisualX,
        y: this.playerVisualY - 20,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 10,
        life: 1500,
        maxLife: 1500,
        color: '#ef4444'
      });
    }
    
    this.onStateChange(this.state, this.score, this.highScore, this.combo);
  }
  
  getPlayerColor() {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];
    const level = Math.floor(this.combo / 10);
    return colors[level % colors.length];
  }
  
  loop(timestamp: number) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Cap dt to prevent huge jumps if tab is inactive
    this.update(Math.min(dt, 50));
    this.draw();
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
  
  update(dt: number) {
    if (this.state === 'PLAYING') {
      const currentRate = this.timeDepletionRate + (this.score * 0.15);
      this.time -= currentRate * (dt / 1000);
      
      if (this.time <= 0) {
        this.time = 0;
        this.gameOver();
      }
      this.onTimeUpdate((this.time / this.maxTime) * 100);
    }
    
    const targetStair = this.stairsData[this.playerIndex];
    if (targetStair) {
      this.targetCameraX = -targetStair.x + this.canvas.width / 2;
      this.targetCameraY = -targetStair.y + this.canvas.height * 0.7;
    }
    
    this.cameraX += (this.targetCameraX - this.cameraX) * (1 - Math.exp(-dt * 0.01));
    this.cameraY += (this.targetCameraY - this.cameraY) * (1 - Math.exp(-dt * 0.01));
    
    if (targetStair) {
      this.playerVisualX += (targetStair.x - this.playerVisualX) * (1 - Math.exp(-dt * 0.02));
      this.playerVisualY += (targetStair.y - this.playerVisualY) * (1 - Math.exp(-dt * 0.02));
    }
    this.jumpOffset *= Math.exp(-dt * 0.01);
    
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }
    
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // gravity
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }
  
  drawStair(x: number, y: number, isCurrent: boolean) {
    const ISO_W = 80;
    const ISO_H = 40;
    const THICKNESS = 12;
    
    const color = isCurrent ? '#3b82f6' : '#1e293b';
    const borderColor = isCurrent ? '#60a5fa' : '#334155';
    
    // Top
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - ISO_H/2);
    this.ctx.lineTo(x + ISO_W/2, y);
    this.ctx.lineTo(x, y + ISO_H/2);
    this.ctx.lineTo(x - ISO_W/2, y);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Glow for current stair
    if (isCurrent) {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#3b82f6';
    }
    
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Side Right
    this.ctx.fillStyle = isCurrent ? '#2563eb' : '#0f172a';
    this.ctx.beginPath();
    this.ctx.moveTo(x + ISO_W/2, y);
    this.ctx.lineTo(x, y + ISO_H/2);
    this.ctx.lineTo(x, y + ISO_H/2 + THICKNESS);
    this.ctx.lineTo(x + ISO_W/2, y + THICKNESS);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Side Left
    this.ctx.fillStyle = isCurrent ? '#1d4ed8' : '#020617';
    this.ctx.beginPath();
    this.ctx.moveTo(x - ISO_W/2, y);
    this.ctx.lineTo(x, y + ISO_H/2);
    this.ctx.lineTo(x, y + ISO_H/2 + THICKNESS);
    this.ctx.lineTo(x - ISO_W/2, y + THICKNESS);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
  
  drawPlayer(x: number, y: number, dir: number, color: string) {
    const w = 28;
    const h = 42;
    
    // Body glow
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = color;
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(x - w/2, y - h, w, h, 10);
    } else {
      this.ctx.rect(x - w/2, y - h, w, h);
    }
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // Head/Face area
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.fillRect(x - w/2 + 4, y - h + 4, w - 8, 16);
    
    // Eyes
    this.ctx.fillStyle = 'white';
    const eyeOffsetX = dir === 1 ? 6 : -14;
    this.ctx.fillRect(x + eyeOffsetX, y - h + 10, 8, 8);
    
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(x + eyeOffsetX + (dir===1?4:0), y - h + 12, 4, 4);
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, 14, 6, 0, 0, Math.PI*2);
    this.ctx.fill();
  }
  
  draw() {
    // Gradient background
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw stars
    this.ctx.fillStyle = 'white';
    this.stars.forEach(s => {
      const opacity = 0.3 + Math.sin(Date.now() * 0.001 + s.x) * 0.2;
      this.ctx.globalAlpha = opacity;
      this.ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    this.ctx.globalAlpha = 1;
    
    this.ctx.save();
    
    if (this.shakeTimer > 0) {
      const intensity = (this.shakeTimer / 400) * 15;
      this.ctx.translate((Math.random()-0.5)*intensity, (Math.random()-0.5)*intensity);
    }
    
    const startIndex = Math.max(0, this.playerIndex - 15);
    const endIndex = Math.min(this.stairsData.length, this.playerIndex + 30);
    
    for(let i = startIndex; i < endIndex; i++) {
      const stair = this.stairsData[i];
      const screenX = stair.x + this.cameraX;
      const screenY = stair.y + this.cameraY;
      this.drawStair(screenX, screenY, i === this.playerIndex);
    }
    
    if (this.state !== 'GAMEOVER' || this.shakeTimer > 200) {
      const px = this.playerVisualX + this.cameraX;
      const py = this.playerVisualY + this.cameraY - this.jumpOffset;
      this.drawPlayer(px, py, this.playerDir, this.getPlayerColor());
    }
    
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      this.ctx.beginPath();
      this.ctx.arc(p.x + this.cameraX, p.y + this.cameraY, 4, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    this.ctx.restore();
  }
  
  destroy() {
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.animationFrameId);
  }
}
