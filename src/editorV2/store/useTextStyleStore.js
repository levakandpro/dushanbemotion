import { create } from 'zustand';
import { TEXT_STYLE_PRESETS, DEFAULT_TEXT_STYLE_ID } from '../../textStyles';

const normalizePresetName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^\w\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const PREMIUM_PRESET_NAMES = new Set(
  [
    'retro sunset',
    'deep ruby',
    'fakeoutline',
    'royal gold',
    'comic pop',
    'blood mood',
    'tactical',
    'gold sand',
    'crimson gum',
    'coffee',
    'hazard',
    'glich effect',
    'glitch effect',
    'lava flow',
    'old newspape',
    'old newspaper',
    'chrome plated',
    'water reflection',
    'candy pop',
    'shadow stamp',
    'paper cutout',
    'sun bleached',
    'comic biik',
    'comic book',
    'wood carving',
    'worn leather',
    'pixel art',
    'subtle emboss',
    'inked',
    'aged parchment',
    'chalkboard',
    'sunset gradient',
    'rough concrete',
    'flat desingn shadow',
    'flat design shadow',
    'bubble gum',
    'vaporwave',
    'golden ratio',
    'hard candy',
    'old film reel',
    'fire brick',
    'cosmic dust',
    'sharp blade',
    'warm copper',
    'digital camo',
    'neon green stant',
    'neon green',
    'bloody drip',
    'cursed scroll',
    'phantom glich',
    'phantom glitch',
    'grave dust',
    'silent hill fog',
    'vampire bite',
    'rusted chains',
    'ctypt engraving',
    'crypt engraving',
    'chainsaw gore',
    'skeletad bone',
    'skeletal bone',
    'haunted mansion',
    'cult symbot',
    'cult symbol',
    'web corvered',
    'web covered',
    'rotten flesh',
    'grim reaper',
    'insanity scribble',
    'mummy wrap',
    'worm eaten',
    'corrupted data',
    'dark ritual',
    'swamp',
    'thing',
    'black plague',
    'unseen horror',
    'grave dirt',
    'flesh wound',
    'shattered glass',
    'whispering shadow',
    'crimson peak',
    'frozen terror',
    'gothic lace',
    'flickering candle',
    'warped reality',
    'ice shadow 04',
    'toon shadow 04',
    'glow pop 05',
    'toon shadow 07',
    'pop blast 12',
    'jelly text 13',
    'pixel punch 14',
    'slime green 16',
    'slime green 19',
    'bubble gum 25',
    'bold outline 41',
    'heavy duty 01',
    'deep glow 02',
    'double stroke 06',
    'double stroke 08',
    'ink splash 10',
    'frozen edge 12',
    'hot lead',
    'classifed',
    'classified',
    'smudged ink',
  ].map(normalizePresetName)
)

const NO_STYLE_PRESET = {
  id: 'no_style',
  name: '',
  isPremium: false,
  sampleText: 'ТЕКСТ',
  config: {
    fontFamily: 'system-ui',
    fontSize: 64,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'none',
    baseColor: '#ffffff',
    stroke: { enabled: false },
    glow: { enabled: false },
    depth: { enabled: false },
    textShadow: 'none',
  },
}

const EFFECTIVE_TEXT_STYLE_PRESETS = [
  NO_STYLE_PRESET,
  ...TEXT_STYLE_PRESETS.map((p) => {
    const normalizedName = normalizePresetName(p?.name)
    const forcedPremium = PREMIUM_PRESET_NAMES.has(normalizedName)
    return forcedPremium ? { ...p, isPremium: true } : p
  }),
]

export const useTextStyleStore = create((set, get) => ({
  presets: EFFECTIVE_TEXT_STYLE_PRESETS,
  activeTextStyleId: DEFAULT_TEXT_STYLE_ID,

  setActiveTextStyle(id) {
    const exists = get().presets.some((p) => p.id === id);
    set({
      activeTextStyleId: exists ? id : DEFAULT_TEXT_STYLE_ID,
    });
  },

  getActivePreset() {
    const { presets, activeTextStyleId } = get();
    return presets.find((p) => p.id === activeTextStyleId) || presets[0];
  },
}));
