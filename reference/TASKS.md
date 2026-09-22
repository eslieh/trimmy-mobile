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

- **Backend** — custom REST API (not a BaaS). No backend fully implements our contracts yet, so
  the app's API layer talks to a **mock adapter** returning the dummy data from
  `reference/api/*.json`, switched via the flat `USE_MOCK_API` constant in `src/config/env.ts`
  (**not** derived from whether an API URL is configured — `.env.development/.staging/.production`
  always set a real URL now, so "URL present" stopped being a valid mock/real signal a while back).
  **2026-09-22 incident**: someone flipped `USE_MOCK_API` to `false` assuming staging was fully
  live; in practice dev builds load `.env.development`, which points at `http://localhost:8001`
  (not staging) — every request failed with "Could not connect to the server." Reverted to `true`.
  Before flipping again: (1) point `.env.development` at a URL that's actually reachable from
  wherever you're testing (staging URL, or a real local server), and (2) confirm the backend
  implements every endpoint in `reference/api/*.json` — Discovery's `search-businesses`/
  `get-business-profile` especially are brand-new contracts from this session, unlikely to exist
  on any real backend yet.
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

`react-native-maps`, `@react-native-community/datetimepicker`, `expo-image-picker` (Photos step),
and `expo-blur` (glassmorphic tab bar) are not included in Expo Go. Local development now requires
a **custom dev
client** (`npx expo run:ios` / `npx expo run:android` once, then `npx expo start --dev-client` day
to day). This only means a native rebuild when a native dependency or `app.json` plugin config
changes — ordinary JS/screen changes still hot-reload instantly through Fast Refresh same as
before. `ios/`/`android/` are gitignored; each machine builds its own dev client locally (or via
an EAS dev build later).

Also note: installing `expo-image-picker` required `npm install ... --legacy-peer-deps` — there's
a pre-existing, unrelated peer-dependency conflict in the tree (an optional `react-dom` peer
pulled in transitively by `expo-router`'s web support, not a direct project dependency). Any
future `npm install` that hits an ERESOLVE error from this should use the same flag rather than
`--force`; it doesn't indicate an actual problem with the packages being installed.

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

11-step wizard, all in `app/(business)/`, progress shown out of 11, draft accumulated in
`useBusinessOnboardingStore`:

- [x] **Business Basics** (steps 1–4, submits on step 4):
  - [x] **Business Name** (`/business-name`, 1/11) — name
  - [x] **Categories** (`/business-categories`, 2/11) — multi-select
  - [x] **Phone** (`/business-phone`, 3/11) — business phone
  - [x] **Location** (`/business-location`, 4/11) — map pin + building/floor/shop-or-office number,
        submits to mock `createBusiness` on continue (creates draft business)
- [x] **Photos** (`/business-photos`, 5/11) — grid picker via `expo-image-picker`, first photo
      picked = cover/thumbnail (badged), requires at least one; uploads via mock
      `uploadBusinessPhoto` (real contract is `multipart/form-data`, not JSON — see
      `reference/api/business-setup.json#upload-business-photo`). Added because Phase 2 Discovery
      needs a thumbnail per business — there was no way to add one before this
- [x] **Working Hours** (`/business-hours`, 6/11) — 7-day open/closed toggle list with a sensible
      09:00–19:00/20:00 default, native time pickers, submits via mock `setWorkingHours`
- [x] **Services** (`/business-services`, 7/11) — two-level tree: owner-defined service categories
      (e.g. "Haircuts", "Coloring") each containing services (name, duration, price). Add-category
      and add-service bottom sheets; requires at least one service total. Submits on continue via
      mock `createServiceCategory` + `createService` per category/service
      (see `reference/api/business-setup.json#create-service-category`/`#create-service` — note
      `Service.categoryId` now references an owner-defined `ServiceCategory`, not the business's
      own marketplace `BusinessCategory`)
- [x] **Deposit & Cancellation Policy** (`/business-policies`, 8/11) — pre-filled default (no
      deposit, 24h free cancellation, 50% late fee, 100% no-show fee), one-tap accept or
      customize (deposit required toggle + fixed/percent type, editable hours/percentages),
      submits via mock `setPolicies`
- [x] **Payment Destination** (`/business-payment`, 9/11) — M-Pesa Till, M-Pesa Paybill, or direct
      Bank Account (picker of 10 Kenyan banks with their paybill-style shortcodes, `src/data/kenyaBanks.ts`),
      submits via mock `setPaymentDestination`
- [x] **Solo or Team?** (`/business-team-mode`, 10/11) — two selectable cards ("Just me" /
      "I have a team"), submits via mock `setTeamMode`; determines `team_mode`, which will
      drive which fulfillment session(s) this owner sees (Phase 4). If "Team" is chosen, continues
      to Team invite below; if "Solo", skips straight to Review & Publish
- [x] **Team invite** (`/business-team-invite`, 10.5/11, conditional — only reached when
      `team_mode = team`) — invite by email or phone, choose role (Front Desk or Staff), send
      multiple invites via a bottom-sheet form; sent list shown on the page; Continue always
      enabled (skippable, per spec). Submits each invite immediately via mock `inviteTeamMember`
      ([O2](business-owner.md#o2--team-management))
- [x] **Review & Publish** (`/business-review`, 11/11) — **last piece of Phase 1, wizard is now
      fully wired end to end**. Summary cards (photos, name/categories/phone/location, hours,
      services, policy, payment, team), client-side hard-gate (checks workingHours set, ≥1
      service, policies set, payment `verificationStatus === 'verified'` before allowing the
      toggle — mirrors the real backend's 422 `incomplete_setup` gate on `publish-business`,
      though in practice every prior step is mandatory so this never actually blocks yet),
      manual **"Publish to marketplace"** toggle (off by default). Publishing calls mock
      `publishBusiness`; saving as a draft (toggle off) makes no API call at all — nothing to
      publish yet
- [x] Every step from Business Basics through Review & Publish now chains together — no more
      steps dead-ending at a temporary Success screen

## Phase 2 — Discovery ([C1](customer.md#c1--search--discovery))

New mock domain: since business onboarding's mock calls are stateless (nothing persists across
app reloads), `src/api/mock/discoveryData.ts` seeds 6 dummy published businesses (Nairobi
salons/barbershops/spas) to search over — a real backend would query its published-businesses
table instead. See `reference/api/discovery.json` (`search-businesses`, `get-business-profile`).

**Redesigned after reviewing Fresha's UX** (real competitor, mature product) — introduced the
customer session's tab bar shell. Initially split Home vs. Search like Fresha does; tried it, then
unified them back into one Explore tab per feedback (see below) — Wishlist got promoted to a tab
in the same pass.

- [x] **Tab bar shell** (`app/(tabs)/_layout.tsx`, expo-router's `<Tabs>` — no
      `@react-navigation/bottom-tabs` needed, modern expo-router ships its own tabs primitive) —
      **Explore / Wishlist / Activity / Profile**, in that order. Business Profile
      (`/business/[businessId]`) lives outside the tabs group so pushing to it slides over and
      hides the tab bar, same as Fresha. **Style, tried twice**: first built as a floating pill
      (absolutely positioned, side/bottom margins, rounded, shadow) — replaced per feedback with a
      **docked full-width bar** (not `position: absolute`), flush with the bottom edge, Airbnb-style:
      the frosted `expo-blur` `BlurView` background (`tabBarBackground` option) extends through the
      home-indicator safe area itself rather than sitting above a gap. Because it's docked (not
      absolute), the tab navigator reserves its own layout space automatically — screens no longer
      need manual bottom padding for it (the earlier `TAB_BAR_CLEARANCE` constant/file was removed;
      tab screens use `edges={['top']}` on their `SafeAreaView`, not `['top','bottom']`, since the
      bar itself now owns the bottom safe area)
- [x] **Icon convention** — swept the app for emoji/raw-glyph UI (📍 location, ★ rating, ✓/×
      checkmarks) and replaced with proper SVG icon components matching the existing hand-drawn
      icon style: `LocationPinIcon`, `StarIcon`, `CheckmarkIcon` (distinct from the existing
      circular-badge `CheckIcon`), `CloseIcon`. New shared `RatingLabel` component (star + "4.7
      (128)") replaces the inline `★ {rating}` pattern that had been duplicated across 5 places.
      Country flags in `CountryPicker` are intentionally left as emoji (no reasonable icon
      alternative for 200+ countries) — everything else should use a real icon going forward, not
      an emoji
- [x] **Explore** (`/explore`, tab — first tab) — **third iteration**, redesigned again after
      reviewing Airbnb's home + Fresha's search sheet. History: (1) separate Home/Search screens
      mirroring Fresha exactly, (2) unified into one screen with an always-visible editable search
      input, (3) **current**: Airbnb-style — a *tappable* search pill (not inline-editable) that
      opens `SearchSheet` (below), quick category filter pills, and a sectioned browse view
      ("Recently viewed" + "Recommended", horizontal `BusinessResultCard` carousels, "Guest
      favorite" badge for rating ≥4.7 — renamed from "Best in Class" to match Airbnb's wording)
      shown when no search is active. Once a search is active (query or category set, from either
      the pill/sheet or a quick category chip), the sections give way to a flat vertical results
      list with an inline favorite-heart per row and an X button to clear back to browse mode
- [x] **Recently viewed** — new `useRecentlyViewedStore` (client-only, in-memory, most-recent-first,
      capped at 10). `BusinessProfileScreen` records a view on mount; `getBusinessesByIds` in
      `src/api/discovery.ts` re-fetches and re-orders to match (not a distinct backend endpoint —
      just `search-businesses` with no filters, filtered/reordered client-side)
- [x] **SearchSheet** (`src/screens/customer/SearchSheet.tsx`, modal, Fresha-inspired) — stacked
      query input + location row, "Recents" (new `useRecentSearchesStore`, client-only, capped at
      5, only non-empty text queries recorded) with a Clear link, a 2-column category grid, and a
      full-width Search button. This is genuinely a separate, dedicated search *experience* now,
      not just an inline text field
- [ ] **Search Results** map/sort — list/map toggle, sort control (distance/price/rating) —
      Explore's active-search results list covers the filtered-list part but not map view or sort
- [ ] **Filter Sheet** modal — price range slider, rating minimum, distance radius (category is
      already a quick filter chip, both on Explore and in SearchSheet's category grid;
      price/rating/distance aren't filterable yet)
- [x] **Explore polish pass**: `BusinessResultCard` reworked to be flex-based (`flex: 1` +
      `aspectRatio: 1` image) instead of a fixed 220px width, so it works correctly in a real
      2-column grid — used by both Explore's browse sections (`FlatList numColumns={2}
      scrollEnabled={false}` per section, nested in a `ScrollView`, replacing the earlier
      horizontal-carousel-per-section layout) and Wishlist's grid. Dropped the "Guest favorite"
      badge entirely (no `badge` prop on `BusinessResultCard` anymore). Section titles now
      `typography.h3` instead of `h2` — less dominant, closer to Airbnb's actual proportions
- [x] **Wishlist** (`/wishlist`, tab — promoted from a Profile row to its own tab) — client-only
      favoriting via `useFavoritesStore` (in-memory `Set<businessId>`, resets on app restart — no
      backend endpoint exists for this yet), heart icon on Explore's result rows and
      `BusinessResultCard` toggles it, this screen lists favorited businesses in a 2-column grid
- [x] **Activity** (`/activity`, tab) — empty state only ("No appointments yet" + "Find a
      business"); real content needs Phase 3 (booking) to exist
- [x] **Profile** (`/profile`, tab) — real logged-in user's name/email via `AuthContext`, grouped
      settings-style rows (Profile/Messages/My appointments/Forms/Settings, Support/Language),
      **working Log out** (calls real `logout()`, resets to Welcome). Favourites row removed —
      Wishlist is a primary tab now, keeping it as a Profile row too would be redundant. Only My
      appointments actually navigates anywhere; the rest are placeholder rows
- [x] **Business Profile** (`/business/[businessId]`, now `[businessId]/index.tsx` — see routing
      note below — customer-facing) — Fresha-style full-bleed **photo pager hero** (edge-to-edge,
      bleeds under the status bar; translucent back/share/favorite circle buttons overlaid; a
      "2/8"-style page counter badge), rounded-top content sheet overlapping the hero with name,
      categories, rating, address row (pin icon), **About/description** (see Business Basics note
      below), plain-language deposit/cancellation summary, a **Services summary card** (count +
      category count, or live cart summary once something's selected) linking to the new dedicated
      Services screen, **staff list with avatars** (`Avatar` — photo if `staffMember.avatarUrl` is
      set, else deterministic initials-on-color placeholder; no mock staff have real photos yet, so
      today this is all placeholders), reviews. Footer CTA is now **cart-aware**: "See all services"
      when the per-business cart is empty, "Continue · N services · KSh total" once something's
      added. **Still a single long scroll below the hero** — not yet restructured into Fresha-style
      segmented tabs (About/Services/Team/Reviews/Other); still the next step, see below
- [x] **Business Services** (`/business/[businessId]/services`, customer-facing, new) — full
      service list grouped by category with an Add/stepper control per service and a sticky
      checkout-summary footer once anything's selected ("N services · KSh total" + Continue).
      "Continue" clears the cart and routes to the shared Success-screen stub, same as the old
      "Book now" button did — Phase 3's real booking/checkout flow doesn't exist yet
- [x] **Per-business cart** (`useCartStore`) — client-only, in-memory, one business at a time
      (adding a service from a different business than the one already in the cart replaces it
      rather than merging — Trimmy doesn't support cross-business checkout). Drives both the
      Services screen's steppers and the Business Profile footer/services-card summary
- [x] **Routing**: `app/(discover)/business/[businessId].tsx` → `[businessId]/index.tsx` (moved,
      not renamed) so the new `[businessId]/services.tsx` sibling route could exist without a
      file/folder name collision. `/business/${id}` links elsewhere (Explore, Wishlist) are
      unaffected
- [ ] **Staff Profile** (customer-facing) — bio, specialties, services they perform, availability
      preview, "Book with [name]" CTA — not built; Business Profile's staff rows (now with avatars)
      still don't tap through anywhere
- [ ] **Business Profile tabbed redesign** (next up) — restructure the single-scroll profile below
      the hero into Fresha's segmented in-page tabs (About / Services / Team / Reviews / Other),
      plus live open/closed status next to rating, category-pill filtering within Services, an
      embedded map (react-native-maps already installed) + amenities list + "Venues nearby" in Other

**Business Basics wizard update**: added a required **Description** field to the Business Name
step (`/business-name`, still step 1/11 — no renumbering needed) so Business Profile's new About
section has real owner-authored copy instead of a stub. `Business.description` /
`BusinessProfile.description` threaded through types, mock data, and both API contracts
(`business-setup.json#create-business`, `discovery.json#get-business-profile`).

## Phase 3 — Booking flow ([C2](customer.md#c2--booking-flow))

Core flow built end to end against mocks: BusinessServicesScreen's cart → Select Staff → Select
Date & Time → Review & Policies → (Payment Method → STK Pending, only if a deposit is required) →
Booking Confirmed. New route group `app/(discover)/business/[businessId]/book/{staff,datetime,
review,payment,pending,confirmed}.tsx`, all thin re-exports of `src/screens/customer/booking/*`.

- [x] **Select Service** — superseded by the multi-select cart on `BusinessServicesScreen`
      (see Phase 2) rather than a single-select list; its "Continue" seeds `useBookingDraftStore`
      with the chosen service lines and pushes into this flow. Business Profile's cart-aware
      footer button does the same thing directly (skips back through the picker) once the cart
      already has items for that business
- [x] **Select Staff** (`book/staff`) — "Any available" pinned first (uses `staffId: null` — see
      `useBookingDraftStore`'s note on why `staffName` and not `staffId` is what distinguishes "no
      selection yet" from "Any available chosen", since both leave `staffId` as `null`), then every
      staff member as an `Avatar` + `RatingLabel` row. **Not filtered by who can perform the
      selected services** — that relationship isn't modeled (staff only have a `role` string, not a
      services-performed list) — a known simplification, not a bug
- [x] **Select Date & Time** (`book/datetime`) — new `src/utils/availability.ts`:
      `getUpcomingDays`/`getTimeSlots` derive open days + bookable slots (30-min increments, duration-
      aware so a slot isn't offered if it wouldn't fit before closing, past times today excluded)
      purely from the business's `workingHours` (new field — see Business Profile note below).
      **No conflict-checking against other bookings** — there's no bookings backend to check
      against yet (this phase is the first to create any), so this is "is the business open" not
      real availability. Flagged in `booking.json`'s domain-level note for whoever builds this
      server-side
- [x] **Review & Policies** (`book/review`) — summary cards (services/staff/date-time) with "Edit"
      links back to the relevant step or the services picker, computed deposit (handles both
      `fixed` and `percent` `DepositRule` types — see `business.ts`), cancellation/no-show policy
      text from the business's structured `policies`. "Confirm"/"Continue to payment" calls the new
      `createBooking` (see `booking.json#create-booking`) — deposit required → `pending_payment`,
      routes to Payment Method; no deposit → `confirmed` immediately, booking is added to
      `useBookingsStore` and the flow skips straight to Booking Confirmed
- [x] **Payment Method** (`book/payment`) — M-Pesa phone input (`PhoneInput`, prefilled from
      `user.phone`), "Send STK Push"
- [x] **STK Push Pending** (`book/pending`) — spinner + "check your phone" copy naming the number
      entered. **Fully mocked** — `confirmBookingPayment` (`src/api/booking.ts`) always succeeds
      after a fixed 2.2s delay, no real polling/failure/timeout states. M-Pesa integration itself
      (sandbox vs. provider) is still an open decision, unchanged from before this pass — see
      `booking.json`'s domain-level note
- [x] **Booking Confirmed** (`book/confirmed`) — summary (business, staff, services, date/time,
      payment status), "View appointment" (→ Activity tab) / "Done" (→ Explore), both reset the
      booking draft. No push/SMS/WhatsApp confirmation message — out of scope without a real
      notifications backend
- [x] **New client-only state**: `useBookingDraftStore` (in-progress selections through the flow)
      and `useBookingsStore` (completed bookings this session — `ActivityScreen` now lists these
      instead of a pure empty state, with a status badge; still no reschedule/cancel or Upcoming/
      Past/Cancelled segmented control, that's [C3](customer.md#c3--manage-appointments), not
      sequenced yet)
- [x] **Business Profile / `BusinessProfile` type extended**: added structured `workingHours` +
      `policies` fields (reusing `business.ts`'s `WeeklyHours`/`BusinessPolicies` types) alongside
      the existing plain-language `depositSummary`/`cancellationSummary` strings — the booking flow
      computes real slots/deposits from the structured fields, the profile page still shows the
      plain-language ones. Populated for all 6 mock businesses in `discoveryData.ts` with hours/
      policies consistent with their existing summary strings. Threaded through
      `discovery.json#get-business-profile`
- [ ] M-Pesa STK push integration decision (sandbox vs. provider, shared by C2/F3/O4) — still open;
      everything above works against the mock regardless of which provider gets picked

**Bug found + fixed while building this**: `BookingConfirmedScreen`'s "Done"/"View appointment"
buttons call `useBookingDraftStore`'s `reset()` then `router.dismissAll(); router.replace(...)`.
`SelectStaffScreen` — several screens back in the same stack — stays mounted in the background the
whole time (native-stack keeps pushed screens alive) and had a `useEffect` reacting to that same
store's `services` field to redirect back to the business profile if it was ever empty (a guard for
landing on the step without a live draft). Since `reset()` clears `services` to `[]`, it fired that
effect from the *backgrounded* Staff screen at the same moment Confirmed's own navigation was
running — two navigation actions racing in the same tick, which corrupted expo-router's state (a
crash surfacing inside expo-router's `ContextNavigator`) and made the app land back on the business
profile instead of Explore/Activity. Fixed by making the guard a mount-only check (`useEffect(...,
[])` instead of reacting to the store value) — it only needs to catch "landed here without ever
having picked services," not keep re-checking for the screen's whole backgrounded lifetime. Worth
remembering for any future guard effect placed early in a multi-step flow that reads global
(zustand) state: if a later step's own cleanup can change that state while this screen is still
alive in the background, a reactive effect can fire an unwanted navigation.

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

- [x] An owner can set up a business end-to-end (Phase 1) — done against mocks; still needs the
      real backend swapped in per endpoint once it exists (see USE_MOCK_API)
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
