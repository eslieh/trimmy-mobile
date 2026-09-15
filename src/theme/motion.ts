// Airbnb-style motion is snappy and physical rather than eased/linear:
// pressables settle with a quick spring, selection indicators glide with a
// softer one. Kept centralized so every component feels like the same hand
// drew it.
export const springs = {
  // Button/card press-in and release.
  press: { damping: 18, stiffness: 380, mass: 0.6 },
  // Segmented control indicator, tab bar icon settle.
  glide: { damping: 20, stiffness: 200, mass: 0.7 },
  // Playful overshoot for things like a like-heart or badge pop-in.
  bouncy: { damping: 10, stiffness: 220, mass: 0.6 },
};

export const durations = {
  fast: 140,
  base: 220,
  slow: 320,
};

export const pressScale = {
  default: 0.96,
  subtle: 0.98,
};
