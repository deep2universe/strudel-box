/**
 * Strudel Box - Theme-Specific SVG Icons
 * Each theme has its own unique icon set
 */

export type ThemeType = 'default' | 'halloween' | '8bit';

interface IconSet {
  play: string;
  stop: string;
  theme: string;
  logo: string;
}

// CYBERPUNK ICONS - Neon, geometric, futuristic
const cyberpunkIcons: IconSet = {
  play: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#00ffff"/>
        <stop offset="100%" style="stop-color:#ff00ff"/>
      </linearGradient>
      <filter id="neonGlow">
        <feGaussianBlur stdDeviation="1" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <polygon points="6,4 20,12 6,20" fill="url(#neonGrad)" filter="url(#neonGlow)"/>
    <polygon points="6,4 20,12 6,20" fill="none" stroke="#00ffff" stroke-width="1"/>
  </svg>`,
  
  stop: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff00ff"/>
        <stop offset="100%" style="stop-color:#00ffff"/>
      </linearGradient>
      <filter id="stopGlow">
        <feGaussianBlur stdDeviation="1" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect x="5" y="5" width="14" height="14" rx="2" fill="url(#stopGrad)" filter="url(#stopGlow)"/>
    <rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="#ff00ff" stroke-width="1"/>
  </svg>`,
  
  theme: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="none" stroke="url(#neonGrad)" stroke-width="2"/>
    <circle cx="12" cy="12" r="4" fill="#00ffff"/>
    <line x1="12" y1="2" x2="12" y2="6" stroke="#ff00ff" stroke-width="2"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="#ff00ff" stroke-width="2"/>
    <line x1="2" y1="12" x2="6" y2="12" stroke="#00ffff" stroke-width="2"/>
    <line x1="18" y1="12" x2="22" y2="12" stroke="#00ffff" stroke-width="2"/>
  </svg>`,
  
  logo: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#0a0a1a" stroke="url(#neonGrad)" stroke-width="2"/>
    <text x="16" y="22" text-anchor="middle" fill="#00ffff" font-size="16" font-family="monospace">♪</text>
  </svg>`
};


// HALLOWEEN ICONS - Spooky, pumpkins, ghosts
const halloweenIcons: IconSet = {
  play: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="spookyGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Pumpkin Play Button -->
    <ellipse cx="12" cy="13" rx="9" ry="8" fill="#ff6600" filter="url(#spookyGlow)"/>
    <ellipse cx="12" cy="13" rx="9" ry="8" fill="none" stroke="#cc5500" stroke-width="1"/>
    <!-- Pumpkin ridges -->
    <path d="M12 5 Q12 13 12 21" stroke="#cc5500" stroke-width="1" fill="none"/>
    <path d="M6 8 Q12 13 6 18" stroke="#cc5500" stroke-width="0.5" fill="none"/>
    <path d="M18 8 Q12 13 18 18" stroke="#cc5500" stroke-width="0.5" fill="none"/>
    <!-- Stem -->
    <path d="M12 5 Q14 3 12 2" stroke="#228B22" stroke-width="2" fill="none"/>
    <!-- Play triangle face -->
    <polygon points="9,10 9,16 15,13" fill="#1a0a1a"/>
  </svg>`,
  
  stop: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="ghostGlow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Ghost Stop Button -->
    <path d="M12 3 Q6 3 6 10 L6 18 Q7 17 8 18 Q9 19 10 18 Q11 17 12 18 Q13 17 14 18 Q15 19 16 18 Q17 17 18 18 L18 10 Q18 3 12 3 Z" 
          fill="white" filter="url(#ghostGlow)" opacity="0.9"/>
    <!-- Ghost eyes -->
    <ellipse cx="9" cy="10" rx="2" ry="2.5" fill="#1a0a1a"/>
    <ellipse cx="15" cy="10" rx="2" ry="2.5" fill="#1a0a1a"/>
    <!-- Ghost mouth (X for stop) -->
    <line x1="10" y1="14" x2="14" y2="17" stroke="#1a0a1a" stroke-width="1.5"/>
    <line x1="14" y1="14" x2="10" y2="17" stroke="#1a0a1a" stroke-width="1.5"/>
  </svg>`,
  
  theme: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Witch Hat -->
    <path d="M12 2 L6 18 L18 18 Z" fill="#1a0a1a" stroke="#8b00ff" stroke-width="1"/>
    <ellipse cx="12" cy="18" rx="10" ry="3" fill="#1a0a1a" stroke="#8b00ff" stroke-width="1"/>
    <!-- Hat band -->
    <rect x="6" y="15" width="12" height="3" fill="#ff6600"/>
    <!-- Star decoration -->
    <polygon points="12,6 13,9 16,9 14,11 15,14 12,12 9,14 10,11 8,9 11,9" fill="#ffff00"/>
  </svg>`,
  
  logo: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Spooky frame -->
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#1a0a1a" stroke="#8b00ff" stroke-width="2"/>
    <!-- Bat silhouette -->
    <path d="M16 10 Q12 8 8 12 Q10 10 12 12 L12 16 Q14 14 16 16 Q18 14 20 16 L20 12 Q22 10 24 12 Q20 8 16 10 Z" fill="#ff6600"/>
  </svg>`
};


// 8-BIT ICONS - Pixelated, retro gaming style
const eightBitIcons: IconSet = {
  play: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
    <!-- Pixel Play Arrow -->
    <rect x="6" y="4" width="2" height="16" fill="#00ff00"/>
    <rect x="8" y="6" width="2" height="12" fill="#00ff00"/>
    <rect x="10" y="8" width="2" height="8" fill="#00ff00"/>
    <rect x="12" y="10" width="2" height="4" fill="#00ff00"/>
    <!-- Highlight -->
    <rect x="6" y="4" width="2" height="2" fill="#88ff88"/>
    <rect x="8" y="6" width="2" height="2" fill="#88ff88"/>
  </svg>`,
  
  stop: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
    <!-- Pixel Stop Square -->
    <rect x="5" y="5" width="14" height="14" fill="#ff0000"/>
    <!-- Pixel border effect -->
    <rect x="5" y="5" width="14" height="2" fill="#ff6666"/>
    <rect x="5" y="5" width="2" height="14" fill="#ff6666"/>
    <rect x="5" y="17" width="14" height="2" fill="#990000"/>
    <rect x="17" y="5" width="2" height="14" fill="#990000"/>
    <!-- Inner detail -->
    <rect x="7" y="7" width="10" height="10" fill="#cc0000"/>
  </svg>`,
  
  theme: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
    <!-- Pixel Gear/Settings -->
    <rect x="10" y="2" width="4" height="4" fill="#00ff00"/>
    <rect x="10" y="18" width="4" height="4" fill="#00ff00"/>
    <rect x="2" y="10" width="4" height="4" fill="#00ff00"/>
    <rect x="18" y="10" width="4" height="4" fill="#00ff00"/>
    <!-- Center -->
    <rect x="8" y="8" width="8" height="8" fill="#00ff00"/>
    <rect x="10" y="10" width="4" height="4" fill="#003300"/>
    <!-- Diagonal pixels -->
    <rect x="4" y="4" width="4" height="4" fill="#00cc00"/>
    <rect x="16" y="4" width="4" height="4" fill="#00cc00"/>
    <rect x="4" y="16" width="4" height="4" fill="#00cc00"/>
    <rect x="16" y="16" width="4" height="4" fill="#00cc00"/>
  </svg>`,
  
  logo: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
    <!-- Pixel frame -->
    <rect x="2" y="2" width="28" height="28" fill="#000000"/>
    <rect x="4" y="4" width="24" height="24" fill="#001100"/>
    <!-- Pixel music note -->
    <rect x="12" y="8" width="4" height="12" fill="#00ff00"/>
    <rect x="16" y="8" width="4" height="4" fill="#00ff00"/>
    <rect x="8" y="16" width="8" height="4" fill="#00ff00"/>
  </svg>`
};

// Icon registry
const iconSets: Record<ThemeType, IconSet> = {
  default: cyberpunkIcons,
  halloween: halloweenIcons,
  '8bit': eightBitIcons
};

/**
 * Get icon SVG string for current theme
 */
export function getIcon(theme: ThemeType, iconName: keyof IconSet): string {
  return iconSets[theme][iconName];
}

/**
 * Update all icons in the DOM for the given theme
 */
export function updateIcons(theme: ThemeType): void {
  const playBtn = document.getElementById('play');
  const stopBtn = document.getElementById('stop');
  
  if (playBtn) {
    const playIcon = getIcon(theme, 'play');
    const playText = theme === 'halloween' ? '' : theme === '8bit' ? '► PLAY' : '▶ Play';
    playBtn.innerHTML = `<span class="btn-icon">${playIcon}</span><span class="btn-text">${playText}</span>`;
  }
  
  if (stopBtn) {
    const stopIcon = getIcon(theme, 'stop');
    const stopText = theme === 'halloween' ? '' : theme === '8bit' ? '■ STOP' : '⏹ Stop';
    stopBtn.innerHTML = `<span class="btn-icon">${stopIcon}</span><span class="btn-text">${stopText}</span>`;
  }
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(theme: ThemeType): string {
  const names: Record<ThemeType, string> = {
    default: '🌃 Cyberpunk',
    halloween: '🎃 Halloween',
    '8bit': '👾 8-Bit'
  };
  return names[theme];
}
