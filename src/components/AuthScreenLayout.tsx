import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from './BackButton';
import { StepProgressBar } from './StepProgressBar';
import { colors, spacing, typography } from '../theme';

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  progress?: number;
  onBack: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}

// Shared shell for every onboarding/auth step: back button (+ optional step
// progress) up top, title/subtitle/form in a scroll view, CTA pinned below.
export function AuthScreenLayout({ title, subtitle, progress, onBack, children, footer }: AuthScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          {progress !== undefined ? <StepProgressBar progress={progress} style={styles.progress} /> : null}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  progress: {
    marginLeft: spacing.lg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xxxl,
  },
  body: {
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
});
