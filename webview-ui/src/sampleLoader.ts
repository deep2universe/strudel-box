/**
 * Strudel Box - Resilient Sample Loader
 * Handles sample loading with retry logic and error recovery
 */

// =============================================================================
// Types
// =============================================================================

export interface SampleLoadResult {
  success: boolean;
  source: string;
  error?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success';
export type LogCallback = (message: string, level: LogLevel) => void;

// =============================================================================
// Configuration
// =============================================================================

// Base URL for dough-samples (official Strudel samples)
const DOUGH_SAMPLES_BASE = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';

// JSON-based sample sources (more reliable, curated)
const JSON_SAMPLE_SOURCES = [
  { json: `${DOUGH_SAMPLES_BASE}/tidal-drum-machines.json`, name: 'Drum Machines' },
  { json: `${DOUGH_SAMPLES_BASE}/piano.json`, name: 'Piano' },
  { json: `${DOUGH_SAMPLES_BASE}/Dirt-Samples.json`, name: 'Dirt Samples' },
  { json: `${DOUGH_SAMPLES_BASE}/EmuSP12.json`, name: 'Emu SP12' },
  { json: `${DOUGH_SAMPLES_BASE}/vcsl.json`, name: 'VCSL' },
];

// GitHub-based sample sources (fallback)
const GITHUB_SAMPLE_SOURCES = [
  'github:tidalcycles/Dirt-Samples/master'
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// =============================================================================
// State
// =============================================================================

let samplesLoaded = false;
let loadingInProgress = false;
let logCallback: LogCallback | null = null;

// =============================================================================
// Logging
// =============================================================================

export function setLogCallback(callback: LogCallback): void {
  logCallback = callback;
}

function log(message: string, level: LogLevel = 'info'): void {
  const prefix = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[level];
  
  console.log(`[SAMPLE-LOADER] ${prefix} ${message}`);
  logCallback?.(message, level);
}

// =============================================================================
// Utility
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// Sample Loading
// =============================================================================

declare global {
  interface Window {
    samples?: (url: string) => Promise<void>;
  }
}

/**
 * Load samples from a JSON source
 */
async function loadFromJsonSource(jsonUrl: string, name: string): Promise<SampleLoadResult> {
  if (!window.samples) {
    return { success: false, source: name, error: 'Strudel samples function not available' };
  }

  try {
    log(`Loading ${name}...`, 'info');
    await window.samples(jsonUrl);
    return { success: true, source: name };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, source: name, error: errorMsg };
  }
}

/**
 * Load samples from a GitHub source with retry logic
 */
async function loadFromGitHubSource(source: string): Promise<SampleLoadResult> {
  if (!window.samples) {
    return { success: false, source, error: 'Strudel samples function not available' };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log(`Loading ${source} (attempt ${attempt}/${MAX_RETRIES})...`, 'info');
      await window.samples(source);
      log(`Loaded ${source}`, 'success');
      return { success: true, source };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * attempt;
        await delay(waitTime);
      } else {
        return { success: false, source, error: errorMsg };
      }
    }
  }

  return { success: false, source, error: `Failed after ${MAX_RETRIES} attempts` };
}

/**
 * Load all default sample sources
 */
export async function loadDefaultSamples(): Promise<boolean> {
  if (samplesLoaded) {
    log('Samples already loaded', 'info');
    return true;
  }

  if (loadingInProgress) {
    log('Sample loading already in progress...', 'info');
    while (loadingInProgress) {
      await delay(100);
    }
    return samplesLoaded;
  }

  loadingInProgress = true;
  log('Loading sample libraries...', 'info');

  let successCount = 0;
  let failCount = 0;

  // Load JSON-based sources first (more reliable)
  for (const { json, name } of JSON_SAMPLE_SOURCES) {
    const result = await loadFromJsonSource(json, name);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
      log(`Could not load ${name}: ${result.error}`, 'warn');
    }
  }

  // Load GitHub sources as additional/fallback
  for (const source of GITHUB_SAMPLE_SOURCES) {
    const result = await loadFromGitHubSource(source);
    if (result.success) {
      successCount++;
    }
    // Don't log GitHub failures if JSON sources worked
  }

  if (successCount > 0) {
    samplesLoaded = true;
    log(`Loaded ${successCount} sample libraries`, 'success');
  } else {
    log('No samples could be loaded. Some sounds may not work.', 'error');
  }

  loadingInProgress = false;
  return samplesLoaded;
}

/**
 * Check if samples are loaded
 */
export function areSamplesLoaded(): boolean {
  return samplesLoaded;
}

/**
 * Detect required sample banks from code
 */
export function detectRequiredBanks(code: string): string[] {
  const banks: string[] = [];
  
  // Detect .bank("BankName") calls
  const bankRegex = /\.bank\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = bankRegex.exec(code)) !== null) {
    banks.push(match[1]);
  }
  
  return [...new Set(banks)];
}

/**
 * Known sample banks that are available in Dirt-Samples
 * See: https://github.com/tidalcycles/Dirt-Samples
 */
const KNOWN_BANKS = new Set([
  // Drums
  'bd', 'sd', 'hh', 'cp', 'cb', 'cr', 'oh', 'lt', 'mt', 'ht',
  'kick', 'snare', 'hat', 'clap', 'tom',
  // Instruments
  'piano', 'casio', 'gtr', 'bass', 'arpy', 'pluck', 'jvbass',
  // Misc/FX
  'misc', 'noise', 'metal', 'industrial', 'peri', 'crow',
  'birds', 'bottle', 'breaks', 'chin', 'circus', 'click',
  // Roland machines
  'RolandTR909', 'RolandTR808', 'RolandTR707',
  // More common ones
  'alphabet', 'amencutup', 'armora', 'arp', 'auto', 'baa',
  'bass0', 'bass1', 'bass2', 'bass3', 'bassdm', 'bassfoo',
  'battles', 'bend', 'bev', 'bin', 'blip', 'blue', 'bottle',
  'breath', 'bubble', 'can', 'casio', 'cc', 'chin', 'chink',
  'circus', 'clak', 'click', 'clubkick', 'co', 'coins',
  'control', 'cosmicg', 'cp', 'cr', 'crow', 'd', 'db',
  'diphone', 'diphone2', 'dist', 'dork2', 'dorkbot', 'dr',
  'dr2', 'dr55', 'dr_few', 'drum', 'drumtraks', 'e', 'east',
  'electro1', 'em2', 'erk', 'f', 'feel', 'feelfx', 'fest',
  'fire', 'flick', 'fm', 'foo', 'future', 'gab', 'gabba',
  'gabbaloud', 'gabbalouder', 'glasstap', 'glitch', 'glitch2',
  'gretsch', 'gtr', 'h', 'hand', 'hardcore', 'hardkick', 'haw',
  'hc', 'hh', 'hh27', 'hit', 'hmm', 'ho', 'hoover', 'house',
  'ht', 'if', 'ifdrums', 'incoming', 'industrial', 'insect',
  'invaders', 'jazz', 'jungbass', 'jungle', 'juno', 'jvbass',
  'kicklinn', 'koy', 'kurt', 'latibro', 'led', 'less', 'lighter',
  'linnhats', 'lt', 'made', 'made2', 'mash', 'mash2', 'metal',
  'miniyeah', 'monsterb', 'moog', 'mouth', 'mp3', 'msg', 'mt',
  'mute', 'newnotes', 'noise', 'noise2', 'notes', 'numbers',
  'oc', 'odx', 'off', 'outdoor', 'pad', 'padlong', 'pebbles',
  'perc', 'peri', 'pluck', 'popkick', 'print', 'proc', 'procshort',
  'psr', 'rave', 'rave2', 'ravemono', 'realclaps', 'reverbkick',
  'rm', 'rs', 'sax', 'sd', 'seawolf', 'sequential', 'sf', 'sheffield',
  'short', 'sid', 'sine', 'sitar', 'sn', 'space', 'speakspell',
  'speech', 'speechless', 'speedupdown', 'stab', 'stomp', 'subroc3d',
  'sugar', 'sundance', 'tabla', 'tabla2', 'tablex', 'tacscan',
  'tech', 'techno', 'tink', 'tok', 'toys', 'trump', 'ul', 'ulgab',
  'uxay', 'v', 'voodoo', 'wind', 'wobble', 'world', 'xmas', 'yeah'
]);

/**
 * Check if a bank is likely available
 */
export function isBankKnown(bankName: string): boolean {
  return KNOWN_BANKS.has(bankName);
}

/**
 * Warn about potentially missing banks before evaluation
 */
export function warnAboutUnknownBanks(code: string): string[] {
  const requiredBanks = detectRequiredBanks(code);
  const unknownBanks = requiredBanks.filter(bank => !isBankKnown(bank));
  
  if (unknownBanks.length > 0) {
    log(`Unknown sample banks: ${unknownBanks.join(', ')}. These may not be available.`, 'warn');
  }
  
  return unknownBanks;
}

/**
 * Reset sample loading state (for testing/debugging)
 */
export function resetSampleState(): void {
  samplesLoaded = false;
  loadingInProgress = false;
}
