# Front Desk

**Primary goal:** Maximize chair utilization and throughput: handle bookings, walk-ins, and payments quickly and accurately.

## Capabilities

**Live calendar management**
- View all staff timelines in one grid (day view, optionally week)
- Create new appointments (phone/in-person), reschedule existing ones (within policy)
- Mark status: `checked_in`, `in_progress`, `completed`, `no_show`, `cancelled`

**Walk-in handling**
- "Quick Add Walk-In": select service, see auto-suggested available staff, assign instantly
- Create or link a client profile on the spot

**Check-in & POS**
- Check clients in for appointments; add retail items to a visit
- Trigger M-Pesa STK push for outstanding deposits/balance at checkout
- Record cash payments and external M-Pesa payments (manual reference entry)
- Issue a digital receipt (in-app/SMS)

**Client basics**
- Create/edit client name, phone, email, simple notes
- Attach reference images provided in-person

**Daily operations**
- End-of-day summary: transactions total, M-Pesa vs. cash breakdown, appointments/walk-ins/no-shows
- Flag double-bookings, system issues, policy exceptions for owner review

## Explicitly NOT allowed

- Cannot change commission structures, pricing, payment destinations, or global business policies
- Cannot view full financial analytics beyond daily operational totals (configurable)
- Cannot view sensitive owner-only reports (e.g. profit margins, platform fees)

## User stories

### F1 — Live calendar
As a front desk, I want a real-time view of all staff schedules, so that I can maximize chair usage and avoid double bookings.

**Acceptance criteria**
- Day view grid: rows = staff, columns = time blocks
- Each appointment shows client name, service, status (confirmed, checked_in, in_progress, completed, no_show, cancelled)
- Tap appointment → details/edit; drag-drop to reschedule (within policy); mark status changes (check-in, start, complete)
- Creating/moving into an occupied slot triggers a warning requiring confirmation or a different slot

### F2 — Walk-ins
As a front desk, I want to add walk-in clients and assign them to available staff in seconds, so that we don't lose spontaneous business.

**Acceptance criteria**
- Prominent "+ Walk-In" button
- Bottom sheet: searchable service selector, optional client phone/name (find existing or create new)
- After service selection: "Available now" staff list (or next available slot per staff if none free)
- Pick staff → confirm assignment
- Appointment appears instantly on calendar as `walk_in` with status `checked_in`/`in_progress` (configurable default)

### F3 — Check-in & checkout (POS)
As a front desk, I want to check clients in and collect payments quickly via M-Pesa or cash, so that checkout is fast and records are accurate.

**Acceptance criteria**
- Completed/ready appointment → "Checkout" screen
- Shows service total, deposit already paid, remaining balance, option to add retail products
- Trigger M-Pesa STK for balance (confirm phone, send STK), payment status updates automatically on success
- Record cash payment (amount received), system calculates change due
- After payment: status → `paid`, digital receipt generated (in-app + optional SMS), transaction appears in end-of-day summary

### F4 — End-of-day summary
As a front desk, I want a simple end-of-day summary of all transactions, so that the owner can reconcile cash and M-Pesa easily.

**Acceptance criteria**
- "Day Summary" (on demand or auto at end of day)
- Totals: appointments, walk-ins, revenue (M-Pesa total, cash total, deposits collected, balance payments collected), no-shows/cancellations
- Add notes (e.g. "KSh 200 short due to change") and submit to owner (triggers notification)
- Owner can view and match against their own records

## Candidate screens

**Tab: Calendar** (`F1`, `F2`)
- **Day Calendar (Grid)** — staff rows × time columns, appointment blocks color-coded by status, current-time indicator line, staff filter/scroll, swipe or arrows to change day; week view as a secondary toggle.
- **Appointment Detail** *(modal/sheet)* — client, service, staff, time, status stepper (check-in → in progress → complete / no-show / cancel), edit/reschedule entry point.
- **Reschedule (drag or form)** — drag-drop on the grid for quick moves; form-based reschedule sheet as fallback with slot picker and conflict warning.
- **Double-Booking Warning** *(inline dialog)* — shown when creating/moving into an occupied slot, "choose another slot" vs. "override" (if permitted).
- **Quick Add Walk-In** *(bottom sheet)* — searchable service picker, client search/create field, "Available now" staff list with next-available fallback, confirm assignment.
- **Client Quick-Create** *(nested modal)* — name, phone, email, notes, attach reference image (camera/gallery).

**Flow: Checkout / POS** (`F3`)
- **Checkout Summary** — service line items, deposit already paid, remaining balance, "Add product" action, running total.
- **Add Retail Product** *(modal)* — searchable product list, quantity, price, add to visit.
- **Payment Method Select** — M-Pesa (STK) vs. Cash tabs/segmented control.
- **M-Pesa STK Pending** — phone confirm, spinner/polling, success/failure/timeout states, manual reference entry fallback for externally-received M-Pesa payments.
- **Cash Payment** — amount received input, auto-calculated change due, confirm.
- **Receipt** — itemized receipt, "Send via SMS" action, done/return-to-calendar.

**Tab: Day Summary** (`F4`)
- **End-of-Day Summary** — totals card (appointments, walk-ins, M-Pesa total, cash total, deposits, balances, no-shows/cancellations), notes field, "Submit to Owner" action.
- **Flag an Issue** *(modal)* — for double-bookings/system issues/policy exceptions, short description + attach appointment reference, sends to owner review queue.
- **Past Summaries** — list of previously submitted day summaries with status (seen/reconciled by owner).
