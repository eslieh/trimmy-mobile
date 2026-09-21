import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';

// Phase 3 (booking) doesn't exist yet, so there's no real appointment data —
// this is just the empty state a first-time customer would actually see.
export function ActivityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>
      <View style={styles.empty}>
        <CalendarIcon size={40} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No appointments yet</Text>
        <Text style={styles.emptyBody}>Book a service and it'll show up here.</Text>
        <Button label="Find a business" onPress={() => router.push('/search')} style={styles.emptyButton} />
      </View>
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
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
