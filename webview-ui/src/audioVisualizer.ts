/**
 * Audio Visualizer Panel - Oscilloscope & Spectrum Display
 * Uses destination interception to capture all audio
 */

// Debug flag for this file
const DEBUG = false;

type VisualizerMode = 'both' | 'oscilloscope' | 'spectrum';

interface VisualizerState {
  collapsed: boolean;
  mode: VisualizerMode;
}

// Global analyser that intercepts all audio
let globalAnalyser: AnalyserNode | null = null;
let isIntercepted = false;

// Store the ORIGINAL connect function before any patching
let originalConnectFn: ((
  destinationNode: AudioNode | AudioParam,
  output?: number,
  input?: number
) => AudioNode | void) | null = null;

// Set of analysers we created (to avoid intercepting their connections)
const ourAnalysers = new WeakSet<AnalyserNode>();

// Map to store analyser per AudioContext
const contextAnalysers = new Map<AudioContext, AnalyserNode>();

/**
 * Get or create an analyser for a specific AudioContext
 * Uses the ORIGINAL connect to avoid recursion
 */
function getOrCreateAnalyser(ctx: AudioContext): AnalyserNode {
  let analyser = contextAnalysers.get(ctx);
  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    
    // Mark this as our analyser
    ourAnalysers.add(analyser);
    
    // Use ORIGINAL connect to avoid recursion!
    if (originalConnectFn) {
      originalConnectFn.call(analyser, ctx.destination);
    } else {
      analyser.connect(ctx.destination);
    }
    
    contextAnalysers.set(ctx, analyser);
    globalAnalyser = analyser;
    if (DEBUG) console.log('[AUDIO-VISUALIZER] Created analyser for AudioContext');
  }
  return analyser;
}

/**
 * Intercept AudioContext.destination BEFORE Strudel initializes
 * This must be called as early as possible
 */
export function interceptAudioDestination(): void {
  if (isIntercepted) return;
  
  if (DEBUG) console.log('[AUDIO-VISUALIZER] Setting up destination intercept...');

  // Store the original connect function ONCE
  originalConnectFn = AudioNode.prototype.connect as typeof originalConnectFn;
  
  // Override connect method
  (AudioNode.prototype as { connect: unknown }).connect = function(
    this: AudioNode,
    destination: AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): AudioNode | void {
    // If this is one of our analysers, use original connect directly
    if (this instanceof AnalyserNode && ourAnalysers.has(this)) {
      return originalConnectFn!.call(this, destination, outputIndex, inputIndex);
    }
    
    // Check if connecting to the final destination
    if (destination instanceof AudioDestinationNode) {
      const ctx = destination.context as AudioContext;
      const analyser = getOrCreateAnalyser(ctx);
      
      // Route through our analyser instead of destination
      if (DEBUG) console.log('[AUDIO-VISUALIZER] Intercepted connection to destination');
      return originalConnectFn!.call(this, analyser, outputIndex, inputIndex);
    }
    
    // Normal connection - use original
    return originalConnectFn!.call(this, destination, outputIndex, inputIndex);
  };
  
  isIntercepted = true;
  if (DEBUG) console.log('[AUDIO-VISUALIZER] Destination intercept installed');
}

/**
 * Get the current global analyser (for external use)
 */
export function getGlobalAnalyser(): AnalyserNode | null {
  return globalAnalyser;
}

export class AudioVisualizerPanel {
  private container: HTMLElement;
  private oscilloscopeCanvas: HTMLCanvasElement;
  private spectrumCanvas: HTMLCanvasElement;
  private oscilloscopeCtx: CanvasRenderingContext2D;
  private spectrumCtx: CanvasRenderingContext2D;
  
  private analyser: AnalyserNode | null = null;
  private timeDataArray: Uint8Array<ArrayBuffer> | null = null;
  private freqDataArray: Uint8Array<ArrayBuffer> | null = null;
  private animationId: number = 0;
  
  private collapsed: boolean = false;
  private isFullscreen: boolean = false;
  private mode: VisualizerMode = 'both';
  private isPlaying: boolean = false;
  
  private onStateChange?: (state: VisualizerState) => void;

  constructor(parentElement: HTMLElement, onStateChange?: (state: VisualizerState) => void) {
    this.onStateChange = onStateChange;
    this.container = this.createDOM(parentElement);
    
    this.oscilloscopeCanvas = this.container.querySelector('#oscilloscope-canvas')!;
    this.spectrumCanvas = this.container.querySelector('#spectrum-canvas')!;
    this.oscilloscopeCtx = this.oscilloscopeCanvas.getContext('2d')!;
    this.spectrumCtx = this.spectrumCanvas.getContext('2d')!;
    
    this.setupEventListeners();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private createDOM(parent: HTMLElement): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'audio-visualizer-panel';
    panel.className = 'visualizer-panel expanded';
    panel.innerHTML = `
      <div class="visualizer-header">
        <span class="visualizer-title">🎛️ Audio Visualizer</span>
        <div class="visualizer-controls">
          <button class="viz-btn viz-mode-btn" data-mode="both" title="Both">⚡</button>
          <button class="viz-btn viz-mode-btn" data-mode="oscilloscope" title="Oscilloscope">∿</button>
          <button class="viz-btn viz-mode-btn" data-mode="spectrum" title="Spectrum">▁▃▅▇</button>
          <button class="viz-btn viz-fullscreen-btn" title="Fullscreen">⛶</button>
          <button class="viz-btn viz-toggle-btn" title="Collapse">▼</button>
        </div>
      </div>
      <div class="visualizer-content">
        <div class="visualizer-row oscilloscope-row">
          <canvas id="oscilloscope-canvas"></canvas>
          <span class="viz-label">Oscilloscope</span>
        </div>
        <div class="visualizer-row spectrum-row">
          <canvas id="spectrum-canvas"></canvas>
          <span class="viz-label">Spectrum</span>
        </div>
      </div>
    `;
    parent.appendChild(panel);
    return panel;
  }

  private setupEventListeners(): void {
    const toggleBtn = this.container.querySelector('.viz-toggle-btn');
    toggleBtn?.addEventListener('click', () => this.toggle());
    
    const fullscreenBtn = this.container.querySelector('.viz-fullscreen-btn');
    fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
    
    this.container.querySelectorAll('.viz-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as VisualizerMode;
        this.setMode(mode);
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.toggleFullscreen();
      }
    });
    
    this.updateModeButtons();
  }

  private updateModeButtons(): void {
    this.container.querySelectorAll('.viz-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === this.mode);
    });
  }

  setMode(mode: VisualizerMode): void {
    this.mode = mode;
    this.updateModeButtons();
    
    const oscilloscopeRow = this.container.querySelector('.oscilloscope-row') as HTMLElement;
    const spectrumRow = this.container.querySelector('.spectrum-row') as HTMLElement;
    
    oscilloscopeRow.style.display = (mode === 'both' || mode === 'oscilloscope') ? 'block' : 'none';
    spectrumRow.style.display = (mode === 'both' || mode === 'spectrum') ? 'block' : 'none';
    
    this.resize();
    this.notifyStateChange();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    this.container.classList.toggle('collapsed', this.collapsed);
    this.container.classList.toggle('expanded', !this.collapsed);
    
    const toggleBtn = this.container.querySelector('.viz-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = this.collapsed ? '▲' : '▼';
      toggleBtn.setAttribute('title', this.collapsed ? 'Expand' : 'Collapse');
    }
    
    if (this.collapsed) {
      this.stopAnimation();
    } else if (this.isPlaying) {
      this.startAnimation();
    }
    
    this.notifyStateChange();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.container.classList.toggle('fullscreen', this.isFullscreen);
    
    const fullscreenBtn = this.container.querySelector('.viz-fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = this.isFullscreen ? '✕' : '⛶';
      fullscreenBtn.setAttribute('title', this.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen');
    }
    
    setTimeout(() => this.resize(), 50);
  }

  /**
   * Initialize the analyser with the AudioContext
   * Call this when Strudel is ready
   */
  connect(audioContext: AudioContext): void {
    if (DEBUG) console.log('[AUDIO-VISUALIZER] Connecting to AudioContext...');
    
    // Use the global analyser created by the intercept, or create one
    if (globalAnalyser && globalAnalyser.context === audioContext) {
      this.analyser = globalAnalyser;
      if (DEBUG) console.log('[AUDIO-VISUALIZER] Using existing intercepted analyser');
    } else {
      // Create analyser for this context
      this.analyser = getOrCreateAnalyser(audioContext);
      if (DEBUG) console.log('[AUDIO-VISUALIZER] Created new analyser for context');
    }
    
    this.timeDataArray = new Uint8Array(this.analyser.fftSize);
    this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    if (DEBUG) console.log('[AUDIO-VISUALIZER] Analyser ready, fftSize:', this.analyser.fftSize);
  }

  /**
   * Alternative: Try to use Strudel's internal scope data
   */
  connectToStrudelScope(): void {
    const win = window as unknown as { strudel?: { analysers?: Record<string, AnalyserNode> } };
    
    if (win.strudel?.analysers) {
      // Try to find an active analyser
      const analyserKeys = Object.keys(win.strudel.analysers);
      if (DEBUG) console.log('[AUDIO-VISUALIZER] Found Strudel analysers:', analyserKeys);
      
      // Use 'main' or first available
      const key = analyserKeys.includes('main') ? 'main' : analyserKeys[0];
      if (key) {
        this.analyser = win.strudel.analysers[key];
        this.timeDataArray = new Uint8Array(this.analyser.fftSize);
        this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        if (DEBUG) console.log('[AUDIO-VISUALIZER] Using Strudel analyser:', key);
      }
    }
  }

  start(): void {
    if (DEBUG) console.log('[AUDIO-VISUALIZER] start() called');
    this.isPlaying = true;
    
    if (!this.collapsed) {
      this.startAnimation();
    }
  }

  stop(): void {
    if (DEBUG) console.log('[AUDIO-VISUALIZER] stop() called');
    this.isPlaying = false;
    this.stopAnimation();
  }

  private startAnimation(): void {
    if (this.animationId) return;
    if (DEBUG) console.log('[AUDIO-VISUALIZER] Starting animation loop');
    this.draw();
  }

  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private draw = (): void => {
    this.animationId = requestAnimationFrame(this.draw);
    
    if (this.collapsed) {
      this.stopAnimation();
      return;
    }
    
    this.drawOscilloscope();
    this.drawSpectrum();
  };

  private drawOscilloscope(): void {
    if (this.mode !== 'both' && this.mode !== 'oscilloscope') return;
    
    const canvas = this.oscilloscopeCanvas;
    const ctx = this.oscilloscopeCtx;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    if (width <= 0 || height <= 0) return;
    
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--visualizer-bg').trim() || 'rgba(0,0,0,0.3)';
    const waveColor = styles.getPropertyValue('--accent-primary').trim() || '#00ffff';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    if (!this.analyser || !this.timeDataArray) {
      this.drawPlaceholder(ctx, width, height, '▶ Press Play to visualize');
      return;
    }
    
    this.analyser.getByteTimeDomainData(this.timeDataArray);
    
    // Check for signal
    let hasSignal = false;
    for (let i = 0; i < this.timeDataArray.length; i++) {
      if (Math.abs(this.timeDataArray[i] - 128) > 2) {
        hasSignal = true;
        break;
      }
    }
    
    if (!hasSignal && !this.isPlaying) {
      this.drawPlaceholder(ctx, width, height, '▶ Press Play to visualize');
      return;
    }
    
    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = waveColor;
    ctx.shadowColor = waveColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    
    const sliceWidth = width / this.timeDataArray.length;
    let x = 0;
    
    for (let i = 0; i < this.timeDataArray.length; i++) {
      const v = this.timeDataArray[i] / 128.0;
      const y = (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawSpectrum(): void {
    if (this.mode !== 'both' && this.mode !== 'spectrum') return;
    
    const canvas = this.spectrumCanvas;
    const ctx = this.spectrumCtx;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    if (width <= 0 || height <= 0) return;
    
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--visualizer-bg').trim() || 'rgba(0,0,0,0.3)';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    if (!this.analyser || !this.freqDataArray) {
      this.drawPlaceholder(ctx, width, height, '▶ Press Play to visualize');
      return;
    }
    
    this.analyser.getByteFrequencyData(this.freqDataArray);
    
    // Check for signal
    let maxVal = 0;
    for (let i = 0; i < this.freqDataArray.length; i++) {
      if (this.freqDataArray[i] > maxVal) maxVal = this.freqDataArray[i];
    }
    
    if (maxVal < 5 && !this.isPlaying) {
      this.drawPlaceholder(ctx, width, height, '▶ Press Play to visualize');
      return;
    }
    
    // Draw spectrum bars
    const barCount = 64;
    const barWidth = width / barCount;
    const step = Math.floor(this.freqDataArray.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const value = this.freqDataArray[i * step];
      const barHeight = (value / 255) * height;
      const hue = (i / barCount) * 180 + 180;
      
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 4;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
    ctx.shadowBlur = 0;
  }

  private drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number, text: string): void {
    const styles = getComputedStyle(document.documentElement);
    const mutedColor = styles.getPropertyValue('--text-muted').trim() || '#666';
    
    ctx.fillStyle = mutedColor;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    
    [this.oscilloscopeCanvas, this.spectrumCanvas].forEach(canvas => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(dpr, dpr);
      }
    });
  }

  setState(state: Partial<VisualizerState>): void {
    if (state.collapsed !== undefined && state.collapsed !== this.collapsed) {
      this.toggle();
    }
    if (state.mode !== undefined) {
      this.setMode(state.mode);
    }
  }

  getState(): VisualizerState {
    return {
      collapsed: this.collapsed,
      mode: this.mode
    };
  }

  private notifyStateChange(): void {
    this.onStateChange?.(this.getState());
  }
  
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}
