import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

// Deterministic per-name color + initials — used wherever a staff/person
// photo may be missing (most mock staff have no avatarUrl yet).
const PALETTE = [colors.brand.purple, '#153F63', '#0A8A4B', '#B45309', '#5A62C4'];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name, uri, size = 44 }: AvatarProps) {
  const shapeStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    // resizeMethod="resize": Android decodes at display size, not the full image.
    return <Image source={{ uri }} style={[styles.base, shapeStyle]} resizeMethod="resize" />;
  }

  return (
    <View style={[styles.base, styles.placeholder, shapeStyle, { backgroundColor: colorFor(name) }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsFor(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.tertiary,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.label,
    color: colors.white,
  },
});
