// The trimmy-landing design language (web uses the same values): plum-tinted
// near-black text, white surfaces, and one pink accent.
// brand.purple keeps its name for the many call sites but is now the deep
// pink, dark enough to pass AA as text on white (5.4:1); brand.pink is the
// landing's accent-strong; accent / accentSoft are fills only, never text on
// white.
export const colors = {
  brand: {
    purple: '#B83A6E',
    pink: '#D1477E',
    gradient: ['#9C2F66', '#B83A6E'] as const,
    accent: '#F6B9D6',
    accentSoft: '#FDE3EF',
    accentForeground: '#3A1424',
  },

  text: {
    primary: '#14121A',
    secondary: '#4A4654',
    tertiary: '#8A8594',
    inverse: '#FFFFFF',
    link: '#B83A6E',
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
    primaryBg: '#14121A',
    primaryText: '#FFFFFF',
    secondaryBg: '#FFFFFF',
    secondaryBorder: '#DDDDDD',
    secondaryText: '#14121A',
    disabledBg: '#F0F0F0',
    disabledText: '#B0B0B0',
  },

  tab: {
    active: '#D1477E',
    inactive: '#8A8594',
  },

  pill: {
    selectedBg: '#14121A',
    selectedText: '#FFFFFF',
    unselectedBg: '#F0F0F0',
    unselectedText: '#14121A',
  },

  badge: {
    verified: '#D1477E',
    newBg: '#14121A',
    newText: '#FFFFFF',
  },

  feedback: {
    success: '#0A8A4B',
    warning: '#B45309',
    danger: '#D0323C',
  },

  overlay: 'rgba(20,18,26,0.4)',
  white: '#FFFFFF',
  black: '#14121A',
};

export type Colors = typeof colors;
