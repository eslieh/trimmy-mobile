import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../Button';
import { addServiceToVisit, chargeVisit } from '../../api/visits';
import { ApiError, getApiErrorCode, getApiErrorMessage } from '../../api/client';
import { ChargeFailedError } from '../../api/booking';
import { depositFailureMessage } from '../../utils/depositPayment';
import { splitTip, type TipMode } from '../../utils/tipSplit';
import { colors, radii, spacing, typography } from '../../theme';
import type { Booking, Visit } from '../../types/booking';
import type { BusinessContext } from '../../hooks/useBusinessContext';

// Visits on the business side: a customer having hair done wants nails too,
// maybe by someone else. Add the service, see the visit's parts, and check it
// all out in one payment with the tip split the way the customer wants.

const TIP_PRESETS = [0, 100, 200, 500];
const money = (amount: number) => `KSh ${amount.toLocaleString('en-US')}`;

// ─── The visit's parts ───────────────────────────────────────

export function VisitPartsCard({ visit, currentBookingId, onOpen }: { visit: Visit; currentBookingId: string; onOpen: (bookingId: string) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>This visit</Text>
      {visit.bookings.map((b) => {
        const current = b.bookingId === currentBookingId;
        return (
          <Pressable
            key={b.bookingId}
            disabled={current}
            onPress={() => onOpen(b.bookingId)}
            style={[styles.partRow, current && styles.partRowCurrent]}
          >
            <View style={styles.flex1}>
              <Text style={styles.partName} numberOfLines={1}>
                {b.services.map((s) => s.name).join(', ')}
              </Text>
              <Text style={styles.partMeta}>
                {b.staffName} · {b.time}
                {current ? ' · this one' : ''}
              </Text>
            </View>
            <Text style={styles.partAmount}>{money(b.totalAmount.amount)}</Text>
          </Pressable>
        );
      })}
      <View style={styles.totalRow}>
        <Text style={styles.partMeta}>Visit total</Text>
        <Text style={styles.partAmount}>{money(visit.total.amount)}</Text>
      </View>
    </View>
  );
}

// ─── Add a service ───────────────────────────────────────────

export function AddServiceSheet({
  visible, booking, business, onClose, onDone,
}: { visible: boolean; booking: Booking; business: BusinessContext | null; onClose: () => void; onDone: (visit: Visit) => void }) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [start, setStart] = useState<'now' | 'after'>('now');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nextFree, setNextFree] = useState<string | null>(null);

  const submit = async (at?: string) => {
    if (!serviceId || !staffId || saving) return;
    setSaving(true);
    setError('');
    setNextFree(null);
    try {
      const visit = await addServiceToVisit(booking.bookingId, at ? { serviceId, staffId, start: 'at', time: at } : { serviceId, staffId, start });
      onDone(visit);
      onClose();
    } catch (err) {
      if (getApiErrorCode(err) === 'slot_unavailable') {
        const free = err instanceof ApiError ? ((err.body?.nextFreeAt as string | null | undefined) ?? null) : null;
        setNextFree(free);
        setError(free ? `They're busy then. Free from ${free}.` : "They're busy for the rest of today. Choose someone else.");
      } else {
        setError(getApiErrorMessage(err, "Couldn't add the service."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Add a service</Text>
          <Text style={styles.hint}>For {booking.customerName}, on the same visit: paid together at checkout.</Text>
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetBody}>
            <Text style={styles.label}>Service</Text>
            <View style={styles.pills}>
              {(business?.services ?? []).map((s) => (
                <Pill key={s.serviceId} label={`${s.name} · ${money(s.price.amount)}`} selected={serviceId === s.serviceId} onPress={() => setServiceId(s.serviceId)} />
              ))}
            </View>
            <Text style={styles.label}>Who does it</Text>
            <View style={styles.pills}>
              {(business?.staff ?? []).map((m) => (
                <Pill key={m.staffId} label={m.staffId === booking.staffId ? `${m.name} (same)` : m.name} selected={staffId === m.staffId} onPress={() => setStaffId(m.staffId)} />
              ))}
            </View>
            <Text style={styles.label}>When</Text>
            <View style={styles.pills}>
              <Pill label="Now, alongside" selected={start === 'now'} onPress={() => setStart('now')} />
              <Pill label="Right after this" selected={start === 'after'} onPress={() => setStart('after')} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          {nextFree ? <Button label={`Start at ${nextFree}`} variant="secondary" onPress={() => submit(nextFree)} disabled={saving} /> : null}
          <Button label={saving ? 'Adding…' : 'Add to visit'} variant="accent" onPress={() => submit()} disabled={!serviceId || !staffId || saving} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Check the visit out ─────────────────────────────────────

export function VisitCheckoutSheet({
  visible, visit, defaultPhone, onClose, onDone,
}: { visible: boolean; visit: Visit; defaultPhone: string; onClose: () => void; onDone: (visit: Visit) => void }) {
  const [method, setMethod] = useState<'mpesa' | 'cash'>('mpesa');
  const [phone, setPhone] = useState(defaultPhone);
  const [mode, setMode] = useState<TipMode>('even');
  const [tipPreset, setTipPreset] = useState(0);
  const [tipOther, setTipOther] = useState('');
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [onlyReady, setOnlyReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const charging = useMemo(() => {
    const unpaid = visit.bookings.filter((b) => b.paymentStatus !== 'paid' && b.status !== 'cancelled' && b.status !== 'no_show');
    return onlyReady ? unpaid.filter((b) => visit.chargeableBookingIds.includes(b.bookingId)) : unpaid;
  }, [visit, onlyReady]);
  const people = useMemo(() => {
    const byStaff = new Map<string, { staffId: string; name: string; value: number }>();
    for (const b of charging) {
      if (!b.staffId) continue;
      const row = byStaff.get(b.staffId) ?? { staffId: b.staffId, name: b.staffName, value: 0 };
      row.value += b.totalAmount.amount;
      byStaff.set(b.staffId, row);
    }
    return [...byStaff.values()];
  }, [charging]);

  const balance = charging.reduce((sum, b) => sum + (b.balanceDue?.amount ?? 0), 0);
  const tipTotal =
    mode === 'custom'
      ? people.reduce((sum, p) => sum + (Number(custom[p.staffId]) || 0), 0)
      : tipOther
        ? Number(tipOther) || 0
        : tipPreset;
  const shares: Record<string, number> =
    mode === 'custom' ? Object.fromEntries(people.map((p) => [p.staffId, Number(custom[p.staffId]) || 0])) : splitTip(tipTotal, people, mode);
  const total = balance + tipTotal;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const done = await chargeVisit(visit.visitId, {
        method,
        phone: method === 'mpesa' ? phone : undefined,
        tips: people.map((p) => ({ staffId: p.staffId, amount: shares[p.staffId] ?? 0 })),
        bookingIds: onlyReady ? charging.map((b) => b.bookingId) : undefined,
      });
      onDone(done);
      onClose();
    } catch (err) {
      if (err instanceof ChargeFailedError) setError(`${depositFailureMessage(err.failureReason)} Try again or take cash.`);
      else if (getApiErrorCode(err) === 'visit_not_ready') {
        setOnlyReady(true);
        setError("Some services haven't started. Charging what's done now; the rest can be paid later.");
      } else setError(getApiErrorMessage(err, "Couldn't charge the customer."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? undefined : onClose}>
      <Pressable style={styles.overlay} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Check out the visit</Text>
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            {charging.map((b) => (
              <View key={b.bookingId} style={styles.lineRow}>
                <Text style={[styles.partMeta, styles.flex1]} numberOfLines={1}>
                  {b.services.map((s) => s.name).join(', ')} · {b.staffName}
                </Text>
                <Text style={styles.partAmount}>{money(b.balanceDue?.amount ?? b.totalAmount.amount)}</Text>
              </View>
            ))}
            {visit.notReady.length && !onlyReady ? (
              <Pressable onPress={() => setOnlyReady(true)}>
                <Text style={styles.warning}>
                  Not started: {visit.notReady.map((n) => n.staffName).join(', ')}. Tap to charge what's done now.
                </Text>
              </Pressable>
            ) : null}

            <Text style={styles.label}>Payment</Text>
            <View style={styles.pills}>
              <Pill label="M-Pesa" selected={method === 'mpesa'} onPress={() => setMethod('mpesa')} />
              <Pill label="Cash" selected={method === 'cash'} onPress={() => setMethod('cash')} />
            </View>
            {method === 'mpesa' ? (
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712 345 678" placeholderTextColor={colors.text.tertiary} />
            ) : null}

            {people.length ? (
              <>
                <Text style={styles.label}>Tip (optional)</Text>
                <View style={styles.pills}>
                  <Pill label="Evenly" selected={mode === 'even'} onPress={() => setMode('even')} />
                  <Pill label="By service" selected={mode === 'value'} onPress={() => setMode('value')} />
                  <Pill label="Custom" selected={mode === 'custom'} onPress={() => setMode('custom')} />
                </View>
                {mode !== 'custom' ? (
                  <View style={styles.pills}>
                    {TIP_PRESETS.map((a) => (
                      <Pill key={a} label={a === 0 ? 'None' : String(a)} selected={!tipOther && tipPreset === a} onPress={() => { setTipOther(''); setTipPreset(a); }} />
                    ))}
                    <TextInput
                      style={[styles.input, styles.tipOther]}
                      value={tipOther}
                      onChangeText={(t) => setTipOther(t.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      placeholder="Other"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>
                ) : null}
                {people.map((p) => (
                  <View key={p.staffId} style={styles.lineRow}>
                    <Text style={[styles.partName, styles.flex1]}>{p.name}</Text>
                    {mode === 'custom' ? (
                      <TextInput
                        style={[styles.input, styles.tipInput]}
                        value={custom[p.staffId] ?? ''}
                        onChangeText={(t) => setCustom((c) => ({ ...c, [p.staffId]: t.replace(/\D/g, '').slice(0, 6) }))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.text.tertiary}
                      />
                    ) : (
                      <Text style={styles.partAmount}>{money(shares[p.staffId] ?? 0)}</Text>
                    )}
                  </View>
                ))}
                <Text style={styles.hint}>Each share goes to that person's wallet.</Text>
              </>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          {busy && method === 'mpesa' ? (
            <View style={styles.waiting}>
              <ActivityIndicator color={colors.brand.pink} />
              <Text style={styles.hint}>One prompt sent. Waiting for their PIN…</Text>
            </View>
          ) : null}
          <Button
            label={busy ? 'Charging…' : method === 'mpesa' ? `Send one prompt · ${money(total)}` : `Record cash · ${money(total)}`}
            variant="accent"
            onPress={submit}
            disabled={busy || charging.length === 0}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillSelected]}>
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.label, color: colors.text.primary, letterSpacing: 0.4 },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  partRowCurrent: { backgroundColor: colors.brand.accentSoft },
  partName: { ...typography.bodyMedium, color: colors.text.primary },
  partMeta: { ...typography.caption, color: colors.text.secondary },
  partAmount: { ...typography.label, color: colors.text.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.xs },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
    maxHeight: '88%',
  },
  sheetScroll: { flexGrow: 0 },
  sheetBody: { gap: spacing.md, paddingBottom: spacing.md },
  sheetTitle: { ...typography.h2, color: colors.text.primary },
  label: { ...typography.label, color: colors.text.primary, marginTop: spacing.xs },
  hint: { ...typography.caption, color: colors.text.secondary },
  warning: { ...typography.caption, color: colors.feedback.warning },
  error: { ...typography.caption, color: colors.feedback.danger },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background.tertiary,
  },
  pillSelected: { backgroundColor: colors.text.primary },
  pillText: { ...typography.label, color: colors.text.primary },
  pillTextSelected: { color: colors.white },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tipOther: { minWidth: 90 },
  tipInput: { width: 100, textAlign: 'right' },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
