# Trimyy MVP — Task Tracker

Tracks build progress toward a working end-to-end MVP, ordered by the critical path agreed
in [README.md](README.md): a business must exist → a customer can find and book it → the
business can see and fulfill that booking. Check items off as they land; don't reorder
phases without updating this file so "what's next" stays trustworthy.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Resolved decisions

- **Marketplace visibility** — manual toggle at the end of the onboarding wizard ("Publish to
  marketplace"), not automatic. A solo operator can flip it on immediately after finishing
  Phase 1 with zero staff and one service — onboarding must not block on team setup.
- **Front Desk vs. Staff as the first fulfillment view** — not a build-order pick anymore.
  Onboarding asks the owner directly: *"Are you working solo, or do you have a team?"*
  - **Solo** → owner's own session gets the Staff-style schedule view ([S1](staff.md#s1--daily-schedule));
    no Front Desk session is offered at all.
  - **Team** → owner is prompted to invite a Front Desk user (or self-assign the Front Desk
    role) and gets [F1](front-desk.md#f1--live-calendar) as the fulfillment view.
  This means **both** Phase 4 views are in scope for MVP (gated by this answer), not an
  either/or choice — see updated Phase 4 below.

## Resolved decisions (routing)

- **Navigation library** — migrated from React Navigation's manually-wired `RootNavigator`/
  `RootStackParamList` to **Expo Router** (file-based routing), per team preference for a
  cross-platform-first setup. `App.tsx`, `index.ts`, and `src/navigation/` are gone; the app now
  boots via `app/_layout.tsx` (root layout: fonts, splash, `AuthProvider`, `Stack`).
- **Folder convention** — routes are organized into module route groups under `app/` that mirror
  `src/screens/`, using Expo Router's `(group)` syntax (invisible in the URL, so paths stay flat:
  `/login`, `/business-basics`, etc.):
  - `app/(auth)/` — Welcome (`index`), Login, ForgotPassword, ForgotPasswordVerification, ResetPassword
  - `app/(onboarding)/` — OnboardingVerification, OnboardingMobile, OnboardingName (customer signup)
  - `app/(business)/` — BusinessBasics and future Phase 1 wizard screens (WorkingHours, Services, etc. land here)
  - `app/success.tsx`, `app/get-started.tsx` — shared/cross-module screens stay ungrouped at the `app/` root
  - Each route file is a thin re-export (`export { XScreen as default } from '../../src/screens/...'`) —
    actual screen implementations still live in `src/screens/`, only the routing wrapper moved.
  - Screen components use `useRouter()` / `useLocalSearchParams()` instead of navigation props;
    `router.push({ pathname, params })` for forward nav, `router.back()` for back, and
    `router.dismissAll(); router.replace(path)` for a full stack reset (replaces the old
    `navigation.reset(...)` used after signup/business-creation success).
- **Native modules still require a dev client** — this is unchanged by the router switch.
  `react-native-maps` and `@react-native-community/datetimepicker` are still not in Expo Go;
  Expo Router is only a routing-layer change, orthogonal to that requirement (see the native
  modules note below — keeping these was a deliberate choice, not something the router fixes).

## Codebase audit — current state (as of `e60b0ee`)

Stack: Expo `~57.0.22`, React Native `0.86.3`, React `19.2.3`, TypeScript `~6.0.3` (`strict: true`).

**What exists**
- Auth/onboarding UI shell only: `Welcome`, `Login`, `ForgotPassword` (+ verification, reset),
  `OnboardingVerification` → `OnboardingMobile` → `OnboardingName` → `Success`. All screens are
  mocked — every "submit" is a synchronous `navigation.navigate`, no network calls, no real auth.
- Solid, cohesive design-token system in `src/theme/` (colors, typography, spacing/radii,
  shadows, motion) — already used by every screen, reuse as-is for new UI.
- Reusable primitives in `src/components/`: `Button`, `Input`, `OtpInput`, `PhoneInput`,
  `CountryPicker`, `AuthScreenLayout` (shared screen shell — natural fit for new wizard steps),
  `StepProgressBar`, `BackButton`, `Divider`, hand-drawn SVG icons.
- Navigation: single flat `createNativeStackNavigator` (`src/navigation/RootNavigator.tsx`,
  `initialRouteName="Welcome"`), 9 routes, typed via `RootStackParamList`. No tabs, no
  auth-gated root switch, no per-role navigators yet.

**What's missing (needs to be introduced, not just extended)**
- [ ] **State management** — none installed (no zustand/redux/context beyond local `useState`)
- [ ] **HTTP/backend layer** — none installed, no `.env`, no backend SDK (no Supabase/Firebase),
      no fetch wrapper. Every Phase 1–3 task needs this to do anything beyond local UI state.
- [ ] **Domain types** — no `src/types/` at all; `Business`, `Service`, `Booking`, `User`,
      `Role` etc. only exist as prose in `reference/*.md`
- [ ] **Tab navigation** — `@react-navigation/bottom-tabs` not installed (only `native-stack`);
      needed for per-session tab bars (`colors.tab.*` tokens already exist, unused)
- [ ] **Role/session-gated root navigator** — no logged-out vs. logged-in split, no per-role
      (`owner`/`front_desk`/`staff`/`customer`) navigator switch yet
- [ ] **Date/time picker** — needed for Working Hours (Phase 1) and Select Date & Time (Phase 3)
- [ ] **Maps / location** — no `react-native-maps`; needed for Business Basics location pin
      (Phase 1) and near-me search (Phase 2)
- [ ] Testing (no Jest) and linting/formatting (no ESLint/Prettier) — not blocking, worth
      adding before the codebase grows past the auth shell

## Resolved decisions (cont'd)

- **Backend** — custom REST API (not a BaaS). No backend exists yet, so the app's API layer
  talks to a **mock adapter** returning the dummy data from `reference/api/*.json` until real
  endpoints exist, switched via `EXPO_PUBLIC_API_BASE_URL` (unset = mock mode).
- **State management** — Zustand.
- **Maps** — `react-native-maps`, with `expo-location` for "use current location" + reverse geocoding.
- **Date/time picker** — `@react-native-community/datetimepicker`. Only Working Hours (open/close
  times) needs an actual native picker; the booking date/time screen (Phase 3) is a fully custom
  horizontal scroller + slot grid, not a native-picker use case.
- **Owner vs. customer entry point** — resolved as a **Get Started** screen shown right after
  signup completes (`OnboardingName` → `Success` → `GetStarted`, replacing the old direct-to-`Welcome`
  redirect). It checks for pending team invitations first (join someone else's business as
  staff/front desk) and otherwise offers "Enroll your business today" (→ Business Basics) or
  "Continue browsing" as a customer.

## ⚠️ Native modules now required — Expo Go no longer works for this app

`react-native-maps` and `@react-native-community/datetimepicker` are not included in Expo Go.
Local development now requires a **custom dev client** (`npx expo run:ios` / `npx expo run:android`
once, then `npx expo start --dev-client` day to day). This only means a native rebuild when a
native dependency or `app.json` plugin config changes — ordinary JS/screen changes still hot-reload
instantly through Fast Refresh same as before. `ios/`/`android/` are gitignored; each machine
builds its own dev client locally (or via an EAS dev build later).

## API contracts

[reference/api/](api/README.md) holds machine-readable request/response contracts for the
backend team — one JSON file per phase, e.g. [api/business-setup.json](api/business-setup.json)
for Phase 1. These use dummy example data and should be kept in sync as each phase's screens
firm up; see [api/README.md](api/README.md) for the schema convention.

## Phase 0 — Foundation (in progress)

- [x] Auth screens (login/signup)
- [x] Splash screen
- [x] **Get Started** screen — post-signup hub: pending invitations vs. "enroll your business"
      vs. continue as customer (resolves the owner-vs-customer entry point decision above)
- [ ] Session/role model: user can hold one or more of `owner` / `front_desk` / `staff` /
      `customer`; active-role context available app-wide (needed before role switching in O5,
      but a single hardcoded role is fine to start)
- [ ] Base navigation shell (per-session navigator, swappable root)

## Phase 1 — Business setup ([O1](business-owner.md#o1--business-setup))

Onboarding wizard, one step per screen, save-and-resume, progress indicator:

- [ ] Data model: business, services, policies, payment destinations, `team_mode` (`solo` | `team`)
- [x] **Business Basics**, now split into 4 step screens (`app/(business)/`, progress 1–4/4,
      draft accumulated in `useBusinessOnboardingStore`, submits on the last step):
  - [x] **Business Name** (`/business-name`) — name
  - [x] **Categories** (`/business-categories`) — multi-select
  - [x] **Phone** (`/business-phone`) — business phone
  - [x] **Location** (`/business-location`) — map pin + building/floor/shop-or-office number,
        submits to mock `createBusiness` on continue (creates draft business)
- [ ] **Working Hours** screen — default weekly hours + closed days (holidays/buffer deferred to Settings)
- [ ] **Services** screen — at least 1 service (name, duration, price); more can be added later
- [ ] **Deposit & Cancellation Policy** screen — sensible default pre-filled, one-tap accept or customize
- [ ] **Payment Destination** screen — M-Pesa Till or Paybill; **hard-gate**: cannot publish without this
- [ ] **Solo or Team?** question screen — determines `team_mode`; drives which fulfillment
      session(s) this owner sees (see Phase 4) and whether the Team invite step is shown
- [ ] **Team invite (conditional)** — shown only if `team_mode = team`; invite a Front Desk
      user now or skip and do it later from Settings ([O2](business-owner.md#o2--team-management))
- [ ] **Review & Publish** screen — summary of all steps, manual **"Publish to marketplace"**
      toggle (off by default, owner explicitly flips it on)
- [ ] Changes propagate immediately to the (future) customer-facing profile

## Phase 2 — Discovery ([C1](customer.md#c1--search--discovery))

- [ ] **Home / Discover** screen — search bar, location chip, quick filter chips,
      near-me results
- [ ] **Search Results** screen — list/map toggle, sort, result cards, empty state
- [ ] **Filter Sheet** modal — category, price range, rating, distance
- [ ] **Business Profile** (customer-facing) — photos, services, policies, staff, reviews, map
- [ ] **Staff Profile** (customer-facing) — bio, specialties, services, availability preview

## Phase 3 — Booking flow ([C2](customer.md#c2--booking-flow))

- [ ] M-Pesa STK push integration decision (sandbox vs. provider, shared by C2/F3/O4)
- [ ] **Select Service** screen
- [ ] **Select Staff** screen (incl. "Any available")
- [ ] **Select Date & Time** screen — real availability from Phase 1 working hours + existing bookings
- [ ] **Review & Policies** screen — deposit + cancellation policy summary before payment
- [ ] **Payment Method** screen — M-Pesa phone input, send STK
- [ ] **STK Push Pending** screen — polling, success/failure/timeout
- [ ] **Booking Confirmed** screen
- [ ] Push/SMS/WhatsApp confirmation message on success

## Phase 4 — Fulfillment view (gated by `team_mode` from Phase 1)

`team_mode = solo` → owner sees Staff-style view ([S1](staff.md#s1--daily-schedule)):
- [ ] **Today Timeline** — single-column schedule, live from Phase 3 bookings
- [ ] **Appointment Detail** — client history, preferences, reference images, status stepper

`team_mode = team` → business gets a Front Desk view ([F1](front-desk.md#f1--live-calendar)):
- [ ] **Day Calendar (Grid)** — staff rows × time columns, live from Phase 3 bookings
- [ ] **Appointment Detail** modal — status stepper (check-in → in progress → complete/no-show/cancel)
- [ ] Double-booking warning on create/move

Both are in scope for MVP; build whichever matches the first real test business's
`team_mode`, then build the other before wider rollout.

## Phase 5 — Team management ([O2](business-owner.md#o2--team-management))

- [ ] **Team List** screen
- [ ] **Invite Member** modal — phone/email + role picker
- [ ] **Member Detail / Edit** — services performed, commission split, working schedule
- [ ] Invite flow: SMS/link → first-login password/PIN + profile completion

## MVP done when

- [ ] An owner can set up a business end-to-end (Phase 1)
- [ ] A customer can find that business and complete a paid booking (Phases 2–3)
- [ ] The business side can see and act on that booking (Phase 4)
- [ ] The owner can staff the business with real team members (Phase 5)

## Post-MVP backlog (not sequenced yet)

- Customer: [C3](customer.md#c3--manage-appointments) reschedule/cancel,
  [C4](customer.md#c4--saved-styles--preferences) saved styles,
  [C5](customer.md#c5--reminders) reminders
- Front Desk: [F2](front-desk.md#f2--walk-ins) walk-ins,
  [F3](front-desk.md#f3--check-in--checkout-pos) checkout/POS,
  [F4](front-desk.md#f4--end-of-day-summary) day summary
- Owner: [O3](business-owner.md#o3--performance-dashboard) dashboard,
  [O4](business-owner.md#o4--payout-approval) payouts,
  [O5](business-owner.md#o5--role-switching) role switching
- Staff: [S2](staff.md#s2--earnings-tracking) earnings,
  [S3](staff.md#s3--payout-request) payout request,
  [S4](staff.md#s4--availability) availability
