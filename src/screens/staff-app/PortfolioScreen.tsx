import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { ImageGalleryViewer } from '../../components/ImageGalleryViewer';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { deletePortfolioPhoto, getPortfolio, uploadPortfolioPhoto, type Portfolio } from '../../api/portfolio';
import { colors, radii, spacing, typography } from '../../theme';
import { showApiError } from '../../utils/showApiError';

const COLUMNS = 3;
const GAP = spacing.sm;

// A staff member's portfolio: photos of their work that customers see on
// their profile. Opened by the member from their Menu ("My portfolio") or by
// the owner from a team member's page (?name= set). Picks several at once
// and uploads them one after another, so a slow connection isn't flooded.
export function PortfolioScreen() {
  const router = useRouter();
  const { businessId, staffId, name } = useLocalSearchParams<{ businessId: string; staffId: string; name?: string }>();
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - spacing.xxl * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [failed, setFailed] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!businessId || !staffId) return;
    setFailed(false);
    getPortfolio(businessId, staffId)
      .then(setPortfolio)
      .catch(() => setFailed(true));
  }, [businessId, staffId]);

  useFocusEffect(load);

  const photos = portfolio?.photos ?? [];
  const room = portfolio ? portfolio.maxPhotos - photos.length : 0;

  const handleAdd = async () => {
    if (!portfolio || room <= 0 || uploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.min(room, 10),
      // Re-encoded as JPEG at this quality: a few hundred KB instead of a multi-MB original.
      quality: 0.7,
    });
    if (result.canceled || !result.assets.length) return;

    const assets = result.assets.slice(0, room);
    setUploading({ done: 0, total: assets.length });
    for (const [i, asset] of assets.entries()) {
      try {
        const photo = await uploadPortfolioPhoto(businessId, staffId, asset.uri);
        setPortfolio((p) => (p ? { ...p, photos: [photo, ...p.photos] } : p));
      } catch (err) {
        showApiError("Couldn't upload a photo", err);
        break;
      }
      setUploading({ done: i + 1, total: assets.length });
    }
    setUploading(null);
  };

  const handleDelete = (photoId: string) => {
    Alert.alert('Remove this photo?', 'It will no longer show on the profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const before = portfolio;
          // Gone at once; put back if the server says no.
          setPortfolio((p) => (p ? { ...p, photos: p.photos.filter((x) => x.photoId !== photoId) } : p));
          deletePortfolioPhoto(businessId, staffId, photoId).catch((err) => {
            setPortfolio(before);
            showApiError("Couldn't remove photo", err);
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.eyebrow}>● PORTFOLIO</Text>
          <Text style={styles.title}>{name ? `${name}'s work` : 'My work'}</Text>
          <Text style={styles.subtitle}>
            Photos of {name ? 'their' : 'your'} best work. Customers see them on {name ? 'their' : 'your'} profile when choosing who to book.
          </Text>
        </View>

        {!portfolio ? (
          failed ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Couldn't load the portfolio.</Text>
              <Button label="Try again" variant="secondary" onPress={load} />
            </View>
          ) : (
            <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
          )
        ) : (
          <>
            <Text style={styles.count}>
              {photos.length} of {portfolio.maxPhotos} photos
            </Text>
            <View style={styles.grid}>
              {photos.map((photo, index) => (
                <Pressable key={photo.photoId} onPress={() => setViewing(index)} style={{ width: tile, height: tile }}>
                  {/* resizeMethod="resize": Android decodes at tile size, not the full photo. */}
                  <Image source={{ uri: photo.url }} style={[styles.thumb, { width: tile, height: tile }]} resizeMethod="resize" />
                  <Pressable
                    style={styles.remove}
                    onPress={() => handleDelete(photo.photoId)}
                    hitSlop={10}
                    accessibilityLabel="Remove photo"
                  >
                    <CloseIcon size={12} color={colors.white} />
                  </Pressable>
                </Pressable>
              ))}
              {room > 0 ? (
                <Pressable style={[styles.add, { width: tile, height: tile }]} onPress={handleAdd} disabled={!!uploading}>
                  {uploading ? (
                    <>
                      <ActivityIndicator color={colors.brand.accentForeground} />
                      <Text style={styles.addText}>
                        {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.addPlus}>+</Text>
                      <Text style={styles.addText}>Add photos</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
            {photos.length === 0 && !uploading ? (
              <Text style={styles.hint}>Tip: clear, well-lit photos of finished looks get the most bookings.</Text>
            ) : null}
            {room <= 0 ? <Text style={styles.hint}>The portfolio is full. Remove a photo to add another.</Text> : null}
          </>
        )}
      </ScrollView>

      <ImageGalleryViewer
        visible={viewing !== null}
        images={photos.map((p) => p.url)}
        initialIndex={viewing ?? 0}
        onClose={() => setViewing(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.brand.pink,
    letterSpacing: 0.6,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  loading: {
    marginTop: spacing.huge,
  },
  count: {
    ...typography.label,
    color: colors.text.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  thumb: {
    borderRadius: radii.xl,
    backgroundColor: colors.background.tertiary,
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(20,18,26,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    borderRadius: radii.xl,
    backgroundColor: colors.brand.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPlus: {
    ...typography.h1,
    color: colors.brand.accentForeground,
  },
  addText: {
    ...typography.label,
    color: colors.brand.accentForeground,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  empty: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
