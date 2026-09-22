import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Country, countries } from '../data/countries';
import { CheckmarkIcon } from './icons/CheckmarkIcon';
import { colors, radii, spacing, typography } from '../theme';

interface CountryPickerProps {
  visible: boolean;
  selected: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export function CountryPicker({ visible, selected, onSelect, onClose }: CountryPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.iso2.toLowerCase() === q
    );
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Country</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search country or code"
          placeholderTextColor={colors.text.tertiary}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.iso2}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.iso2 === selected.iso2;
            return (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.dialCode}>+{item.dialCode}</Text>
                {isSelected ? <CheckmarkIcon size={18} /> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
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
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  closeText: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  search: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  countryName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  dialCode: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: spacing.md,
  },
});
