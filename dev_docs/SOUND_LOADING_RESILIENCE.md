# Sound Loading Resilience & Custom Samples

## Date: December 1, 2025

---

## 1. Problem Analysis

### 1.1 The Error

```
[getTrigger] error: sound RolandTR808_sd not found! Is it loaded?
[getTrigger] error: sound RolandTR808_hh not found! Is it loaded?
[cyclist] stop
```

### 1.2 Root Cause

The error occurs when:
1. A pattern references a sound bank (e.g., `RolandTR808`) that hasn't been loaded
2. The `samples()` function either:
   - Hasn't completed loading before pattern evaluation
   - Failed silently during loading
   - Loaded a different sample set than expected

### 1.3 Current Sample Loading Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. init() called                                           │
│       ↓                                                     │
│  2. initStrudel() called                                    │
│       ↓                                                     │
│  3. loadSamples() called                                    │
│       ↓                                                     │
│  4. window.samples('github:tidalcycles/Dirt-Samples/master')│
│       ↓                                                     │
│  5. samplesLoaded = true (assumes success)                  │
│       ↓                                                     │
│  6. User plays pattern                                      │
│       ↓                                                     │
│  7. ERROR: Sound not found!                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Problems with current approach:**
- No verification that samples actually loaded
- No retry mechanism on failure
- No feedback to user about loading status
- No way to load additional sample banks on demand
- Race condition: pattern may evaluate before samples finish loading

---

## 2. Strudel Sample Loading Internals

### 2.1 How `samples()` Works

The `samples()` function from `@strudel/web`:
1. Fetches a `strudel.json` manifest from the specified URL
2. Parses the manifest to get sample file paths
3. Registers sample names in an internal registry
4. Samples are lazy-loaded (fetched on first use)

### 2.2 Sample Bank Structure

```
github:tidalcycles/Dirt-Samples/master
    └── strudel.json (manifest)
        ├── bd/  (bass drum samples)
        │   ├── bd_0.wav
        │   ├── bd_1.wav
        │   └── ...
        ├── sd/  (snare drum samples)
        ├── hh/  (hi-hat samples)
        └── ...
```

### 2.3 Why RolandTR808 Fails

The `RolandTR808` bank is NOT in the default `Dirt-Samples` repository. It's in a separate location:
- `github:tidalcycles/Dirt-Samples` → Contains generic samples (bd, sd, hh, etc.)
- `RolandTR808` → Requires loading from a different source or using `.bank("RolandTR808")` which expects pre-registered samples

**The default code in StrudelBoxPanel.ts uses:**
```javascript
s("bd sd:1 [~ bd] sd:2")
  .bank("RolandTR909")  // ← This bank may not be loaded!
```

---

## 3. Proposed Solution: Resilient Sample Loading

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Resilient Sample Loading                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Sample Registry                         │   │
│  │  • Track loaded sample banks                         │   │
│  │  • Detect missing samples before playback            │   │
│  │  • Auto-load missing banks on demand                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Sample Loader                           │   │
│  │  • Multiple sample sources (CDN, local, custom)      │   │
│  │  • Retry logic with exponential backoff              │   │
│  │  • Progress feedback to UI                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Error Recovery                          │   │
│  │  • Graceful fallback to default sounds               │   │
│  │  • User notification with actionable message         │   │
│  │  • Option to retry or use alternative                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Implementation Strategy

#### Phase 1: Robust Default Loading

```typescript
// webview-ui/src/sampleLoader.ts

interface SampleLoadResult {
  success: boolean;
  loadedBanks: string[];
  failedBanks: string[];
  errors: string[];
}

const SAMPLE_SOURCES = [
  {
    name: 'Dirt-Samples',
    url: 'github:tidalcycles/Dirt-Samples/master',
    banks: ['bd', 'sd', 'hh', 'cp', 'piano', 'casio', /* ... */]
  },
  {
    name: 'Strudel-Samples', 
    url: 'https://strudel.cc/samples/',
    banks: ['RolandTR808', 'RolandTR909', /* ... */]
  }
];

async function loadSamplesWithRetry(
  source: string, 
  maxRetries = 3
): Promise<SampleLoadResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      updateStatus(`Loading samples (attempt ${attempt}/${maxRetries})...`);
      await window.samples?.(source);
      return { success: true, loadedBanks: [], failedBanks: [], errors: [] };
    } catch (err) {
      lastError = err as Error;
      // Exponential backoff: 1s, 2s, 4s
      await delay(1000 * Math.pow(2, attempt - 1));
    }
  }
  
  return { 
    success: false, 
    loadedBanks: [], 
    failedBanks: [source],
    errors: [lastError?.message || 'Unknown error']
  };
}
```

#### Phase 2: On-Demand Bank Loading

```typescript
// Detect missing samples before evaluation
async function ensureSamplesLoaded(code: string): Promise<void> {
  const requiredBanks = detectRequiredBanks(code);
  const missingBanks = requiredBanks.filter(bank => !isLoaded(bank));
  
  if (missingBanks.length > 0) {
    updateStatus(`Loading ${missingBanks.join(', ')}...`);
    await loadBanks(missingBanks);
  }
}

function detectRequiredBanks(code: string): string[] {
  const banks: string[] = [];
  
  // Detect .bank("BankName") calls
  const bankRegex = /\.bank\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = bankRegex.exec(code)) !== null) {
    banks.push(match[1]);
  }
  
  // Detect samples("source") calls
  const samplesRegex = /samples\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = samplesRegex.exec(code)) !== null) {
    banks.push(match[1]);
  }
  
  return [...new Set(banks)];
}
```

#### Phase 3: Graceful Fallback

```typescript
async function playPatternSafe(code: string): Promise<void> {
  try {
    await ensureSamplesLoaded(code);
    await repl.evaluate(code);
  } catch (err) {
    const errorMsg = (err as Error).message;
    
    if (errorMsg.includes('not found')) {
      // Offer fallback
      const fallbackCode = replaceMissingSounds(code);
      const useFallback = await confirmFallback(errorMsg);
      
      if (useFallback) {
        await repl.evaluate(fallbackCode);
      }
    } else {
      throw err;
    }
  }
}

function replaceMissingSounds(code: string): string {
  // Replace unknown banks with default synthesizers
  return code
    .replace(/\.bank\s*\(\s*["'][^"']+["']\s*\)/g, '')
    .replace(/RolandTR808/g, 'bd sd hh')
    .replace(/RolandTR909/g, 'bd sd hh');
}
```

---

## 4. Custom Local Samples

### 4.1 VS Code Extension File Access Capabilities

VS Code extensions CAN read files from the workspace:

```typescript
// Extension Host (src/extension.ts or src/StrudelBoxPanel.ts)
import * as vscode from 'vscode';

// Read file from workspace
const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
if (workspaceFolder) {
  const samplesDir = vscode.Uri.joinPath(workspaceFolder.uri, 'samples');
  const files = await vscode.workspace.fs.readDirectory(samplesDir);
  
  for (const [name, type] of files) {
    if (type === vscode.FileType.File && name.endsWith('.wav')) {
      const fileUri = vscode.Uri.joinPath(samplesDir, name);
      const content = await vscode.workspace.fs.readFile(fileUri);
      // Convert to base64 or blob URL for webview
    }
  }
}
```

### 4.2 Webview Limitations

The webview CANNOT directly access the file system. All file access must go through the extension host via message passing:

```
┌─────────────────────────────────────────────────────────────┐
│                 Local Sample Loading Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Webview                          Extension Host            │
│     │                                   │                   │
│     │  ──── requestLocalSamples ────>   │                   │
│     │                                   │                   │
│     │                          Read samples/ directory      │
│     │                          Convert files to base64      │
│     │                                   │                   │
│     │  <──── localSamplesData ──────   │                   │
│     │                                   │                   │
│     │  Register samples with Strudel    │                   │
│     │                                   │                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Proposed Local Samples Implementation

#### Extension Host Side

```typescript
// src/StrudelBoxPanel.ts

private async _handleMessage(message: { command: string; payload?: unknown }): Promise<void> {
  switch (message.command) {
    // ... existing cases ...
    
    case 'requestLocalSamples':
      await this._loadLocalSamples();
      break;
      
    case 'requestSampleFile':
      await this._loadSampleFile(message.payload as string);
      break;
  }
}

private async _loadLocalSamples(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    this.sendMessage('localSamplesError', 'No workspace folder open');
    return;
  }
  
  const samplesDir = vscode.Uri.joinPath(workspaceFolder.uri, 'samples');
  
  try {
    const entries = await vscode.workspace.fs.readDirectory(samplesDir);
    const sampleManifest: Record<string, string[]> = {};
    
    for (const [name, type] of entries) {
      if (type === vscode.FileType.Directory) {
        // Each subdirectory is a sample bank
        const bankDir = vscode.Uri.joinPath(samplesDir, name);
        const bankFiles = await vscode.workspace.fs.readDirectory(bankDir);
        
        sampleManifest[name] = bankFiles
          .filter(([f, t]) => t === vscode.FileType.File && this._isAudioFile(f))
          .map(([f]) => f);
      }
    }
    
    this.sendMessage('localSamplesManifest', sampleManifest);
  } catch (err) {
    // samples/ directory doesn't exist - that's OK
    this.sendMessage('localSamplesManifest', {});
  }
}

private async _loadSampleFile(relativePath: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;
  
  const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, 'samples', relativePath);
  
  try {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const base64 = Buffer.from(content).toString('base64');
    const mimeType = this._getMimeType(relativePath);
    
    this.sendMessage('sampleFileData', {
      path: relativePath,
      dataUrl: `data:${mimeType};base64,${base64}`
    });
  } catch (err) {
    this.sendMessage('sampleFileError', { path: relativePath, error: String(err) });
  }
}

private _isAudioFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ['wav', 'mp3', 'ogg', 'flac', 'aiff', 'aif'].includes(ext || '');
}

private _getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aiff': 'audio/aiff',
    'aif': 'audio/aiff'
  };
  return mimeTypes[ext || ''] || 'audio/wav';
}
```

#### Webview Side

```typescript
// webview-ui/src/localSamples.ts

interface LocalSampleManifest {
  [bankName: string]: string[];
}

let localManifest: LocalSampleManifest = {};
const loadedSamples: Map<string, AudioBuffer> = new Map();

export function requestLocalSamples(): void {
  postMessage('requestLocalSamples');
}

export function handleLocalSamplesManifest(manifest: LocalSampleManifest): void {
  localManifest = manifest;
  console.log('[STRUDEL-BOX] Local samples available:', Object.keys(manifest));
  
  // Register local sample banks with Strudel
  registerLocalBanks(manifest);
}

async function registerLocalBanks(manifest: LocalSampleManifest): Promise<void> {
  // Create a virtual sample registry for Strudel
  // This requires hooking into Strudel's sample resolution
  
  for (const [bankName, files] of Object.entries(manifest)) {
    // Register each bank as available
    // When Strudel requests a sample, we intercept and load from extension
  }
}

export async function loadLocalSample(bankName: string, index: number): Promise<AudioBuffer> {
  const key = `${bankName}/${index}`;
  
  if (loadedSamples.has(key)) {
    return loadedSamples.get(key)!;
  }
  
  const files = localManifest[bankName];
  if (!files || index >= files.length) {
    throw new Error(`Sample ${key} not found`);
  }
  
  const filename = files[index];
  
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'sampleFileData' && msg.payload.path === `${bankName}/${filename}`) {
        window.removeEventListener('message', handler);
        
        // Decode audio data
        decodeAudioData(msg.payload.dataUrl)
          .then(buffer => {
            loadedSamples.set(key, buffer);
            resolve(buffer);
          })
          .catch(reject);
      }
    };
    
    window.addEventListener('message', handler);
    postMessage('requestSampleFile', `${bankName}/${filename}`);
  });
}

async function decodeAudioData(dataUrl: string): Promise<AudioBuffer> {
  const response = await fetch(dataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new AudioContext();
  return audioContext.decodeAudioData(arrayBuffer);
}
```

### 4.4 User-Facing Directory Structure

```
my-strudel-project/
├── patterns/
│   ├── beat1.strudel
│   └── melody.strudel
└── samples/                    ← User's custom samples
    ├── kicks/                  ← Bank name: "kicks"
    │   ├── kick_01.wav
    │   ├── kick_02.wav
    │   └── kick_03.wav
    ├── snares/                 ← Bank name: "snares"
    │   ├── snare_01.wav
    │   └── snare_02.wav
    └── my_synth/               ← Bank name: "my_synth"
        └── pad.wav
```

**Usage in patterns:**
```javascript
// Use local samples by bank name
s("kicks snares kicks snares")

// Or with index
s("kicks:0 kicks:1 kicks:2")

// Mix with built-in samples
s("kicks bd snares hh*4")
```

---

## 5. Implementation Roadmap

### Phase 1: Fix Immediate Issue (Quick Win)
- [ ] Add proper error handling in `loadSamples()`
- [ ] Show loading status in UI
- [ ] Add retry logic with user feedback
- [ ] Change default pattern to use guaranteed-available sounds

### Phase 2: Resilient Loading
- [ ] Implement `SampleLoader` class with retry logic
- [ ] Add sample bank detection from code
- [ ] Pre-load required banks before evaluation
- [ ] Add graceful fallback for missing sounds

### Phase 3: Local Samples Support
- [ ] Add message handlers in extension host
- [ ] Implement file reading from workspace
- [ ] Create webview sample registry
- [ ] Hook into Strudel's sample resolution
- [ ] Add UI for browsing local samples

### Phase 4: Enhanced UX
- [ ] Sample browser panel
- [ ] Drag-and-drop sample import
- [ ] Sample preview on hover
- [ ] Auto-complete for sample names

---

## 6. Alternative Approaches Considered

### 6.1 Bundling Samples with Extension

**Pros:**
- Always available, no network dependency
- Fast loading

**Cons:**
- Massive extension size (Dirt-Samples is ~500MB)
- Update complexity
- License concerns

**Verdict:** Not recommended

### 6.2 Using Strudel's Built-in Sample Server

**Pros:**
- Official support
- Always up-to-date

**Cons:**
- Requires network
- May have CORS issues in webview

**Verdict:** Use as primary source, with fallback

### 6.3 WebView File System Access API

**Pros:**
- Direct file access from webview

**Cons:**
- Not supported in VS Code webviews
- Security restrictions

**Verdict:** Not possible

---

## 7. Conclusion

The "sound not found" error is caused by a race condition and missing sample banks. The solution involves:

1. **Immediate fix:** Better error handling and using guaranteed-available sounds in defaults
2. **Robust loading:** Retry logic, progress feedback, and pre-loading required banks
3. **Local samples:** Extension host reads files, passes to webview via messages

The VS Code extension architecture fully supports reading local files from the workspace, making custom user samples feasible through the message-passing pattern between extension host and webview.

---

## 8. References

- [Strudel Samples Documentation](https://strudel.cc/learn/samples)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code FileSystem API](https://code.visualstudio.com/api/references/vscode-api#FileSystem)
- [Web Audio API - decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
