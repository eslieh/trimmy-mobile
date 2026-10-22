// Plus Jakarta Sans, the trimmy-landing typeface (web uses the same font).
export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

type TextStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

// Scale mirrors the reference screens: oversized bold display headings
// ("Profile", "Messages"), medium-weight section titles, and quiet grey body
// copy for secondary/meta text.
export const typography: Record<string, TextStyle> = {
  display: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  h1: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 20 },
};
