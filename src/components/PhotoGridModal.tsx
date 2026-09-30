import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseIcon } from './icons/CloseIcon';
import { ImageGalleryViewer } from './ImageGalleryViewer';
import { MasonryPhotoGrid } from './MasonryPhotoGrid';
import { colors, spacing, typography } from '../theme';

interface PhotoGridModalProps {
  visible: boolean;
  title: string;
  images: string[];
  onClose: () => void;
}

// "See all photos" → masonry grid → tap a photo → full-screen pager. Used
// by Business Profile's hero (and reusable anywhere else a photo set needs
// the same grid-then-viewer pattern).
export function PhotoGridModal({ visible, title, images, onClose }: PhotoGridModalProps) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <CloseIcon size={16} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <MasonryPhotoGrid images={images} onPressImage={setGalleryIndex} />
        </ScrollView>
      </SafeAreaView>

      <ImageGalleryViewer
        visible={galleryIndex !== null}
        images={images}
        initialIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
      />
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
});
