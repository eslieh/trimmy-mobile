// Sampled from the Trimmy wordmark (assets/icon.png) and the Airbnb-style
// reference screens: near-black text, warm greys, white surfaces, and a
// single saturated accent used sparingly (badges, active tab, links).
export const colors = {
  brand: {
    purple: '#771EE2',
    pink: '#E03AB3',
    gradient: ['#771EE2', '#E03AB3'] as const,
  },

  text: {
    primary: '#222222',
    secondary: '#6A6A6A',
    tertiary: '#9A9A9A',
    inverse: '#FFFFFF',
    link: '#771EE2',
  },

  background: {
    primary: '#FFFFFF',
    secondary: '#F7F7F7',
    tertiary: '#F0F0F0',
  },

  border: {
    subtle: '#EBEBEB',
    default: '#DDDDDD',
    strong: '#C6C6C6',
  },

  button: {
    primaryBg: '#222222',
    primaryText: '#FFFFFF',
    secondaryBg: '#FFFFFF',
    secondaryBorder: '#DDDDDD',
    secondaryText: '#222222',
    disabledBg: '#F0F0F0',
    disabledText: '#B0B0B0',
  },

  tab: {
    active: '#E03AB3',
    inactive: '#9A9A9A',
  },

  pill: {
    selectedBg: '#222222',
    selectedText: '#FFFFFF',
    unselectedBg: '#F0F0F0',
    unselectedText: '#222222',
  },

  badge: {
    verified: '#E03AB3',
    newBg: '#222222',
    newText: '#FFFFFF',
  },

  feedback: {
    success: '#0A8A4B',
    warning: '#B45309',
    danger: '#D0323C',
  },

  overlay: 'rgba(0,0,0,0.4)',
  white: '#FFFFFF',
  black: '#222222',
};

export type Colors = typeof colors;
