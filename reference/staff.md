# Staff (Stylist / Therapist / Technician)

**Primary goal:** Know their schedule, deliver services well, and clearly see their earnings.

## Capabilities

**Personal schedule**
- View day/week calendar of own appointments + walk-ins
- Per appointment: client name, service(s), duration, notes/preferences, reference images
- Update status: `ready`, `in_progress`, `completed`

**Client context**
- View client history: past services, preferences, formula notes
- View uploaded reference images for the current booking

**Earnings tracking**
- Real-time "Today's work" value and "Your split" based on commission rules
- View pending earnings (not yet disbursed) and paid-out earnings (history)
- Request day-end payout (triggers owner approval or auto-payout flow)

**Availability**
- Set breaks/off-chair periods during the day
- (Future) Request time off/shift changes for owner approval

## Explicitly NOT allowed

- Cannot see other staff's earnings, full business financials, or global settings
- Cannot change prices, commission rules, payment destinations, or business policies

## User stories

### S1 — Daily schedule
As a staff, I want a clean view of my appointments and walk-ins for the day, so that I know who's next and what service to perform.

**Acceptance criteria**
- Single-column timeline for today; each block = one appointment/walk-in with client name, service, time, status
- Tap block → details: client history (past services here), preferences/notes, reference images, special instructions (e.g. "sensitive scalp", "allergic to X")
- Mark status `in_progress` or `completed`, add quick notes after service (formula used, next recommended service)

### S2 — Earnings tracking
As a staff, I want to see how much I've earned today and in total, so that I know what to expect at payout time.

**Acceptance criteria**
- Header card: "Today's work" (total value of completed services), "Your split" (commission total today), "Paid out" vs. "Pending"
- Earnings update in real time as appointments are marked completed
- View past days' earnings with breakdown by service or day

### S3 — Payout request
As a staff, I want to request my earnings at the end of my shift, so that I get paid quickly and transparently.

**Acceptance criteria**
- "Request Day-End Payout" button (enabled if pending earnings exist)
- Tap → summary (date, total work value, my split, number of services), confirm request
- Request goes to owner's Payouts queue, shows as `pending` in my earnings view
- Once approved and paid: status → `paid`, transaction reference and time shown

### S4 — Availability
As a staff, I want to mark when I'm unavailable (breaks, off-chair), so that front desk doesn't book me when I can't work.

**Acceptance criteria**
- "Availability" panel for today: add unavailable blocks (e.g. 1:00–1:30 PM lunch), remove if plans change
- Marking unavailable shows me as "busy" on the Front Desk calendar; walk-in assignment skips those times
- (Future) request longer time-off (multi-day) for owner approval

## Candidate screens

**Tab: My Chair (schedule)** (`S1`)
- **Today Timeline** — single-column vertical schedule, current-time indicator, appointment blocks (client, service, time, status badge), pull-to-refresh, day switcher (yesterday/today/tomorrow or date picker).
- **Appointment Detail** — client name + history link, service(s) + duration, preferences/notes, reference images (gallery), special instructions callout (allergies, sensitivities), status stepper (ready → in progress → completed).
- **Client History** *(nested)* — past visits with this client (service, date, notes/formula used), read-only reference image gallery.
- **Post-Service Notes** *(modal, on marking completed)* — quick notes field (formula used, next recommended service), optional photo of result.

**Tab: Earnings** (`S2`, `S3`)
- **Earnings Overview** — header card ("Today's work", "Your split", Pending vs. Paid out), list of today's completed services contributing to the total.
- **Earnings History** — calendar/list of past days, breakdown by service or day, tap into a day for its itemized detail.
- **Request Payout** — summary sheet (date, total work value, split, service count), "Request Payout" confirm action.
- **Payout Status** — pending/approved/paid/rejected states, transaction reference + timestamp once paid, rejection reason if applicable.

**Tab / Panel: Availability** (`S4`)
- **Availability (Today)** — timeline with existing unavailable blocks highlighted, "+ Add Break" action, remove/edit existing blocks.
- **Add/Edit Break** *(modal)* — start/end time picker, reason (optional), save/remove.
- **Time-Off Request** *(future, nested)* — multi-day date range picker, reason, submit for owner approval, status tracking.
