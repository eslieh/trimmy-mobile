import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface MasonryPhotoGridProps {
  images: string[];
  onPressImage: (index: number) => void;
}

// Deterministic per-position aspect ratios (not measured from the actual
// images) give a staggered, pinterest-style look without a masonry library
// or an extra round-trip to read each image's real dimensions.
const ASPECT_RATIOS = [1, 1.3, 0.75, 1.15, 0.9];

export function MasonryPhotoGrid({ images, onPressImage }: MasonryPhotoGridProps) {
  const columns: { url: string; index: number }[][] = [[], []];
  images.forEach((url, index) => {
    columns[index % 2].push({ url, index });
  });

  return (
    <View style={styles.row}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={styles.column}>
          {column.map(({ url, index }) => (
            <Pressable
              key={`${url}_${index}`}
              onPress={() => onPressImage(index)}
              style={[styles.item, { aspectRatio: ASPECT_RATIOS[index % ASPECT_RATIOS.length] }]}
            >
              <Image source={{ uri: url }} style={styles.image} />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  item: {
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
