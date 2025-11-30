/**
 * Strudel Box - Particle Effects System
 * Theme-specific particle animations for immersive experience
 */

export type ThemeType = 'default' | 'halloween' | '8bit';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  type: string;
  rotation?: number;
  rotationSpeed?: number;
  color?: string;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number = 0;
  private theme: ThemeType = 'default';
  private isRunning: boolean = false;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setTheme(theme: ThemeType): void {
    this.theme = theme;
    this.particles = [];
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }


  private animate(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Spawn new particles based on theme
    this.spawnParticles();

    // Update and draw particles
    this.particles = this.particles.filter(p => {
      p.life -= delta;
      if (p.life <= 0) return false;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.opacity = Math.min(1, p.life / p.maxLife);

      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * delta;
      }

      this.drawParticle(p);
      return true;
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private spawnParticles(): void {
    const rect = this.canvas.getBoundingClientRect();
    const spawnRate = this.theme === 'halloween' ? 0.15 : 0.1;

    if (Math.random() < spawnRate) {
      switch (this.theme) {
        case 'default':
          this.spawnCyberpunkParticle(rect);
          break;
        case 'halloween':
          this.spawnHalloweenParticle(rect);
          break;
        case '8bit':
          this.spawn8BitParticle(rect);
          break;
      }
    }
  }

  // CYBERPUNK PARTICLES - Neon lines, digital rain
  private spawnCyberpunkParticle(rect: DOMRect): void {
    const types = ['neon-line', 'digital-drop', 'glitch'];
    const type = types[Math.floor(Math.random() * types.length)];

    const particle: Particle = {
      x: Math.random() * rect.width,
      y: type === 'digital-drop' ? -10 : Math.random() * rect.height,
      vx: type === 'glitch' ? (Math.random() - 0.5) * 200 : 0,
      vy: type === 'digital-drop' ? 50 + Math.random() * 100 : (Math.random() - 0.5) * 20,
      size: type === 'neon-line' ? 2 + Math.random() * 3 : 3 + Math.random() * 5,
      opacity: 0.3 + Math.random() * 0.5,
      life: 2 + Math.random() * 3,
      maxLife: 5,
      type,
      color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff'
    };

    this.particles.push(particle);
  }


  // HALLOWEEN PARTICLES - Ghosts, bats, pumpkin sparks
  private spawnHalloweenParticle(rect: DOMRect): void {
    const types = ['ghost', 'bat', 'spark', 'fog'];
    const type = types[Math.floor(Math.random() * types.length)];

    const particle: Particle = {
      x: type === 'bat' ? (Math.random() > 0.5 ? -20 : rect.width + 20) : Math.random() * rect.width,
      y: type === 'fog' ? rect.height + 10 : Math.random() * rect.height * 0.7,
      vx: type === 'bat' ? (Math.random() > 0.5 ? 80 : -80) + (Math.random() - 0.5) * 40 : (Math.random() - 0.5) * 30,
      vy: type === 'ghost' ? -20 - Math.random() * 30 : type === 'fog' ? -15 : (Math.random() - 0.5) * 20,
      size: type === 'ghost' ? 15 + Math.random() * 10 : type === 'bat' ? 12 + Math.random() * 8 : 4 + Math.random() * 4,
      opacity: type === 'fog' ? 0.1 + Math.random() * 0.15 : 0.4 + Math.random() * 0.4,
      life: type === 'fog' ? 8 + Math.random() * 4 : 3 + Math.random() * 4,
      maxLife: type === 'fog' ? 12 : 7,
      type,
      rotation: 0,
      rotationSpeed: type === 'bat' ? 3 + Math.random() * 2 : 0,
      color: type === 'spark' ? '#ff6600' : type === 'ghost' ? '#ffffff' : '#8b00ff'
    };

    this.particles.push(particle);
  }

  // 8-BIT PARTICLES - Pixel stars, arcade sparks
  private spawn8BitParticle(rect: DOMRect): void {
    const types = ['pixel-star', 'arcade-spark', 'retro-block'];
    const type = types[Math.floor(Math.random() * types.length)];

    const colors = ['#00ff00', '#ff0000', '#ffff00', '#00ffff', '#ff00ff'];
    
    const particle: Particle = {
      x: Math.random() * rect.width,
      y: type === 'arcade-spark' ? rect.height + 5 : Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 60,
      vy: type === 'arcade-spark' ? -80 - Math.random() * 60 : (Math.random() - 0.5) * 40,
      size: 4 + Math.floor(Math.random() * 3) * 2, // Pixel-perfect sizes
      opacity: 0.6 + Math.random() * 0.4,
      life: 2 + Math.random() * 2,
      maxLife: 4,
      type,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    this.particles.push(particle);
  }


  private drawParticle(p: Particle): void {
    this.ctx.save();
    this.ctx.globalAlpha = p.opacity;

    switch (p.type) {
      case 'neon-line':
        this.drawNeonLine(p);
        break;
      case 'digital-drop':
        this.drawDigitalDrop(p);
        break;
      case 'glitch':
        this.drawGlitch(p);
        break;
      case 'ghost':
        this.drawGhost(p);
        break;
      case 'bat':
        this.drawBat(p);
        break;
      case 'spark':
        this.drawSpark(p);
        break;
      case 'fog':
        this.drawFog(p);
        break;
      case 'pixel-star':
        this.drawPixelStar(p);
        break;
      case 'arcade-spark':
        this.drawArcadeSpark(p);
        break;
      case 'retro-block':
        this.drawRetroBlock(p);
        break;
    }

    this.ctx.restore();
  }

  // CYBERPUNK DRAW METHODS
  private drawNeonLine(p: Particle): void {
    this.ctx.strokeStyle = p.color || '#00ffff';
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = p.color || '#00ffff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    this.ctx.lineTo(p.x + p.size * 3, p.y + p.size);
    this.ctx.stroke();
  }

  private drawDigitalDrop(p: Particle): void {
    this.ctx.fillStyle = p.color || '#00ffff';
    this.ctx.shadowColor = p.color || '#00ffff';
    this.ctx.shadowBlur = 8;
    this.ctx.fillRect(p.x, p.y, 2, p.size * 2);
  }

  private drawGlitch(p: Particle): void {
    this.ctx.fillStyle = p.color || '#ff00ff';
    this.ctx.fillRect(p.x, p.y, p.size * 4, 2);
  }

  // HALLOWEEN DRAW METHODS
  private drawGhost(p: Particle): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 15;
    
    // Ghost body
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size * 0.6, Math.PI, 0);
    this.ctx.lineTo(p.x + p.size * 0.6, p.y + p.size * 0.8);
    // Wavy bottom
    for (let i = 0; i < 3; i++) {
      const waveX = p.x + p.size * 0.6 - (i + 1) * (p.size * 0.4);
      const waveY = p.y + p.size * 0.8 + (i % 2 === 0 ? 5 : -2);
      this.ctx.lineTo(waveX, waveY);
    }
    this.ctx.closePath();
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(p.x - p.size * 0.2, p.y - p.size * 0.1, 2, 0, Math.PI * 2);
    this.ctx.arc(p.x + p.size * 0.2, p.y - p.size * 0.1, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }


  private drawBat(p: Particle): void {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    if (p.rotation) {
      // Wing flap animation
      const flapAngle = Math.sin(p.rotation) * 0.3;
      this.ctx.rotate(flapAngle);
    }
    
    this.ctx.fillStyle = '#1a0a1a';
    this.ctx.shadowColor = '#8b00ff';
    this.ctx.shadowBlur = 5;
    
    // Bat body
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, p.size * 0.3, p.size * 0.5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Left wing
    this.ctx.beginPath();
    this.ctx.moveTo(-p.size * 0.2, 0);
    this.ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.4, -p.size, 0);
    this.ctx.quadraticCurveTo(-p.size * 0.6, p.size * 0.2, -p.size * 0.2, 0);
    this.ctx.fill();
    
    // Right wing
    this.ctx.beginPath();
    this.ctx.moveTo(p.size * 0.2, 0);
    this.ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.4, p.size, 0);
    this.ctx.quadraticCurveTo(p.size * 0.6, p.size * 0.2, p.size * 0.2, 0);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = '#ff6600';
    this.ctx.beginPath();
    this.ctx.arc(-p.size * 0.1, -p.size * 0.15, 1.5, 0, Math.PI * 2);
    this.ctx.arc(p.size * 0.1, -p.size * 0.15, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  private drawSpark(p: Particle): void {
    this.ctx.fillStyle = p.color || '#ff6600';
    this.ctx.shadowColor = '#ff6600';
    this.ctx.shadowBlur = 12;
    
    // Glowing spark
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFog(p: Particle): void {
    const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    gradient.addColorStop(0, `rgba(139, 0, 255, ${p.opacity * 0.3})`);
    gradient.addColorStop(0.5, `rgba(139, 0, 255, ${p.opacity * 0.15})`);
    gradient.addColorStop(1, 'rgba(139, 0, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // 8-BIT DRAW METHODS
  private drawPixelStar(p: Particle): void {
    this.ctx.fillStyle = p.color || '#00ff00';
    this.ctx.shadowColor = p.color || '#00ff00';
    this.ctx.shadowBlur = 4;
    
    // Pixel-perfect star (cross shape)
    const s = Math.floor(p.size / 2) * 2; // Ensure even size
    this.ctx.fillRect(p.x, p.y - s, s, s * 3); // Vertical
    this.ctx.fillRect(p.x - s, p.y, s * 3, s); // Horizontal
  }

  private drawArcadeSpark(p: Particle): void {
    this.ctx.fillStyle = p.color || '#ffff00';
    this.ctx.shadowColor = p.color || '#ffff00';
    this.ctx.shadowBlur = 6;
    
    // Simple pixel square
    const s = Math.floor(p.size);
    this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);
  }

  private drawRetroBlock(p: Particle): void {
    this.ctx.fillStyle = p.color || '#00ff00';
    
    // Tetris-like block with border
    const s = Math.floor(p.size);
    this.ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);
    
    // Inner highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(Math.floor(p.x) + 1, Math.floor(p.y) + 1, s - 2, 2);
    this.ctx.fillRect(Math.floor(p.x) + 1, Math.floor(p.y) + 1, 2, s - 2);
  }

  destroy(): void {
    this.stop();
    this.particles = [];
  }
}
