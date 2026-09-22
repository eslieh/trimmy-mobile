import { Platform } from 'react-native';

// Soft, low-contrast elevation like the Airbnb profile cards — never a hard
// drop shadow.
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.16,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 5 },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 6 },
    default: {},
  }),
};
