# Business Owner

**Primary goal:** Own and control the business: configure operations, monitor performance, manage money, and step into any role when needed.

## Capabilities

**Workspace setup & configuration**
- Create/manage business profile (name, location, branding, contacts)
- Set working hours, holidays, buffer times
- Define services (name, duration, price, category) and pricing rules (e.g. senior stylist surcharge)
- Define deposit rules and cancellation/no-show policies
- Configure payments: M-Pesa Buy Goods Till, M-Pesa Paybill (+ account number), bank account, SACCO shortcode

**Team & roles**
- Invite users: staff, front desk, co-owners/managers
- Assign roles: `owner`, `front_desk`, `staff`
- Per staff member: assign services they can perform, commission split (% or fixed), working schedule

**Financial oversight**
- Dashboards: daily/weekly/monthly revenue; by service, staff, channel; platform fees vs. net revenue
- Payouts: view staff earnings, approve/disburse day-end payouts, configure auto-payout rules
- Analytics: occupancy (chair utilization), no-show/cancellation rates, top services/staff, peak hours

**Marketplace & visibility**
- Toggle business and individual staff visible/invisible on the marketplace
- Set first-time client commission rate, configure promotions/offers (future)

**Role switching**
- Switch UI context to Owner view, Front Desk view, Staff view

## Explicitly NOT allowed / required

- Not required to manually calculate commissions if automation is enabled
- Not required to use separate tools for calendar, payments, and staff tracking
- Not required to handle low-level technical configuration (handled by the platform)

## User stories

### O1 — Business setup
As a business owner, I want to configure my business profile, services, and policies, so that customers see accurate info and my operations run smoothly.

**Acceptance criteria**
- Create/edit business name, logo, description, location(s), contacts, working hours, breaks, holidays
- Define services (name, category, duration, price) and which staff can perform each
- Set deposit rules, cancellation policy, no-show policy
- Configure payment destinations: M-Pesa Buy Goods Till, Paybill + account number, bank account, SACCO shortcode
- Changes reflect immediately on the customer-facing profile

### O2 — Team management
As a business owner, I want to invite staff and front desk users and assign their roles, so that everyone has the right access and responsibilities.

**Acceptance criteria**
- "Team" section: invite by phone/email, assign roles (`owner`, `front_desk`, `staff`)
- Per staff member: services offered, commission split, working schedule (if different from business default)
- Invited users get an invite link/SMS, set password/PIN and complete profile on first login
- Can deactivate/reactivate members and change roles/commissions (with audit log)

### O3 — Performance dashboard
As a business owner, I want a clear dashboard of revenue, occupancy, and team performance, so that I can make data-driven decisions without spreadsheets.

**Acceptance criteria**
- "Overview": today's revenue (total, M-Pesa, cash), WTD/MTD revenue, appointments/walk-ins/no-shows count
- Revenue by service category, by staff member, marketplace vs. direct repeat clients
- Date range selector (today, 7d, 30d, custom) + CSV/PDF export (optional MVP)
- Occupancy metrics: chair utilization % per staff, peak-hours heatmap (later phase)

### O4 — Payout approval
As a business owner, I want to review and approve staff day-end earnings requests, so that payouts are accurate, transparent, and fast.

**Acceptance criteria**
- Notification (push/SMS) when a staff member requests a day-end payout
- "Payouts": staff name, date, total work value, commission split, net amount due, contributing appointments list
- Approve → triggers transfer to staff's registered M-Pesa/bank, updates ledger to `paid`
- Reject (with reason) → returns to staff as "needs review"
- Staff sees status (pending, approved, paid, rejected) and transaction reference once paid

### O5 — Role switching
As a business owner, I want to switch my UI between Owner, Front Desk, and Staff modes, so that I can run the business, cover reception, or work on clients without multiple accounts.

**Acceptance criteria**
- Role switcher: "Business Overview" (Owner), "Reception" (Front Desk), "My Chair" (Staff, if I have a staff profile)
- Switching instantly re-renders the corresponding dashboard, using cached data where possible
- Owner view: analytics, payouts, settings. Front Desk view: calendar, walk-ins, POS. Staff view: personal schedule/earnings
- All actions recorded under my user ID with the active role context

## Candidate screens

**Tab: Overview** (`O3`)
- **Business Overview** — today's revenue card (total / M-Pesa / cash split), appointments/walk-ins/no-shows counters, date-range selector, mini charts for revenue-by-service and revenue-by-staff, "Export" action.
- **Revenue Detail** — full breakdown by service/staff/channel, sortable table or bar chart, drill-down to individual transactions.
- **Occupancy & Analytics** — chair utilization % per staff, no-show/cancellation rate, top services/staff, peak-hours heatmap (phase 2).

**Tab: Payouts** (`O4`)
- **Payouts Queue** — list of pending requests (staff, date, net amount), badge count, filter by status (pending/approved/paid/rejected).
- **Payout Detail** — staff name, work value, commission split, net due, itemized appointment list, Approve/Reject actions.
- **Reject Reason** *(modal)* — text input, confirm.
- **Payout History** — past payouts with status and transaction reference, searchable by staff/date.
- **Auto-Payout Settings** *(nested)* — toggle + rule configuration.

**Tab: Team** (`O2`)
- **Team List** — members grouped by role, status (active/inactive), quick actions (deactivate, edit).
- **Invite Member** *(modal)* — phone/email input, role picker, send invite.
- **Member Detail / Edit** — role, services they perform (multi-select), commission split input, working schedule editor, deactivate action, audit log link.
- **Audit Log** — chronological list of role/commission changes.

**Tab: Business Settings** (`O1`)
- **Business Profile** — name, logo, description, contacts, location(s), edit entry points.
- **Working Hours & Holidays** — weekly hours editor, buffer time input, holiday calendar picker.
- **Services & Pricing** — service list (name, category, duration, price), add/edit service, pricing rule modifiers (e.g. surcharge).
- **Deposit & Cancellation Policy** — deposit rule builder (per service/category), cancellation/no-show fee rules, plain-language preview shown to customers.
- **Payment Destinations** — M-Pesa Till, Paybill + account, bank account, SACCO shortcode forms with verification states.
- **Marketplace Visibility** — business visible/invisible toggle, per-staff visibility toggles, first-time-client commission rate, promotions (future).

**Role switcher** (`O5`, global, not a tab)
- **Role Switch Sheet** *(modal)* — "Business Overview" / "Reception" / "My Chair" options, only shown if the owner also holds those role profiles; switching swaps the active tab bar/navigator without re-authentication.
