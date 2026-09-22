import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { CloseIcon } from '../../components/icons/CloseIcon';
import {
  ServiceCategoryDraft,
  ServiceDraftItem,
  useBusinessOnboardingStore,
} from '../../store/useBusinessOnboardingStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';

const TOTAL_STEPS = 11;

export function ServicesScreen() {
  const router = useRouter();
  const categories = useBusinessOnboardingStore((s) => s.serviceCategoryDrafts);
  const addCategory = useBusinessOnboardingStore((s) => s.addServiceCategoryDraft);
  const removeCategory = useBusinessOnboardingStore((s) => s.removeServiceCategoryDraft);
  const addService = useBusinessOnboardingStore((s) => s.addServiceDraft);
  const removeService = useBusinessOnboardingStore((s) => s.removeServiceDraft);
  const submitServices = useBusinessOnboardingStore((s) => s.submitServices);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const [addServiceForCategory, setAddServiceForCategory] = useState<string | null>(null);

  const totalServices = categories.reduce((sum, c) => sum + c.services.length, 0);

  const handleContinue = async () => {
    await submitServices();
    router.push('/business-policies');
  };

  return (
    <AuthScreenLayout
      title="Organize your services"
      subtitle="Group your services into categories, like Haircuts or Coloring."
      progress={7 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={totalServices === 0 || isSubmitting}
            onPress={handleContinue}
          />
        </>
      }
    >
      {categories.map((category) => (
        <View key={category.localId} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Pressable onPress={() => removeCategory(category.localId)} hitSlop={8}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>

          {category.services.length === 0 ? (
            <Text style={styles.emptyHint}>No services yet</Text>
          ) : (
            category.services.map((service, index) => (
              <View key={`${category.localId}_${index}`} style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {service.durationMinutes} min · KSh {service.price.amount}
                  </Text>
                </View>
                <Pressable onPress={() => removeService(category.localId, index)} hitSlop={8}>
                  <CloseIcon size={16} color={colors.feedback.danger} />
                </Pressable>
              </View>
            ))
          )}

          <Button
            label="+ Add service"
            variant="secondary"
            onPress={() => setAddServiceForCategory(category.localId)}
            style={styles.addServiceButton}
          />
        </View>
      ))}

      <Button label="+ Add category" variant="secondary" onPress={() => setAddCategoryVisible(true)} />

      <AddCategorySheet
        visible={addCategoryVisible}
        onClose={() => setAddCategoryVisible(false)}
        onSubmit={(name) => {
          addCategory(name);
          setAddCategoryVisible(false);
        }}
      />

      <AddServiceSheet
        visible={addServiceForCategory !== null}
        onClose={() => setAddServiceForCategory(null)}
        onSubmit={(item) => {
          if (addServiceForCategory) {
            addService(addServiceForCategory, item);
          }
          setAddServiceForCategory(null);
        }}
      />
    </AuthScreenLayout>
  );
}

interface AddCategorySheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

function AddCategorySheet({ visible, onClose, onSubmit }: AddCategorySheetProps) {
  const [name, setName] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>New category</Text>
          <Input label="Category name" value={name} onChangeText={setName} placeholder="e.g. Haircuts" autoFocus />
          <Button
            label="Add category"
            disabled={!name.trim()}
            onPress={() => {
              onSubmit(name.trim());
              setName('');
            }}
            style={styles.sheetButton}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface AddServiceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (item: ServiceDraftItem) => void;
}

function AddServiceSheet({ visible, onClose, onSubmit }: AddServiceSheetProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');

  const durationMinutes = parseInt(duration, 10);
  const amount = parseFloat(price);
  const canSubmit = name.trim().length > 0 && durationMinutes > 0 && amount > 0;

  const reset = () => {
    setName('');
    setDuration('');
    setPrice('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>New service</Text>
          <Input label="Service name" value={name} onChangeText={setName} placeholder="e.g. Classic Haircut" autoFocus />
          <View style={styles.sheetRow}>
            <Input
              label="Duration (min)"
              value={duration}
              onChangeText={setDuration}
              placeholder="45"
              keyboardType="number-pad"
              style={styles.sheetRowField}
            />
            <Input
              label="Price (KSh)"
              value={price}
              onChangeText={setPrice}
              placeholder="800"
              keyboardType="number-pad"
              style={styles.sheetRowField}
            />
          </View>
          <Button
            label="Add service"
            disabled={!canSubmit}
            onPress={() => {
              onSubmit({ name: name.trim(), durationMinutes, price: { amount, currency: 'KES' } });
              reset();
            }}
            style={styles.sheetButton}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  removeText: {
    ...typography.bodyMedium,
    color: colors.feedback.danger,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  addServiceButton: {
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  sheetRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetRowField: {
    flex: 1,
  },
  sheetButton: {
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});
