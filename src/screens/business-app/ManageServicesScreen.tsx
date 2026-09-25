import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { UpdateServiceInput } from '../../api/businessSetup';
import type { Service } from '../../types/business';
import { showApiError } from '../../utils/showApiError';

// Post-publish sibling to onboarding's ServicesScreen — same category-card /
// add-service-sheet visual language, but operating on the already-live
// serviceCategories/services (immediate API calls per action, not a
// batched wizard submit) via the *Now/edit*/remove* store actions.
export function ManageServicesScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const serviceCategories = useBusinessOnboardingStore((s) => s.serviceCategories);
  const services = useBusinessOnboardingStore((s) => s.services);
  const addServiceCategoryNow = useBusinessOnboardingStore((s) => s.addServiceCategoryNow);
  const addServiceNow = useBusinessOnboardingStore((s) => s.addServiceNow);
  const editService = useBusinessOnboardingStore((s) => s.editService);
  const removeService = useBusinessOnboardingStore((s) => s.removeService);
  const removeServiceCategory = useBusinessOnboardingStore((s) => s.removeServiceCategory);

  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const [addServiceForCategory, setAddServiceForCategory] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  if (!business) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const servicesByCategory = (categoryId: string) => services.filter((s) => s.categoryId === categoryId);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Services</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {serviceCategories.map((category) => {
          const categoryServices = servicesByCategory(category.categoryId);
          return (
            <View key={category.categoryId} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Pressable onPress={() => removeServiceCategory(business.businessId, category.categoryId)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>

              {categoryServices.length === 0 ? (
                <Text style={styles.emptyHint}>No services yet</Text>
              ) : (
                categoryServices.map((service) => (
                  <Pressable
                    key={service.serviceId}
                    style={styles.serviceRow}
                    onPress={() => setEditingService(service)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceMeta}>
                        {service.durationMinutes} min · KSh {service.price.amount}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeService(business.businessId, service.serviceId)} hitSlop={8}>
                      <CloseIcon size={16} color={colors.feedback.danger} />
                    </Pressable>
                  </Pressable>
                ))
              )}

              <Button
                label="+ Add service"
                variant="secondary"
                onPress={() => setAddServiceForCategory(category.categoryId)}
                style={styles.addServiceButton}
              />
            </View>
          );
        })}

        <Button label="+ Add category" variant="secondary" onPress={() => setAddCategoryVisible(true)} />
      </ScrollView>

      <AddCategorySheet
        visible={addCategoryVisible}
        onClose={() => setAddCategoryVisible(false)}
        onSubmit={async (name) => {
          setAddCategoryVisible(false);
          await addServiceCategoryNow(business.businessId, name).catch((err) =>
            showApiError("Couldn't add category", err),
          );
        }}
      />

      <AddServiceSheet
        visible={addServiceForCategory !== null}
        onClose={() => setAddServiceForCategory(null)}
        onSubmit={async (input) => {
          const categoryId = addServiceForCategory;
          setAddServiceForCategory(null);
          if (!categoryId) return;
          await addServiceNow(business.businessId, categoryId, input).catch((err) =>
            showApiError("Couldn't add service", err),
          );
        }}
      />

      <EditServiceSheet
        key={editingService?.serviceId ?? 'none'}
        service={editingService}
        onClose={() => setEditingService(null)}
        onSubmit={async (input) => {
          const service = editingService;
          setEditingService(null);
          if (!service) return;
          await editService(business.businessId, service.serviceId, input).catch((err) =>
            showApiError("Couldn't save service", err),
          );
        }}
      />
    </SafeAreaView>
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
  onSubmit: (item: UpdateServiceInput) => void;
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

interface EditServiceSheetProps {
  service: Service | null;
  onClose: () => void;
  onSubmit: (item: UpdateServiceInput) => void;
}

// Remounted via a `key` on `service?.serviceId` whenever a different
// service is opened for editing, so these useState initializers reliably
// re-seed instead of needing a render-time sync effect.
function EditServiceSheet({ service, onClose, onSubmit }: EditServiceSheetProps) {
  const [name, setName] = useState(service?.name ?? '');
  const [duration, setDuration] = useState(service ? String(service.durationMinutes) : '');
  const [price, setPrice] = useState(service ? String(service.price.amount) : '');

  const durationMinutes = parseInt(duration, 10);
  const amount = parseFloat(price);
  const canSubmit = name.trim().length > 0 && durationMinutes > 0 && amount > 0;

  const handleClose = () => {
    setName('');
    setDuration('');
    setPrice('');
    onClose();
  };

  return (
    <Modal visible={service !== null} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Edit service</Text>
          <Input label="Service name" value={name} onChangeText={setName} autoFocus />
          <View style={styles.sheetRow}>
            <Input
              label="Duration (min)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              style={styles.sheetRowField}
            />
            <Input
              label="Price (KSh)"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              style={styles.sheetRowField}
            />
          </View>
          <Button
            label="Save changes"
            disabled={!canSubmit}
            onPress={() => {
              onSubmit({ name: name.trim(), durationMinutes, price: { amount, currency: 'KES' } });
              setName('');
              setDuration('');
              setPrice('');
            }}
            style={styles.sheetButton}
          />
        </Pressable>
      </Pressable>
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
    gap: spacing.md,
  },
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
});
