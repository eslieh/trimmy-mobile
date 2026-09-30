import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BackButton } from '../../components/BackButton';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';
import { showApiError } from '../../utils/showApiError';

const THUMB_SIZE = 100;

// Post-publish sibling to onboarding's PhotosScreen — same grid UI, but
// reads/writes the live business.photos immediately per action (via
// addPhotoNow/removePhotoNow) instead of batching local drafts.
export function ManagePhotosScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const addPhotoNow = useBusinessOnboardingStore((s) => s.addPhotoNow);
  const removePhotoNow = useBusinessOnboardingStore((s) => s.removePhotoNow);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  if (!business) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const photos = business.photos ?? [];

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
      await addPhotoNow(business.businessId, result.assets[0].uri).catch((err) =>
        showApiError("Couldn't upload photo", err),
      );
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Photos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.grid}>
          {photos.map((photo, index) => (
            <View key={photo.photoId} style={styles.thumbWrapper}>
              <Image source={{ uri: photo.url }} style={styles.thumb} />
              {index === 0 ? (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Cover</Text>
                </View>
              ) : null}
              <Pressable
                style={styles.removeButton}
                onPress={() =>
                  removePhotoNow(business.businessId, photo.photoId).catch((err) =>
                    showApiError("Couldn't remove photo", err),
                  )
                }
                hitSlop={8}
              >
                <CloseIcon size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.addTile} onPress={handlePickPhoto} disabled={isSubmitting}>
            <Text style={styles.addTileText}>{isSubmitting ? 'Uploading…' : '+ Add'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
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
