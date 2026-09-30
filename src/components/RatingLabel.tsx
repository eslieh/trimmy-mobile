import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { StarIcon } from './icons/StarIcon';
import { colors, spacing, typography } from '../theme';

interface RatingLabelProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  textStyle?: StyleProp<TextStyle>;
}

// `4.7 (128)` or just `4.7` with a star icon — used on result cards, Business
// Profile, and reviews wherever a rating is shown inline with other text.
export function RatingLabel({ rating, reviewCount, size = 13, textStyle }: RatingLabelProps) {
  return (
    <View style={styles.row}>
      <StarIcon size={size} />
      <Text style={[styles.text, textStyle]}>
        {rating.toFixed(1)}
        {reviewCount !== undefined ? ` (${reviewCount})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
