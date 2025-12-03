/**
 * Audio Visualizer using Web Audio AnalyserNode
 */

// Debug flag for this file
const DEBUG = false;

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private animationId: number = 0;
  private dataArray: Uint8Array | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  connect(audioContext: AudioContext): void {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    try {
      const destination = audioContext.destination;
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(destination);
      gainNode.connect(this.analyser);
    } catch (err) {
      if (DEBUG) console.warn('[VISUALIZER] Could not connect analyser:', err);
    }
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }
  
  start(): void {
    this.draw();
  }
  
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }
  
  private draw = (): void => {
    this.animationId = requestAnimationFrame(this.draw);
    
    const { width, height } = this.canvas;
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--visualizer-bg').trim() || 'transparent';
    
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);
    
    if (!this.analyser || !this.dataArray) {
      this.drawPlaceholder(width, height);
      return;
    }
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * height;
      const hue = (i / bufferLength) * 180 + 180;
      this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };
  
  private drawPlaceholder(width: number, height: number): void {
    const styles = getComputedStyle(document.documentElement);
    const mutedColor = styles.getPropertyValue('--text-muted').trim() || '#666';
    
    this.ctx.fillStyle = mutedColor;
    this.ctx.font = '14px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('▶ Play to see visualizer', width / 2, height / 2);
  }
  
  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }
}
