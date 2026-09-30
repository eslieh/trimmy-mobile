import { useState } from 'react';
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CloseIcon } from './icons/CloseIcon';
import { colors, radii, spacing, typography } from '../theme';

interface ImageGalleryViewerProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

// Full-screen horizontal pager over a set of photos — opened from
// MasonryPhotoGrid (or directly) at whichever image was tapped. Shared by
// Business Profile's photo grid and Staff Profile's portfolio.
export function ImageGalleryViewer({ visible, images, initialIndex, onClose }: ImageGalleryViewerProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} presentationStyle="fullScreen">
      {/* A Modal mounts as its own native root on iOS, disconnected from the
          app's outer SafeAreaProvider — without a fresh one here,
          useSafeAreaInsets/SafeAreaView silently measure 0 and this overlay
          renders under the status bar, unpressable. */}
      <SafeAreaProvider>
        <View style={styles.flex}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            contentOffset={{ x: initialIndex * width, y: 0 }}
          >
            {images.map((url, i) => (
              // The image is letterboxed (resizeMode="contain"), so this
              // Pressable's bounds cover both the visible photo and the
              // empty space around it — tapping either closes the viewer.
              <Pressable key={`${url}_${i}`} style={[styles.slide, { width }]} onPress={onClose}>
                <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
              </Pressable>
            ))}
          </ScrollView>

          <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <CloseIcon size={18} color={colors.white} />
            </Pressable>
            {images.length > 1 ? (
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>
                  {index + 1}/{images.length}
                </Text>
              </View>
            ) : null}
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.black,
  },
  slide: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  pageBadgeText: {
    ...typography.label,
    color: colors.white,
  },
});
