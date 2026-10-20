import type { ReactNode } from 'react';
import { BellIcon } from '../components/icons/BellIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ChartIcon } from '../components/icons/ChartIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { WalletIcon } from '../components/icons/WalletIcon';
import { colors } from '../theme';

// The icon for a notification type — shared by the inbox rows and the
// in-app toast so the same kind always looks the same.
export function notificationIcon(type: string, size = 18, color = colors.text.primary): ReactNode {
  if (type.startsWith('booking_reminder')) return <ClockIcon size={size} color={color} />;
  if (type.startsWith('booking_')) return <CalendarIcon size={size} color={color} />;
  if (type.startsWith('payout_') || type === 'wallet_adjusted') return <WalletIcon size={size} color={color} />;
  if (type === 'day_summary_submitted') return <ChartIcon size={size} color={color} />;
  if (type === 'team_invitation') return <UsersIcon size={size} color={color} />;
  return <BellIcon size={size} color={color} />;
}
