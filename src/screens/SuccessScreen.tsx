import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { CheckIcon } from '../components/icons/CheckIcon';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';

// Shared terminal screen for any flow that ends in "you're done" — onboarding
// completion, login, password reset — so those don't need near-identical
// one-off screens. nextRoute is a Href path (e.g. '/', '/login', '/get-started').
export function SuccessScreen() {
  const router = useRouter();
  const { title, subtitle, ctaLabel, nextRoute } = useLocalSearchParams<{
    title: string;
    subtitle: string;
    ctaLabel: string;
    nextRoute: string;
  }>();

  const handleDone = () => {
    router.dismissAll();
    router.replace(nextRoute as Href);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <CheckIcon size={96} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.footer}>
        <Button label={ctaLabel} onPress={handleDone} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
});
