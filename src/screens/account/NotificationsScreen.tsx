import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { SwipeRow } from '../../components/ui/SwipeRow';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { BellIcon } from '../../components/icons/BellIcon';
import { SettingsIcon } from '../../components/icons/SettingsIcon';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { applyModeForNotification, routeForNotification } from '../../utils/pushNotifications';
import { notificationIcon } from '../../utils/notificationIcon';
import { showApiError } from '../../utils/showApiError';
import type { AppNotification } from '../../types/notification';
import { colors, radii, spacing, typography } from '../../theme';

type Filter = 'all' | 'unread';

type Section = { title: string; data: AppNotification[] };

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Today / Yesterday / Earlier, keeping the server's newest-first order.
function groupByDay(notifications: AppNotification[]): Section[] {
  const today = startOfDay(new Date());
  const groups: Record<string, AppNotification[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of notifications) {
    const day = startOfDay(new Date(n.createdAt));
    const key = day >= today ? 'Today' : day >= today - DAY_MS ? 'Yesterday' : 'Earlier';
    groups[key].push(n);
  }
  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

// Relative within today ("5m ago"), clock time for yesterday (the section
// header already says which day), date beyond that.
function formatWhen(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (startOfDay(date) >= startOfDay(new Date())) {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
  if (startOfDay(date) >= startOfDay(new Date()) - DAY_MS) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// One inbox for the signed-in user across every app mode — a staff
// assignment shouldn't hide just because they're browsing as a customer.
// Tapping a row marks it read and opens the same screen its push would,
// switching app mode first (utils/pushNotifications).
export function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const nextCursor = useNotificationsStore((s) => s.nextCursor);
  const loadNotifications = useNotificationsStore((s) => s.loadNotifications);
  const loadMoreNotifications = useNotificationsStore((s) => s.loadMoreNotifications);
  const markReadNow = useNotificationsStore((s) => s.markReadNow);
  const markAllReadNow = useNotificationsStore((s) => s.markAllReadNow);
  const removeNow = useNotificationsStore((s) => s.removeNow);

  const [filter, setFilter] = useState<Filter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setIsRefreshing(true);
      try {
        await loadNotifications(filter === 'unread');
      } catch (err) {
        showApiError("Couldn't load notifications", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filter, loadNotifications],
  );

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load]),
  );

  const handleChangeFilter = (next: Filter) => {
    if (next === filter) return;
    setIsLoading(true);
    setFilter(next);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await loadMoreNotifications(filter === 'unread');
    } catch {
      // Scrolling to the end again retries.
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllReadNow();
    } catch (err) {
      showApiError("Couldn't mark notifications as read", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleOpen = (notification: AppNotification) => {
    markReadNow(notification.notificationId);
    const route = routeForNotification({ ...notification.data, type: notification.type });
    if (!route) return;
    applyModeForNotification(notification.type);
    router.push(route);
  };

  const sections = useMemo(() => groupByDay(notifications), [notifications]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/account/notifications')}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Notification settings"
        >
          <SettingsIcon size={18} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterTabs}>
          <SegmentedTabs<Filter>
            options={[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread', badge: unreadCount > 0 ? unreadCount : undefined },
            ]}
            value={filter}
            onChange={handleChangeFilter}
          />
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead} disabled={isMarkingAll} hitSlop={8}>
            <Text style={[styles.markAllLink, isMarkingAll && styles.markAllLinkDisabled]}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load('refresh')} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          renderItem={({ item }) => (
            // Swipe for Read / Delete.
            <SwipeRow
              actions={[
                ...(item.readAt
                  ? []
                  : [{ key: 'read', label: 'Read', color: colors.text.secondary, onPress: () => markReadNow(item.notificationId) }]),
                {
                  key: 'delete',
                  label: 'Delete',
                  color: colors.feedback.danger,
                  onPress: () => removeNow(item.notificationId).catch((err) => showApiError("Couldn't delete it", err)),
                },
              ]}
            >
              <NotificationRow notification={item} onPress={() => handleOpen(item)} />
            </SwipeRow>
          )}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footerLoading} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <BellIcon size={26} color={colors.text.secondary} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {filter === 'unread'
                  ? 'New booking updates, reminders and payouts will show up here.'
                  : 'Booking updates, reminders and payouts will show up here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const unread = !notification.readAt;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${notification.title}. ${notification.body}`}
    >
      <View style={[styles.rowIcon, unread && styles.rowIconUnread]}>{notificationIcon(notification.type)}</View>
      <View style={styles.rowContent}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.rowTime}>{formatWhen(notification.createdAt)}</Text>
        </View>
        <Text style={styles.rowBody} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  markAllLink: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  markAllLinkDisabled: {
    opacity: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  filterTabs: {
    flex: 1,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    backgroundColor: colors.background.primary, // covers the swipe actions
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  rowUnread: {
    backgroundColor: colors.background.secondary,
  },
  rowPressed: {
    backgroundColor: colors.background.tertiary,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  rowIconUnread: {
    backgroundColor: colors.background.primary,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  rowTitleUnread: {
    ...typography.label,
    fontSize: 15,
    lineHeight: 21,
  },
  rowTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  rowBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.sm,
    backgroundColor: colors.brand.pink,
  },
  footerLoading: {
    marginVertical: spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
