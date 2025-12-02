/**
 * Debug Script für Strudel Audio Visualizer
 * Kopiere diesen Code in die Browser-Console des Webviews
 * (Rechtsklick auf Strudel Box Panel → Inspect → Console)
 */

console.log('=== STRUDEL AUDIO DEBUG ===');
console.log('');

// 1. Alle window-Eigenschaften die mit Audio zu tun haben
console.log('1. AUDIO-RELATED WINDOW PROPERTIES:');
const audioProps = Object.keys(window).filter(k => 
  k.toLowerCase().includes('audio') || 
  k.toLowerCase().includes('context') ||
  k.toLowerCase().includes('gain') ||
  k.toLowerCase().includes('destination') ||
  k.toLowerCase().includes('strudel') ||
  k.toLowerCase().includes('superdough') ||
  k.toLowerCase().includes('webaudio') ||
  k.toLowerCase().includes('repl')
);
audioProps.forEach(prop => {
  const val = window[prop];
  console.log(`  window.${prop}:`, typeof val, val);
});

console.log('');

// 2. getAudioContext testen
console.log('2. getAudioContext() TEST:');
if (typeof window.getAudioContext === 'function') {
  try {
    const ctx = window.getAudioContext();
    console.log('  AudioContext:', ctx);
    console.log('  State:', ctx?.state);
    console.log('  SampleRate:', ctx?.sampleRate);
    console.log('  Destination:', ctx?.destination);
    console.log('  Destination numberOfInputs:', ctx?.destination?.numberOfInputs);
  } catch (e) {
    console.error('  Error:', e);
  }
} else {
  console.log('  getAudioContext not found');
}

console.log('');

// 3. getDestination testen
console.log('3. getDestination() TEST:');
if (typeof window.getDestination === 'function') {
  try {
    const dest = window.getDestination();
    console.log('  Destination:', dest);
    console.log('  Type:', dest?.constructor?.name);
  } catch (e) {
    console.error('  Error:', e);
  }
} else {
  console.log('  getDestination not found');
}

console.log('');

// 4. gainNode testen
console.log('4. gainNode() TEST:');
if (typeof window.gainNode === 'function') {
  try {
    const gain = window.gainNode();
    console.log('  GainNode:', gain);
    console.log('  Type:', gain?.constructor?.name);
    console.log('  Gain value:', gain?.gain?.value);
  } catch (e) {
    console.error('  Error:', e);
  }
} else {
  console.log('  gainNode not found');
}

console.log('');

// 5. superdough testen
console.log('5. superdough TEST:');
if (window.superdough) {
  console.log('  Type:', typeof window.superdough);
  if (typeof window.superdough === 'function') {
    try {
      const sd = window.superdough();
      console.log('  superdough():', sd);
      if (sd && typeof sd === 'object') {
        console.log('  Keys:', Object.keys(sd));
      }
    } catch (e) {
      console.error('  superdough() Error:', e);
    }
  } else if (typeof window.superdough === 'object') {
    console.log('  Keys:', Object.keys(window.superdough));
  }
} else {
  console.log('  superdough not found');
}

console.log('');

// 6. Alle Funktionen auf window die Audio-Nodes zurückgeben könnten
console.log('6. ALL FUNCTIONS ON WINDOW:');
const funcs = Object.keys(window).filter(k => typeof window[k] === 'function' && !k.startsWith('webkit'));
const relevantFuncs = funcs.filter(f => 
  f.toLowerCase().includes('get') || 
  f.toLowerCase().includes('audio') ||
  f.toLowerCase().includes('node') ||
  f.toLowerCase().includes('gain') ||
  f.toLowerCase().includes('out')
);
console.log('  Relevant functions:', relevantFuncs);

console.log('');

// 7. Versuche einen eigenen Analyser zu erstellen und zu verbinden
console.log('7. MANUAL ANALYSER TEST:');
if (typeof window.getAudioContext === 'function') {
  try {
    const ctx = window.getAudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    
    // Versuche verschiedene Verbindungsmethoden
    console.log('  Created analyser');
    
    // Methode A: Direkt an destination hängen (wird nichts zeigen)
    // analyser.connect(ctx.destination);
    
    // Methode B: getDestination nutzen
    if (typeof window.getDestination === 'function') {
      const dest = window.getDestination();
      if (dest && dest.connect) {
        dest.connect(analyser);
        console.log('  Connected getDestination() to analyser');
      }
    }
    
    // Warte kurz und prüfe Daten
    setTimeout(() => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const max = Math.max(...dataArray);
      console.log('  After 1s - Max frequency value:', max);
      
      // Time domain auch testen
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);
      const timeMax = Math.max(...timeData);
      const timeMin = Math.min(...timeData);
      console.log('  Time domain range:', timeMin, '-', timeMax, '(128 = silence)');
    }, 1000);
    
  } catch (e) {
    console.error('  Error:', e);
  }
}

console.log('');

// 8. Suche nach allen AudioNode Instanzen
console.log('8. SEARCHING FOR AUDIO NODES IN WINDOW:');
Object.keys(window).forEach(key => {
  try {
    const val = window[key];
    if (val && typeof val === 'object' && val.constructor) {
      const name = val.constructor.name;
      if (name.includes('Audio') || name.includes('Gain') || name.includes('Node') || name.includes('Context')) {
        console.log(`  window.${key}: ${name}`);
      }
    }
  } catch (e) {
    // ignore
  }
});

console.log('');
console.log('=== DEBUG COMPLETE ===');
console.log('');
console.log('NEXT STEP: Play a pattern and run this again to see if values change');
