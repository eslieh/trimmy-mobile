import type { AppNotification } from '../../types/notification';

// Seed for the inbox while USE_MOCK_NOTIFICATIONS is on: one of each kind
// across every app mode, spread over the last few days so the Today /
// Yesterday / Earlier sections all show. Ids in `data` are placeholders, so
// tapping a row opens its screen but that screen may find nothing.
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function buildMockNotifications(): AppNotification[] {
  return [
    {
      notificationId: 'ntf_mock_1',
      type: 'booking_reminder_2h',
      title: 'See you at 4:30 PM',
      body: 'Your haircut at Kinky Studio starts in 2 hours.',
      data: { bookingId: 'booking_mock_1', businessId: 'biz_mock_1' },
      createdAt: minutesAgo(4),
      readAt: null,
    },
    {
      notificationId: 'ntf_mock_2',
      type: 'booking_created',
      title: 'New booking',
      body: 'Amina W. booked Braids · Tue 21 Oct, 10:00 AM.',
      data: { bookingId: 'booking_mock_2', businessId: 'biz_mock_1' },
      createdAt: minutesAgo(38),
      readAt: null,
    },
    {
      notificationId: 'ntf_mock_3',
      type: 'payout_requested',
      title: 'Payout request',
      body: 'Wanjiku requested KSh 1,200 from their wallet.',
      data: { payoutId: 'payout_mock_1', businessId: 'biz_mock_1' },
      createdAt: minutesAgo(95),
      readAt: null,
    },
    {
      notificationId: 'ntf_mock_4',
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      body: 'Deposit of KSh 300 received. Ref BK7Q2M4X.',
      data: { bookingId: 'booking_mock_1', businessId: 'biz_mock_1' },
      createdAt: minutesAgo(60 * 5),
      readAt: minutesAgo(60 * 5 - 2),
    },
    {
      notificationId: 'ntf_mock_5',
      type: 'booking_assigned',
      title: 'New appointment for you',
      body: 'Beard trim with Brian O. · Wed 22 Oct, 2:00 PM.',
      data: { bookingId: 'booking_mock_3', businessId: 'biz_mock_1' },
      createdAt: minutesAgo(60 * 26),
      readAt: null,
    },
    {
      notificationId: 'ntf_mock_6',
      type: 'payout_responded',
      title: 'Payout sent',
      body: 'Kinky Studio marked your KSh 800 payout as paid.',
      data: { payoutId: 'payout_mock_2', businessId: 'biz_mock_1' },
      createdAt: minutesAgo(60 * 30),
      readAt: minutesAgo(60 * 29),
    },
    {
      notificationId: 'ntf_mock_7',
      type: 'day_summary_submitted',
      title: 'Day summary',
      body: 'Front desk submitted Saturday’s summary: 14 visits, KSh 18,400.',
      data: { businessId: 'biz_mock_1', date: '2026-10-18' },
      createdAt: minutesAgo(60 * 50),
      readAt: minutesAgo(60 * 48),
    },
    {
      notificationId: 'ntf_mock_8',
      type: 'booking_cancelled_by_business',
      title: 'Appointment cancelled',
      body: 'Glow Spa cancelled your massage on Fri 17 Oct. Your KSh 500 deposit will be refunded.',
      data: { bookingId: 'booking_mock_4', businessId: 'biz_mock_2' },
      createdAt: minutesAgo(60 * 80),
      readAt: minutesAgo(60 * 79),
    },
  ];
}
