/**
 * Strudel Box - Sample Pack Registry
 * Complete list of available Strudel sample packs
 */

// =============================================================================
// Types
// =============================================================================

export type SampleCategory = 'builtin' | 'github' | 'external' | 'community';

export interface SamplePack {
  id: string;
  name: string;
  url: string;
  category: SampleCategory;
  sampleCount?: number;
  description?: string;
  author?: string;
}

export interface CategoryInfo {
  id: SampleCategory;
  name: string;
  icon: string;
  expanded: boolean;
}

// =============================================================================
// Categories
// =============================================================================

export const CATEGORIES: CategoryInfo[] = [
  { id: 'builtin', name: 'Built-in Samples', icon: '📦', expanded: true },
  { id: 'github', name: 'GitHub Collections', icon: '🐙', expanded: false },
  { id: 'external', name: 'External URLs', icon: '🌐', expanded: false },
  { id: 'community', name: 'Community Packs', icon: '👥', expanded: false },
];

// =============================================================================
// Sample Packs
// =============================================================================

export const SAMPLE_PACKS: SamplePack[] = [
  // ─── BUILT-IN (Strudel.cc) ─────────────────────────────────────────────────
  { id: 'tidal-drum-machines', name: 'Tidal Drum Machines', url: 'tidal-drum-machines', category: 'builtin', sampleCount: 683 },
  { id: 'vcsl', name: 'VCSL', url: 'vcsl', category: 'builtin', sampleCount: 128 },
  { id: 'uzu-drumkit', name: 'Uzu Drumkit', url: 'uzu-drumkit', category: 'builtin', sampleCount: 16 },
  { id: 'mridangam', name: 'Mridangam', url: 'mridangam', category: 'builtin', sampleCount: 13 },
  { id: 'piano', name: 'Piano', url: 'piano', category: 'builtin', sampleCount: 1 },

  // ─── EXTERNAL URLS ─────────────────────────────────────────────────────────
  { id: 'grbt-samples', name: 'GRBT Samples', url: 'https://samples.grbt.com.au', category: 'external', sampleCount: 629 },
  { id: 'mellotron', name: 'Mellotron', url: 'https://sound.intercrap.com/strudel/mellotron', category: 'external', sampleCount: 24 },

  // ─── GITHUB: Blu-Mar-Ten Collection ────────────────────────────────────────
  { id: 'blu-mar-ten-breaks', name: 'Blu-Mar-Ten Breaks', url: 'github:sonidosingapura/blu-mar-ten/Breaks', category: 'github', sampleCount: 448, author: 'sonidosingapura' },
  { id: 'blu-mar-ten-riffs', name: 'Blu-Mar-Ten Riffs/Arps/Hits', url: 'github:sonidosingapura/blu-mar-ten/Riffs_Arps_Hits', category: 'github', sampleCount: 260, author: 'sonidosingapura' },
  { id: 'blu-mar-ten-fx', name: 'Blu-Mar-Ten FX', url: 'github:sonidosingapura/blu-mar-ten/FX', category: 'github', sampleCount: 240, author: 'sonidosingapura' },
  { id: 'blu-mar-ten-pads', name: 'Blu-Mar-Ten Pads', url: 'github:sonidosingapura/blu-mar-ten/Pads', category: 'github', sampleCount: 152, author: 'sonidosingapura' },
  { id: 'blu-mar-ten-vocals', name: 'Blu-Mar-Ten Vocals', url: 'github:sonidosingapura/blu-mar-ten/Vocals', category: 'github', sampleCount: 136, author: 'sonidosingapura' },
  { id: 'blu-mar-ten-bass', name: 'Blu-Mar-Ten Bass', url: 'github:sonidosingapura/blu-mar-ten/Bass', category: 'github', sampleCount: 114, author: 'sonidosingapura' },
  { id: 'rochormatic', name: 'Rochormatic', url: 'github:sonidosingapura/rochormatic', category: 'github', sampleCount: 18, author: 'sonidosingapura' },

  // ─── GITHUB: TidalCycles / Classic ─────────────────────────────────────────
  { id: 'dirt-samples', name: 'Dirt Samples', url: 'github:tidalcycles/Dirt-Samples', category: 'github', sampleCount: 218, author: 'tidalcycles' },
  { id: 'tidal-uzu-drumkit', name: 'Uzu Drumkit (GitHub)', url: 'github:tidalcycles/uzu-drumkit', category: 'github', sampleCount: 16, author: 'tidalcycles' },

  // ─── GITHUB: Bubobubobubobubo / Dough Series ───────────────────────────────
  { id: 'dough-amiga', name: 'Dough Amiga', url: 'github:Bubobubobubobubo/Dough-Amiga', category: 'github', sampleCount: 116, author: 'Bubobubobubobubo' },
  { id: 'dough-waveforms', name: 'Dough Waveforms', url: 'github:Bubobubobubobubo/Dough-Waveforms', category: 'github', sampleCount: 65, author: 'Bubobubobubobubo' },
  { id: 'dough-fox', name: 'Dough Fox', url: 'github:Bubobubobubobubo/Dough-Fox', category: 'github', sampleCount: 63, author: 'Bubobubobubobubo' },
  { id: 'dough-bourges', name: 'Dough Bourges', url: 'github:Bubobubobubobubo/Dough-Bourges', category: 'github', sampleCount: 45, author: 'Bubobubobubobubo' },
  { id: 'dough-samples', name: 'Dough Samples', url: 'github:Bubobubobubobubo/Dough-Samples', category: 'github', sampleCount: 27, author: 'Bubobubobubobubo' },
  { id: 'dough-amen', name: 'Dough Amen', url: 'github:Bubobubobubobubo/Dough-Amen', category: 'github', sampleCount: 3, author: 'Bubobubobubobubo' },

  // ─── GITHUB: Yaxu ──────────────────────────────────────────────────────────
  { id: 'spicule', name: 'Spicule', url: 'github:yaxu/spicule', category: 'github', sampleCount: 75, author: 'yaxu' },
  { id: 'clean-breaks', name: 'Clean Breaks', url: 'github:yaxu/clean-breaks', category: 'github', sampleCount: 32, author: 'yaxu' },
  { id: 'mrid', name: 'Mrid', url: 'github:yaxu/mrid', category: 'github', sampleCount: 13, author: 'yaxu' },

  // ─── GITHUB: felixroos ─────────────────────────────────────────────────────
  { id: 'estuary-samples', name: 'Estuary Samples', url: 'github:felixroos/estuary-samples', category: 'github', sampleCount: 19, author: 'felixroos' },
  { id: 'felixroos-samples', name: 'Felix Roos Samples', url: 'github:felixroos/samples', category: 'github', sampleCount: 17, author: 'felixroos' },

  // ─── COMMUNITY: Large Collections ──────────────────────────────────────────
  { id: 'samplesKzur', name: 'Samples Kzur', url: 'github:MartinMaguna/samplesKzur', category: 'community', sampleCount: 35, author: 'MartinMaguna' },
  { id: 'randumsample', name: 'Random Sample', url: 'github:mmmgarlic/randumsample', category: 'community', sampleCount: 35, author: 'mmmgarlic' },
  { id: 'studel-beats', name: 'Strudel Beats', url: 'github:mistipher/studel-beats', category: 'community', sampleCount: 32, author: 'mistipher' },
  { id: 'v10101a-samples', name: 'V10101A Samples', url: 'github:sandpills/v10101a-samples', category: 'community', sampleCount: 32, author: 'sandpills' },
  { id: 'ms-teams-sounds', name: 'MS Teams Sounds', url: 'github:AustinOliverHaskell/ms-teams-sounds-strudel', category: 'community', sampleCount: 31, author: 'AustinOliverHaskell' },
  { id: 'proudly-breaks', name: 'Proudly Breaks', url: 'github:proudly-music/breaks', category: 'community', sampleCount: 28, author: 'proudly-music' },
  { id: 'terrorhank-samples', name: 'Terrorhank Samples', url: 'github:terrorhank/samples', category: 'community', sampleCount: 28, author: 'terrorhank' },
  { id: 'k09-samples', name: 'K09 Samples', url: 'github:k09/samples', category: 'community', sampleCount: 27, author: 'k09' },
  { id: 'a-maze', name: 'A-Maze', url: 'github:heavy-lifting/a-maze', category: 'community', sampleCount: 26, author: 'heavy-lifting' },
  { id: 'tidalcycles-dagurkris', name: 'Dagurkris Tidalcycles', url: 'github:dagurkris/Tidalcycles', category: 'community', sampleCount: 25, author: 'dagurkris' },

  // ─── COMMUNITY: Breaks & Drums ─────────────────────────────────────────────
  { id: 'bs-breaks', name: 'BS Breaks', url: 'github:bsssssss/strudel-samples/bs-breaks', category: 'community', sampleCount: 20, author: 'bsssssss' },
  { id: 'mamal-samples', name: 'Mamal Samples', url: 'github:mamalLivecoder/samples', category: 'community', sampleCount: 19, author: 'mamalLivecoder' },
  { id: 'eddyflux-crate', name: 'Eddyflux Crate', url: 'github:eddyflux/crate', category: 'community', sampleCount: 18, author: 'eddyflux' },
  { id: 'pavlov-samples', name: 'Pavlov Samples', url: 'github:pavlovpavlov/samples', category: 'community', sampleCount: 15, author: 'pavlovpavlov' },
  { id: 'mot4i-garden', name: 'Garden', url: 'github:mot4i/garden', category: 'community', sampleCount: 13, author: 'mot4i' },
  { id: 'emptyflash-samples', name: 'Emptyflash Samples', url: 'github:emptyflash/samples', category: 'community', sampleCount: 13, author: 'emptyflash' },
  { id: 'indiepaleale-samples', name: 'Indiepaleale Samples', url: 'github:indiepaleale/strudel-samples', category: 'community', sampleCount: 12, author: 'indiepaleale' },
  { id: 'sarefo-strudel', name: 'Sarefo Strudel', url: 'github:sarefo/strudel', category: 'community', sampleCount: 12, author: 'sarefo' },
  { id: 'naaeeen-lens', name: 'LENS', url: 'github:Naaeeen/LENS', category: 'community', sampleCount: 11, author: 'Naaeeen' },
  { id: 'algorave-dave', name: 'Algorave Dave', url: 'github:algorave-dave/samples', category: 'community', sampleCount: 10, author: 'algorave-dave' },
  { id: 'byolim-breaks', name: 'Byolim Breaks', url: 'github:byolim/breaks', category: 'community', sampleCount: 10, author: 'byolim' },

  // ─── COMMUNITY: Specialty Packs ────────────────────────────────────────────
  { id: 'glorkglunk-wavetables', name: 'Glorkglunk Wavetables', url: 'github:kyrsive/glorkglunk-wavetables', category: 'community', sampleCount: 9, author: 'kyrsive' },
  { id: 'azhadsyed-samples', name: 'Azhadsyed Samples', url: 'github:azhadsyed/strudel-samples', category: 'community', sampleCount: 9, author: 'azhadsyed' },
  { id: 'strudel-m8-dnb', name: 'M8 DNB Jungle', url: 'github:creativenucleus/strudel-m8-168-dnb-jungle', category: 'community', sampleCount: 8, author: 'creativenucleus' },
  { id: 'kakuya-samples', name: 'Kakuya Samples', url: 'github:KakuyaShiraishi/samples', category: 'community', sampleCount: 8, author: 'KakuyaShiraishi' },
  { id: 'vasilym-samples', name: 'Vasily Milovidov Samples', url: 'github:vasilymilovidov/samples', category: 'community', sampleCount: 8, author: 'vasilymilovidov' },
  { id: 'sampuru', name: 'Sampuru', url: 'github:SutterChristian/sampuru', category: 'community', sampleCount: 8, author: 'SutterChristian' },
  { id: 'tedthetrumpet', name: 'Ted the Trumpet', url: 'github:tedthetrumpet/testpage/strudelsamples', category: 'community', sampleCount: 7, author: 'tedthetrumpet' },
  { id: 'ross-sec-dsamples', name: 'Ross Sec DSamples', url: 'github:ross-sec-audio/dsamples', category: 'community', sampleCount: 7, author: 'ross-sec-audio' },
  { id: 'bruveping-spectrum', name: 'Codigo Spectrum', url: 'github:bruveping/RepositorioDESonido_N_3/Codigo_Spectrum_2025', category: 'community', sampleCount: 6, author: 'bruveping' },
  { id: 'prof12200-strudel', name: 'Prof12200 Strudel', url: 'github:Prof12200/strudel_repo', category: 'community', sampleCount: 6, author: 'Prof12200' },
  { id: 'bs-sounds', name: 'BS Sounds', url: 'github:bsssssss/strudel-samples/bs-sounds', category: 'community', sampleCount: 5, author: 'bsssssss' },
  { id: 'salsicha-capoeira', name: 'Capoeira Strudel', url: 'github:salsicha/capoeira_strudel', category: 'community', sampleCount: 4, author: 'salsicha' },
  { id: 'mirus', name: 'Mirus', url: 'github:TristanCacqueray/mirus', category: 'community', sampleCount: 4, author: 'TristanCacqueray' },
  { id: 'prismograph-departure', name: 'Departure', url: 'github:prismograph/departure', category: 'community', sampleCount: 4, author: 'prismograph' },
  { id: 'kaiye10-samples', name: 'Kaiye10 Samples', url: 'github:kaiye10/strudelSamples', category: 'community', sampleCount: 4, author: 'kaiye10' },
  { id: 'msl-strudel-samples', name: 'MSL Strudel Samples', url: 'github:mysinglelise/msl-strudel-samples', category: 'community', sampleCount: 4, author: 'mysinglelise' },
  { id: 'todepond-v5', name: 'TodePond V5', url: 'github:TodePond/samples/v5', category: 'community', sampleCount: 4, author: 'TodePond' },
  { id: 'todepond-v4', name: 'TodePond V4', url: 'github:TodePond/samples/v4', category: 'community', sampleCount: 4, author: 'TodePond' },

  // ─── COMMUNITY: Small Packs ────────────────────────────────────────────────
  { id: 'boggodan-bflute', name: 'BFlute', url: 'github:boggodan/bflute', category: 'community', sampleCount: 3, author: 'boggodan' },
  { id: 'absentfriend-samples', name: 'Absentfriend Samples', url: 'github:absentfriend2025/samples', category: 'community', sampleCount: 3, author: 'absentfriend2025' },
  { id: 'hvillase-cavlp', name: 'CAVLP 25P', url: 'github:hvillase/cavlp-25p', category: 'community', sampleCount: 3, author: 'hvillase' },
  { id: 'joonies-dnb', name: 'Joonies DNB', url: 'github:smaudd/joonies-dnb-collection-strudel', category: 'community', sampleCount: 2, author: 'smaudd' },
  { id: 'ibleedicare-bank', name: 'Ibleedicare Bank', url: 'github:ibleedicare/strudel-bank', category: 'community', sampleCount: 2, author: 'ibleedicare' },
  { id: 'janpc01-samples', name: 'Janpc01 Samples', url: 'github:janpc01/samples', category: 'community', sampleCount: 2, author: 'janpc01' },
  { id: 'jessica-samples', name: 'Jessica Samples', url: 'github:jessicaaaaaaaaaaaa/strudel-samples', category: 'community', sampleCount: 2, author: 'jessicaaaaaaaaaaaa' },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Filter sample packs by search query
 * Matches against name, category, URL, and author (case-insensitive)
 */
export function filterPacks(packs: SamplePack[], query: string): SamplePack[] {
  if (!query.trim()) {
    return packs;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return packs.filter(pack => 
    pack.name.toLowerCase().includes(lowerQuery) ||
    pack.url.toLowerCase().includes(lowerQuery) ||
    pack.category.toLowerCase().includes(lowerQuery) ||
    (pack.author?.toLowerCase().includes(lowerQuery) ?? false) ||
    (pack.description?.toLowerCase().includes(lowerQuery) ?? false)
  );
}

/**
 * Group sample packs by category
 */
export function groupByCategory(packs: SamplePack[]): Map<SampleCategory, SamplePack[]> {
  const grouped = new Map<SampleCategory, SamplePack[]>();
  
  // Initialize all categories
  for (const cat of CATEGORIES) {
    grouped.set(cat.id, []);
  }
  
  // Group packs
  for (const pack of packs) {
    const categoryPacks = grouped.get(pack.category);
    if (categoryPacks) {
      categoryPacks.push(pack);
    }
  }
  
  return grouped;
}

/**
 * Generate the samples() code snippet for clipboard
 */
export function generateCopySnippet(url: string): string {
  return `samples('${url}')`;
}

/**
 * Get category info by ID
 */
export function getCategoryInfo(categoryId: SampleCategory): CategoryInfo | undefined {
  return CATEGORIES.find(c => c.id === categoryId);
}
