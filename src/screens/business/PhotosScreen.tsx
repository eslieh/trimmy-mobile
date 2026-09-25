import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/Button';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';

const TOTAL_STEPS = 11;
const THUMB_SIZE = 100;

export function PhotosScreen() {
  const router = useRouter();
  const photoDrafts = useBusinessOnboardingStore((s) => s.photoDrafts);
  const addPhotoDraft = useBusinessOnboardingStore((s) => s.addPhotoDraft);
  const removePhotoDraft = useBusinessOnboardingStore((s) => s.removePhotoDraft);
  const submitPhotos = useBusinessOnboardingStore((s) => s.submitPhotos);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      addPhotoDraft(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    // The store keeps the error for the inline message — stay on this step.
    try {
      await submitPhotos();
    } catch {
      return;
    }
    router.push('/business-hours');
  };

  return (
    <AuthScreenLayout
      title="Add photos"
      subtitle="Show off your space. The first photo becomes your cover image in search results."
      progress={5 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isSubmitting ? 'Uploading…' : 'Continue'}
            disabled={photoDrafts.length === 0 || isSubmitting}
            onPress={handleContinue}
          />
        </>
      }
    >
      <View style={styles.grid}>
        {photoDrafts.map((photo, index) => (
          <View key={photo.localId} style={styles.thumbWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
            {index === 0 ? (
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>Cover</Text>
              </View>
            ) : null}
            <Pressable style={styles.removeButton} onPress={() => removePhotoDraft(photo.localId)} hitSlop={8}>
              <CloseIcon size={14} color={colors.white} />
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.addTile} onPress={handlePickPhoto}>
          <Text style={styles.addTileText}>+ Add</Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
  },
  coverBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.overlay,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  coverBadgeText: {
    ...typography.caption,
    color: colors.white,
  },
  removeButton: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});
