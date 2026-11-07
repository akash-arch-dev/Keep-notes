import { KeepColor, KeepColorId } from '../types';

export const KEEP_COLORS: Record<KeepColorId, KeepColor> = {
  default: {
    id: 'default',
    name: 'Default',
    lightBg: '#ffffff',
    darkBg: '#202124',
    borderLight: '#e0e0e0',
    borderDark: '#5f6368',
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    lightBg: '#faafa8',
    darkBg: '#5c2b29',
    borderLight: '#f28b82',
    borderDark: '#773330',
  },
  peach: {
    id: 'peach',
    name: 'Peach',
    lightBg: '#f39f76',
    darkBg: '#614a19',
    borderLight: '#fbbc04',
    borderDark: '#806222',
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    lightBg: '#fff8b8',
    darkBg: '#635d19',
    borderLight: '#fff475',
    borderDark: '#7c7524',
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    lightBg: '#e2f6cb',
    darkBg: '#345920',
    borderLight: '#ccff90',
    borderDark: '#44722a',
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    lightBg: '#d4e4ed',
    darkBg: '#16504b',
    borderLight: '#a7ffeb',
    borderDark: '#1e6862',
  },
  fog: {
    id: 'fog',
    name: 'Fog',
    lightBg: '#aeccdc',
    darkBg: '#2d555e',
    borderLight: '#cbf0f8',
    borderDark: '#396d79',
  },
  storm: {
    id: 'storm',
    name: 'Storm',
    lightBg: '#d3bfdb',
    darkBg: '#42275e',
    borderLight: '#aecbfa',
    borderDark: '#553279',
  },
  dusk: {
    id: 'dusk',
    name: 'Dusk',
    lightBg: '#f6e2dd',
    darkBg: '#5b2245',
    borderLight: '#fdcfe8',
    borderDark: '#752d59',
  },
  blossom: {
    id: 'blossom',
    name: 'Blossom',
    lightBg: '#e9e3d4',
    darkBg: '#442f19',
    borderLight: '#e6c9a8',
    borderDark: '#5d4022',
  },
  clay: {
    id: 'clay',
    name: 'Clay',
    lightBg: '#efeff1',
    darkBg: '#3c3f41',
    borderLight: '#e8eaed',
    borderDark: '#4e5255',
  },
};

export function getCardColorStyle(colorId: KeepColorId, isDark: boolean) {
  const color = KEEP_COLORS[colorId] || KEEP_COLORS.default;
  return {
    backgroundColor: isDark ? color.darkBg : color.lightBg,
    borderColor: isDark ? color.borderDark : color.borderLight,
  };
}
