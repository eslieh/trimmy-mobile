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

- **Backend** — custom REST API (not a BaaS). Live against staging for auth, business setup
  (incl. post-publish management), discovery, and team — `USE_MOCK_API = false` in
  `src/config/env.ts`. Booking (`USE_MOCK_BOOKING`) and customer fulfillment
  (`USE_MOCK_FULFILLMENT`) stay on mock until Phase 3/4 ship.
  Env URLs are committed: `.env.development` / `.env.staging` →
  `https://trimmy-staging.pesagrid.co.ke`, `.env.production` →
  `https://trimmy-api.pesagrid.co.ke`. Never localhost (the 2026-09-22 incident —
  `.env.development` pointed at `http://localhost:8001` and every request failed).
  `apiRequest` attaches the Bearer token and maps backend `{error, message}` shapes.
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
- [x] **Search Results** map/sort and **Filter Sheet** modal — done, see the "Search Results sort +
      map view" and "Search Results redesign" entries further down (near the end of this Phase 2
      section) for details
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
- [x] **Staff Profile** (`/business/[businessId]/staff/[staffId]`, customer-facing) — tapping a
      staff row on Business Profile now goes somewhere. Fresha-inspired tabs (new reusable
      `SegmentedTabs` component): **Profile** (bio, specialty pills, services-at-this-business list
      — no staff↔service mapping exists in the data model, so this is the business's full menu, not
      services specific to this person), **Portfolio** (new `portfolio: string[]` field on
      `BusinessProfileStaffMember` — past-work photos in a masonry grid, tap opens a full-screen
      pager), **Reviews** (badge shows count, but no per-staff review text is modeled — shows the
      business's own reviews as a stand-in, documented in the screen's own comment). "Book with
      [name]" seeds the booking draft with this staff member pre-selected: if the cart already has
      services for this business it jumps straight to Select Date & Time, else it sends the
      customer to the services picker first (can't book an empty cart)
- [x] **Photo gallery** — new reusable `MasonryPhotoGrid` (2-column, deterministic per-position
      aspect ratios fake a pinterest-style staggered look without a masonry library or measuring
      real image dimensions) + `ImageGalleryViewer` (full-screen horizontal pager, opens at
      whichever photo was tapped) + `PhotoGridModal` (grid-then-viewer, as a `pageSheet`). Wired
      into both **Staff Profile's Portfolio tab** (inline grid) and **Business Profile's hero**
      (tapping any hero photo, or the page-count badge, opens the full grid)
- [x] **Live open/closed status** next to Business Profile's rating (new `getOpenStatus` in
      `src/utils/availability.ts`, same "hours only, no holiday exceptions" caveat as the rest of
      that file) and an **amenities pill row** (new `amenities: string[]` field on `BusinessProfile`,
      populated for all 6 mock businesses)
- [x] **Filter Sheet** (`src/screens/customer/FilterSheet.tsx`, modal) — price / rating / distance,
      as discrete preset pills rather than true sliders (no slider library is installed, and adding
      a native one mid-session means a dev-client rebuild — same pill pattern as everywhere else in
      the app). Category is still handled separately (the existing quick-filter chips). Setting any
      filter now also counts toward Explore's "is a search active" check, same as query/category.
      New `radiusKm` param threaded through `searchBusinesses`/`discovery.json` (was already in the
      contract's example request but not actually implemented)
- [x] **Search Results sort + map view** — sort pills (Distance/Price/Rating, client-side re-sort,
      no new backend param) and a List/Map toggle on Explore's active-search results. Map view is a
      real `react-native-maps` `MapView` (new `SearchResultsMap`) with a price-pill marker per
      result; needed adding `lat`/`lng` to `BusinessSummary` (search results previously had no
      coordinates at all — a real gap, not just a display omission) and threading them through
      `toSummary()`/`discovery.json`
- [x] **Search Results redesign, Airbnb-inspired** (per user reference screenshots) — results list
      is now single-column, full-width cards (new `BusinessResultCardLarge`), each with a
      **swipeable photo carousel + dot pagination** instead of one static thumbnail. Needed adding
      `photos: string[]` to `BusinessSummary` (previously only `thumbnailUrl` — another real search-
      result data gap, same shape as the `lat`/`lng` one above) threaded through `toSummary()`/
      `discovery.json`. The List/Map toggle moved from an inline pill row to a **floating pill
      button** (bottom-center, absolute-positioned, shown in both modes) matching Airbnb's pattern;
      the old "Filters (N)" text pill (buried in the category chip row) became a proper **circular
      icon button** (new `FilterIcon`) next to the search pill, with a small badge dot for the
      active count. Map markers switched from solid-dark to white pills to match the reference.
      **Not built**: Airbnb's draggable bottom sheet (peeking list preview under the map) and
      marker↔list selection sync — no bottom-sheet/gesture library is installed, and a from-scratch
      `PanResponder` implementation risked a half-working gesture; the floating toggle covers the
      same "switch view" need without it
- [ ] **Business Profile tabbed redesign** — attempted, then explicitly declined: built the full
      About/Services/Team/Reviews/Other `SegmentedTabs` restructure (category-pill filtering in
      Services, an embedded map + amenities + "Venues nearby" in Other, all against a real plan
      the user approved), but the user reverted it back to the single-long-scroll version and said
      to keep it that way. **Do not redo this** without being asked again — the single-scroll
      layout is the intended state, not a stopgap. Two pieces from that attempt were kept because
      they're pure refactors with no behavior change: `src/components/EmbeddedLocationMap.tsx`
      (address row + non-interactive map + "Get directions", extracted out of
      `BookingDetailScreen.tsx`'s Location card, still used there) and `SegmentedTabs`/
      `MasonryPhotoGrid`/`ImageGalleryViewer` (already in use by Staff Profile, untouched). Live
      open/closed status and amenities (still shown inline on Business Profile, not moved) are also
      still in place from before this attempt.

**Motion pass**: user asked about adopting Framer Motion app-wide — it's web/DOM-only, no React
Native support, so instead this expanded actual usage of `react-native-reanimated` (already a
dependency, already used for a handful of things — button press-springs, focus-border color,
`StepProgressBar`'s fill, Business Profile's scroll-linked header fade) into places that were
previously just snapping:
- `SegmentedTabs` — selected-pill background/text color now eases (`interpolateColor` +
  `withTiming`) instead of snapping. One shared component, so this covers every place it's used
  (Staff Profile, Activity) for free
- New `AnimatedFavoriteHeart` (`src/components/AnimatedFavoriteHeart.tsx`) — replaces a plain
  `HeartIcon` at every favorite-toggle site (`BusinessResultCard`, `BusinessResultCardLarge`,
  Business Profile's hero heart button) with one that pops via `springs.bouncy` when it becomes
  filled — that motion token existed in `theme/motion.ts` already, labeled for exactly this, just
  never wired up until now
- `BusinessServicesScreen`'s quantity stepper — extracted into `ServiceQuantityControl`; the Add-
  button ↔ stepper swap now crossfades (Reanimated's `entering`/`exiting` on `Animated.View`,
  declarative in the same spirit as Framer Motion's `AnimatePresence`) instead of an instant
  layout snap, and the count bumps with `springs.bouncy` on every +/- tap
- `ActivityScreen` — Upcoming/Past tab content now crossfades in (`FadeIn`) instead of snapping,
  keyed by tab so the scroll position also resets on switch (matches expected tab-switch behavior)

Deliberately not touched: the plain RN `Modal`s (`SearchSheet`, `FilterSheet`, `PhotoGridModal`,
`ImageGalleryViewer`, the booking-flow cancel sheet, `CountryPicker`, `TimePickerField`, and a few
business-setup screens) — their built-in slide/fade is a reasonable baseline, and layering custom
reanimated gesture-driven transitions (drag-to-dismiss, independent backdrop fade) on all of them
is a much bigger, separate effort not attempted in this pass.

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
      and `useBookingsStore` (completed bookings this session). See **Activity / Booking Detail**
      below for how these now drive a real Upcoming/Past view instead of a flat list.
- [x] **Business Profile / `BusinessProfile` type extended**: added structured `workingHours` +
      `policies` fields (reusing `business.ts`'s `WeeklyHours`/`BusinessPolicies` types) alongside
      the existing plain-language `depositSummary`/`cancellationSummary` strings — the booking flow
      computes real slots/deposits from the structured fields, the profile page still shows the
      plain-language ones. Populated for all 6 mock businesses in `discoveryData.ts` with hours/
      policies consistent with their existing summary strings. Threaded through
      `discovery.json#get-business-profile`
- [ ] M-Pesa STK push integration decision (sandbox vs. provider, shared by C2/F3/O4) — still open;
      everything above works against the mock regardless of which provider gets picked

**Activity / Booking Detail** (pulled forward from [C3](customer.md#c3--manage-appointments), not
the full C3 — see gaps below), Airbnb Trips-inspired per user reference screenshots:
- [x] **Activity tab redesign** — pill `Upcoming`/`Past` switch (new reusable `SegmentedTabs`,
      also used by Staff Profile) instead of one flat list. Classification and sort are computed
      client-side from `booking.date`+`booking.time` vs. now (new `getBookingDateTime`/
      `isUpcomingBooking` in `src/utils/date.ts`) — Upcoming sorted soonest-first, Past most-recent-
      first. Each row sits in a connecting-line timeline (day-of-week + date-circle rail down the
      left, mirroring the rail style in Airbnb's own trip-detail check-in/checkout) instead of a
      plain card list. Distinct empty states per tab
- [x] **Booking Detail** (`/booking/[bookingId]`, new top-level route — reached only from Activity,
      not nested under a business, so it lives beside `success.tsx`/`get-started.tsx` rather than in
      `(discover)`) — business summary card, date/time, services + total + deposit-paid line, and a
      **Location card with a real embedded `react-native-maps` marker** (not a stylized badge like
      the Airbnb reference) + a "Get directions" button (`Linking.openURL` to a Google Maps
      universal link, works on iOS/Android without a native maps SDK), and the business's
      cancellation policy in plain language
- [x] **Cancel appointment** — only shown for upcoming, not-yet-cancelled bookings. Opens a confirm
      sheet that computes whether this specific cancellation is inside the business's free-
      cancellation window (`policies.cancellation.freeCancellationHours` vs. hours until the
      appointment) and shows either "no fee" or the actual late-fee amount (`lateFeePercent`% of
      `totalAmount`) before confirming — not just the policy text, the real number for *this*
      booking. Confirming calls `useBookingsStore.updateBooking` to flip status to `cancelled`; no
      cancel endpoint exists yet, so this is client-only and doesn't refund/reverse a paid deposit
- [ ] **Gaps vs. full C3**: no reschedule (reuses Select Date & Time + shows fee impact, per the
      candidate-screens doc — not built), no reason picker on cancel, no push/SMS/WhatsApp
      cancellation confirmation. Cancelled bookings aren't split into their own segment — they're
      still classified into Upcoming/Past purely by date/time (a cancelled booking whose original
      slot is still in the future shows under Upcoming, just with a red "Cancelled" badge), not a
      third `Cancelled` tab (Upcoming/Past/Cancelled was the original candidate-screens spec; two
      tabs matches what was actually asked for this pass)

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

**New: the business-owner app is now a real, separate mode** — not just a screen or two reached by
a special-case route. Modeled explicitly on Airbnb's traveling/hosting switch: `useOwnedBusinessStore`
(new) holds `activeMode: 'customer' | 'business'` alongside the `OwnedBusiness` data (a slim
`{businessId, name, teamMode, workingHours}` projection — not the full wizard `Business` type,
since that's all the business-owner app needs so far). Switching is bidirectional and explicit, not
automatic: customer `ProfileScreen` has a "Switch to hosting" button, the new business-owner
`Menu` tab has "Switch to browsing" — both do a full `dismissAll()`+`replace()` reset (same pattern
already used for logout and for the booking flow's terminal screens), not a plain push, so no stale
screens from the other mode linger in the stack. **Mode is session-only** (resets on app restart,
same caveat as every other store here) — it does not decide where you land at login; every fresh
session starts in customer mode, matching how the rest of the app already behaves. Real persistence
of mode/business-ownership across restarts would need a backend and is out of scope.

**New route group `app/(business-app)/`** — sibling to `(tabs)`/`(discover)`/`(business)`, own
`_layout.tsx` with a `<Tabs>` shell using the *exact* same docked/blurred tab bar styling as
`(tabs)/_layout.tsx` (same `screenOptions`, same `BlurView` background) per explicit request — this
should look like the same app, not a bolted-on admin panel. Two tabs for this original pass:
**Today** (`today.tsx` → `TodayTimelineScreen`) and **Menu** (`menu.tsx` → `BusinessMenuScreen`,
mirrors `ProfileScreen`'s shape) — since grown to 4 tabs (Business, Calendar added later; see their
own sections below). **Appointment Detail** (`AppointmentDetailScreen`) deliberately lives
*outside* this group, as a top-level `app/appointment/[bookingId].tsx` — same reasoning as the
customer side's `app/booking/[bookingId].tsx`: routes inside a `<Tabs>` group's own folder stay
part of that tab's stack, so pushing to Appointment Detail from a sibling top-level route is what
correctly slides over and hides the tab bar.

**Data bridges this needed** (none of this existed before):
- `Booking` gained `customerName: string` — bookings previously only recorded staff/business, not
  who booked. Populated in `ReviewPoliciesScreen` from `useAuth()`'s user (same
  `[first_name, last_name].filter(Boolean).join(' ')` pattern `ProfileScreen`'s `displayName`
  already used).
- `BookingStatus` extended: `pending_payment | confirmed | cancelled` → added `in_progress`,
  `completed`, `no_show` (S1 needs a real status stepper, not just the 3 states the booking flow
  itself used).
- New `src/utils/bookingStatus.ts` (`BOOKING_STATUS_LABEL`/`BOOKING_STATUS_COLOR`) — this was
  copy-pasted in `ActivityScreen`/`BookingDetailScreen` already; extending the status union would
  have made both local copies incomplete, so this was the moment to dedupe rather than a third
  copy in the new business-app screens.
- Bookings-for-a-business: no new store — `useBookingsStore`'s flat array already carries
  `businessId`, `TodayTimelineScreen` just filters client-side. Not worth a dedicated selector for
  one filter.

`team_mode = solo` → owner's own session gets Staff-style view ([S1](staff.md#s1--daily-schedule)):
- [x] **Today Timeline** — single-column schedule (day-switcher pills: today/tomorrow — was
      yesterday/today/tomorrow, "Yesterday" dropped once the Calendar tab took over past-date
      browsing, see its section below), live from `useBookingsStore` filtered to the owned business.
      **Not built**: pull-to-refresh (nothing to refresh against — mock data), current-time
      indicator line (deferred, not essential for a first pass)
- [x] **Appointment Detail** — customer name, services + duration + price, time, staff, and a
      status stepper (`confirmed → in_progress → completed`, or terminal `no_show`/`cancelled`).
      **Deliberately not built**: client history, preferences, reference images, special-
      instructions callout, post-service notes modal — **none of that data is modeled anywhere in
      the app** (no per-client profile concept exists at all yet); inventing it wholesale is a
      separate, much bigger feature, not a gap in this pass specifically
- [ ] **Testing convenience**: `ProfileScreen`'s "Switch to hosting" seeds a mock `OwnedBusiness`
      from `MOCK_BUSINESS_PROFILES[0]` if nothing's been published this session — lets Today
      Timeline be tested against real bookings (make one as a customer against that business, then
      switch) without redoing the 11-step wizard every time. Not a gap, a deliberate dev aid — flagged
      here so it isn't mistaken for a real "check if the user owns a business" auth flow.
      `seedOwnedBusinessForTesting()` (`src/utils/devSeed.ts`) also seeds
      `useBusinessOnboardingStore`'s `business`/`serviceCategories`/`services` (converting the mock
      discovery profile's customer-facing services shape — `categoryName` strings — into the owner-
      side shape — `ServiceCategory` records + `categoryId`-linked `Service` records) — without this,
      the seeded business would land on Today but **Manage Business would stay disabled**, since its
      guard checks that both stores' `businessId` match. Found and fixed after first landing this:
      the guard was correct, but nothing populated the store it guards against
- [ ] **`WelcomeScreen`'s social buttons repurposed as a role-testing shortcut**, per explicit
      request: "Continue with Google" → customer (`/explore`), "Continue with Apple" → business
      solo (`/today`, seeded `teamMode: 'solo'`), "Continue with mobile" → business team (`/today`,
      seeded `teamMode: 'team'`). **This is not real auth** — none of Google/Apple/phone OAuth is
      wired up (unchanged from before; these buttons already did nothing real), and there is no
      actual relationship between login method and business role in a real product. Both seeding
      paths share the new `seedOwnedBusinessForTesting()` helper (`src/utils/devSeed.ts`) with
      `ProfileScreen`'s "Switch to hosting", rather than three copies of the same projection logic.
      Landing on Today with `teamMode: 'team'` now shows a small banner explaining Front Desk isn't
      built yet, since this shortcut can reach that state and the screen would otherwise silently
      show the solo view with no indication anything's missing

`team_mode = team` → business gets a Front Desk view ([F1](front-desk.md#f1--live-calendar)) — not
started, separate follow-up (this pass was explicitly scoped to solo/S1 only):
- [ ] **Day Calendar (Grid)** — staff rows × time columns, live from Phase 3 bookings
- [ ] **Appointment Detail** modal — status stepper (check-in → in progress → complete/no-show/cancel)
- [ ] Double-booking warning on create/move
- [ ] Would also need its own tab (or the Today/Menu shell's `today` tab conditionally swapping to
      a calendar view based on `ownedBusiness.teamMode`) — not decided yet

## Manage Business ([O1](business-owner.md#o1--business-setup), post-publish)

The 11-step wizard was previously the *only* way to touch a business's services/hours/policies —
once published there was no way back in. This adds ongoing management inside the business-owner
app's Menu tab, reusing `useBusinessOnboardingStore`'s `business`/`services`/`serviceCategories`
(confirmed these never reset after publish — same lifecycle as everything else in that store)
rather than introducing a new data source.

- [x] **Manage Business hub** (`ManageBusinessScreen`) — business identity card + rows for all 6
      management areas (Services, Working hours, Policies, Business info, Payment destination,
      Photos), each with a leading icon (new `ListIcon`/`ClockIcon`/`ShieldIcon`/`InfoIcon`/
      `WalletIcon`/`ImageIcon`) and a trailing `ChevronRightIcon` — all rows are now live, the
      earlier disabled "Coming soon" state is gone (see the Business info/Payment/Photos entry
      below). **Promoted to its own "Business" tab**
      (`app/(business-app)/business.tsx`, between Today and Menu) after a design discussion about
      the app's role/session model surfaced that burying it 3 taps deep under Menu → "Manage
      business" → push was exactly the "everything is everywhere" problem — it was originally a
      pushed screen reached from a guarded Menu row; that row and its guard logic are gone now that
      it's a tab (the guard's *reasoning* still matters, see next point, it just isn't a visible gate
      anymore — see empty-state handling below). `BusinessMenuScreen` is back to purely
      account-level (name/email, "Switch to browsing", Log out)
- [x] Still reads straight from `useBusinessOnboardingStore` (not `useOwnedBusinessStore`'s slim
      projection), so it only shows real content when that store has data — which now happens both
      for a real trip through onboarding *and* for the dev-seed shortcuts (`ProfileScreen`'s "Switch
      to hosting", `WelcomeScreen`'s repurposed social buttons — see `src/utils/devSeed.ts`, which
      seeds both stores together as of the fix noted further down). If `business` is somehow still
      null (shouldn't happen via either normal path), the tab just renders an empty `SafeAreaView`
      rather than a dead-end screen
- [x] **Manage Services** (`ManageServicesScreen`, route `/manage-business/services`) — full add/
      edit/delete for services and categories, not just onboarding's add-only flow. Visually mirrors
      onboarding's `ServicesScreen` (category cards, Add Category/Add Service sheets) but operates
      on the live `services`/`serviceCategories` arrays with immediate per-action API calls, not a
      batched wizard submit. **New**: `updateService`/`deleteService`/`deleteServiceCategory` in
      `src/api/businessSetup.ts` (no update/delete endpoint existed before — onboarding was purely
      additive, confirmed by grep) and matching `addServiceCategoryNow`/`addServiceNow`/
      `editService`/`removeService`/`removeServiceCategory` actions in the store (distinct from the
      existing `*Draft` actions, which stay untouched for onboarding). Deleting a category cascades
      removal of its services. Documented in `business-setup.json` (`update-service`,
      `delete-service`, `delete-service-category` — no reference PRD entry existed for these, added
      fresh)
- [x] **Working hours + Policies editing** — reused `WorkingHoursScreen`/`PoliciesScreen` directly
      (both already read their initial values from persistent `business.workingHours`/
      `business.policies`, not the wizard's transient `draft`) via a `?mode=edit` query param: the
      footer button reads "Save" instead of "Continue", the step-progress bar is hidden, and on
      submit it does `router.back()` instead of advancing to the next wizard step. No new screens.
- [x] **Business info editing** (`EditBusinessInfoScreen`, route `/manage-business/info`) — combined
      name/description/categories/phone/location edit screen, styled like `ManageServicesScreen`
      (`BackButton` + h2 header + `ScrollView`, not the wizard's `AuthScreenLayout`) rather than
      patching the 4 separate onboarding screens (`BusinessNameScreen`/`BusinessCategoriesScreen`/
      `BusinessPhoneScreen`/`BusinessLocationScreen`), which all read from the wizard's `draft` —
      empty post-publish, so unsafe to reuse as-is. Prefills every field straight from `business`;
      phone is recovered from the stored E.164 string via `parsePhoneNumberFromString`
      (`libphonenumber-js`), falling back to the Kenya default country if parsing fails. Single
      "Save" button → new `updateBusinessInfo(businessId, input)` action (store) → new
      `updateBusinessInfo` mock API call (`src/api/businessSetup.ts`, PATCH-equivalent, documented as
      `update-business-info` in `business-setup.json` — no prior contract entry existed since
      onboarding's Business Basics is a single combined POST)
- [x] **Payment destination editing** — fixed `PaymentDestinationScreen` to actually prefill (it
      previously never read `business.paymentDestination` at all, always starting blank) and added
      the same `?mode=edit` branch as Working hours/Policies ("Save" vs "Continue", progress bar
      hidden, `router.back()` vs advancing the wizard). No new API — `submitPaymentDestination` was
      already a plain idempotent PUT
- [x] **Photos management** (`ManagePhotosScreen`, route `/manage-business/photos`) — the real gap:
      onboarding's `PhotosScreen` only ever showed local pre-upload drafts, never existing
      `business.photos`. Visually mirrors that grid (thumbnails, "Cover" badge on the first photo,
      dashed "+ Add" tile, per-photo remove button) but reads/writes the live `business.photos`
      immediately per action instead of a batched submit — same shape as `ManageServicesScreen`'s
      live actions. New `addPhotoNow`/`removePhotoNow` store actions (reuses existing
      `uploadBusinessPhoto`; new `deleteBusinessPhoto` mock API call, documented as
      `delete-business-photo` in `business-setup.json`). No minimum-photo guard — a business can go
      to zero photos through this screen

## Calendar + walk-in/scheduled appointments + charge customer (solo, post-publish)

The "record a service and charge the customer" idea from Phase 4 planning, deferred at the time as
"business management now, walk-ins later" — this pass builds it. Also promoted browsing other dates
out of the Today tab into its own **Calendar** tab (`app/(business-app)/calendar.tsx` →
`CalendarScreen`) after explicit request — Today stays "what's happening today, plus starting a
walk-in", Calendar is "browse other dates and schedule something for later". `(business-app)` is now
4 tabs: Today (`ListIcon`), Calendar (`CalendarIcon` — freed up since Today no longer uses it),
Business, Menu.

- [x] **`CalendarScreen`** — new `MonthCalendar` component (`src/components/MonthCalendar.tsx`,
      plain month grid, prev/next chevrons, dot under any day with a booking, no multi-month
      swipe/scroll) + the selected day's appointment list below it (using the same card as Today —
      extracted to `src/components/AppointmentCard.tsx` since it's now shared by two screens rather
      than duplicated). Below that, a Google Calendar-style **"Available times"** row: open slots for
      the selected day at a fixed 30-min browse granularity (`getTimeSlots` against
      `ownedBusiness.workingHours`, filtered against that day's already-booked times — this is a
      rough "what's open" preview, not the real availability check, which happens once actual
      service durations are known) — tapping a slot jumps straight into `ScheduleAppointmentScreen`
      with that date/time pre-filled. Header "+" → `/schedule` with no preset (pick everything from
      scratch). `TodayTimelineScreen`'s day pills dropped "Yesterday" (Calendar now owns past-date
      browsing; Today only needs Today/Tomorrow)
- [x] **Walk-in and scheduling are deliberately two separate screens/entry points**, not one screen
      with a mode toggle (an earlier pass merged them; split back apart per explicit request):
  - **`StartWalkInScreen`** (route `/walk-in`, reached from Today's "+") — customer is physically
        present: service picker, starts the appointment immediately as `in_progress`, no date/time
        picking (uses right now).
  - **`ScheduleAppointmentScreen`** (route `/schedule`, reached from Calendar's "+" or by tapping an
        open slot on a Calendar day) — customer fields + service picker + date/time. When reached
        with a preset `?date=&time=` (from tapping a slot), the date/time shows as a locked summary
        row ("Tue, Sep 23 · 2:30 PM") with a "Change" link instead of the full picker, so the common
        case (you already know when) is one tap away from done; the full day-strip + time-slot-grid
        picker (reused pattern from the customer-facing `SelectDateTimeScreen`, backed by
        `getUpcomingDays`/`getTimeSlots` against the business's `workingHours`) still opens via
        "Change" or when reached with no preset at all. Picking a slot inside the picker also
        auto-locks it the same way. Creates a `confirmed` booking (`createScheduledBooking`) rather
        than `in_progress` — the owner still has to check the customer in from Appointment Detail
        when they actually arrive, same as an online booking. Requires a customer name (walk-in
        doesn't, since "Walk-in customer" is a reasonable fallback for someone standing right there;
        a scheduled appointment needs a real name to be useful later).
      Both screens collect phone (`PhoneInput`) and email (plain `Input`), and save whatever's
      entered to the new **customer store** (see below) before creating the booking.
- [x] **New customer store** (`src/types/customer.ts`, `src/store/useCustomersStore.ts`) — the
      first "customer" concept in the app (bookings previously only stored a `customerName` string).
      Client-only/in-memory, same caveat as every other mock store here. `saveCustomer(businessId,
      {name, phone, email})` dedupes by phone within a business — re-entering an existing customer's
      phone updates their name/email instead of creating a duplicate row. Not yet surfaced as its own
      "customer list" screen anywhere — this pass only writes to it, nothing reads it back yet
- [x] **`Booking` gained `customerEmail: string | null`** (alongside the existing `customerPhone`,
      which used to only ever get set by the charge flow — now also set up front for walk-in/
      scheduled appointments). `source: 'online' | 'walk_in'` already existed; scheduled
      appointments reuse `'walk_in'` (owner-recorded) rather than adding a third value, since the
      only real difference from an instant walk-in is starting `confirmed` instead of `in_progress`
- [x] **Charge customer** (`AppointmentDetailScreen`, shown once a booking is `in_progress`) — the
      "Mark completed" button became "Charge customer", opening a sheet with a method toggle:
  - **M-Pesa**: enter the customer's phone, "Send payment request" simulates an STK push
        (`chargeBookingPayment`, same `mockDelay`-based simulation pattern as the existing
        `confirmBookingPayment`) — pending state shows "Check their phone".
  - **Cash**: single "Mark as paid (cash)" tap, no phone needed (`chargeBookingCash`).
      Either way the booking gets `paymentStatus: 'paid'`, `paymentMethod` set, and `status:
      'completed'`. New `PaymentStatus`/`PaymentMethod` types on `Booking`. A success state (spring-
      in `CheckIcon`, "M-Pesa payment received" / "Cash payment recorded") shows in the same sheet
      for ~1.6s before auto-dismissing, rather than just snapping the sheet closed. The Appointment
      Detail summary card shows a "Paid · M-Pesa"/"Paid · Cash" badge once charged. Both charge
      functions and `createScheduledBooking`/`createWalkInBooking` (renamed from
      `CreateWalkInBookingInput` to `CreateOwnerBookingInput` now that it's shared) documented inline
      in `src/api/booking.ts` as having **no reference/api contract entry yet** — same as the other
      owner-side additions this session
- [x] **Today's Upcoming section split from Completed, and given a timeline rail** — per explicit
      request. `TodayTimelineScreen` now splits the day's bookings into "Upcoming" (`confirmed`/
      `in_progress` — shown first, unconditionally) and "Completed" (`completed`/`no_show`/
      `cancelled` — collapsed behind a "Completed (N)" toggle, since those no longer need action).
      Upcoming renders as a vertical timeline (time-pill node + connecting line per row, same visual
      language as the customer-facing `ActivityScreen`'s day-rail, adapted to show time-of-day
      instead of day-of-month since everything here is already the same day) — `AppointmentCard`
      gained a `showTime` prop (default `true`) so the in-card time column doesn't repeat what the
      rail node already shows.
- [x] **Appointment Detail shows customer phone/email + a "Call" button** — new card (only rendered
      when either is present) between the status summary and Date & time, with a purple "Call"
      pill (`PhoneIcon`) that does `Linking.openURL('tel:' + customerPhone)`. Only bookings created
      through the walk-in/schedule flows (or ones already charged, which sets `customerPhone`) have
      this — online bookings never collect a phone up front, so this card simply doesn't render for
      those until/unless charged.

## Earnings tab (solo, post-publish, read-only analytics)

Requested as the natural next step once bookings started carrying real payment data
(`paymentStatus`/`paymentMethod`/`totalAmount` from the Charge customer work above) — a way for the
owner to actually see how the business is doing, not just record individual charges. Purely a read
layer: no new writes, just aggregation over `useBookingsStore` (see `src/utils/earnings.ts`) — kept
as pure functions rather than inline in the screen so they're independently reasoned about. Only
`paymentStatus: 'paid'` bookings count as revenue anywhere in these — a confirmed-but-unpaid or
still-in-progress booking hasn't actually earned anything yet.

- [x] **New "Earnings" tab** (`app/(business-app)/earnings.tsx` → `EarningsScreen`, `ChartIcon`) —
      `(business-app)` is now 5 tabs (Today, Calendar, Earnings, Business, Menu). Chosen over burying
      it in an existing tab, per explicit request, since this is meant to be a primary, frequently-
      checked surface
- [x] **No charting library added** — explicit decision, since only `react-native-svg` was already a
      dependency and adding one risks unverified Expo SDK 57 compatibility for a single screen. Two
      small custom chart components instead:
  - `src/components/charts/BarChart.tsx` — plain `View` bars (no SVG needed for a rectangle),
        animated in on mount/data-change via `withTiming` on height. Used for the revenue-trend chart.
  - `src/components/charts/DonutChart.tsx` — the one that actually needs SVG: a multi-segment ring
        via the standard `strokeDasharray`/`strokeDashoffset` trick, rotated -90° so the first segment
        starts at 12 o'clock. Used for the payment-method (M-Pesa vs Cash) breakdown, with a
        total-revenue center label.
- [x] **Today/Week/Month/Year/Custom range toggle, defaulting to Today** — per explicit request
      ("the default should be today"), since that's the question an owner checking in mid-shift
      actually has, not a rolling week. The 4 presets are just specific `DateRange`s
      (`getPresetDateRange`) anchored on today (not calendar-aligned — no need for exact
      calendar-month precision against mock data); **Custom** reveals two `DatePickerField`s
      ("From"/"To", new component mirroring the existing `TimePickerField`'s iOS-sheet/Android-
      native-dialog split, `mode="date"` instead of `"time"`) whose values build a `DateRange` via
      `buildCustomDateRange`. Every aggregation function in `earnings.ts` takes a plain `DateRange`
      now rather than the range enum directly, so presets and custom ranges share one code path.
  - **`getEarningsBuckets`'s granularity is now generic**, picked from however many days the range
        actually spans, rather than being hardcoded per preset: ≤1 day → 3-hour buckets (so "Today"
        isn't just a single bar), ≤16 days → daily, ≤70 days → weekly, beyond that → monthly. A
        custom 3-day range and a custom 3-month range each get sensible bars without special-casing.
- [x] **Hero card**: total earned for the range, plus completed count / average ticket size /
      no-show+cancelled count.
- [x] **Revenue trend** — `BarChart` over the range's buckets.
- [x] **Payment method breakdown** — `DonutChart` (M-Pesa = brand purple, Cash = brand pink) +
      a legend with amount and paid-count per method. Card doesn't render at all if nothing's been
      paid yet in range (no segments to show).
- [x] **Full services breakdown, not just a "top 5"** — per explicit request ("list the services
      they offered"). `getServicesBreakdown` (renamed from `getTopServices`) now takes the business's
      *entire* live service menu (`useBusinessOnboardingStore`'s `services`) and returns a row for
      every one of them, including services with zero bookings in range ("Not booked" instead of an
      amount) — the point being to also surface what *isn't* selling, not just rank what is. Revenue
      is still allocated per service line (`price.amount * quantity`) rather than splitting a
      booking's total evenly across its services. Sorted by revenue desc, ties broken alphabetically
      so zero-revenue rows have a stable order instead of shuffling on every render.
- [x] **Appointment volume & completion stats** — folded into the hero card rather than a separate
      section (completed/no-show/cancelled counts + avg ticket), since a standalone stats grid for
      just 4 numbers felt like padding rather than a real section.

## Customers list (solo, post-publish)

Closes a loop opened by the walk-in/schedule flows: `useCustomersStore` has been writing
name/phone/email since those landed, but nothing read it back until now. Picked over a 6th tab
(would have crowded the bar) — instead a **"Customers" row in Manage Business**
(`ManageBusinessScreen`, right after Services, new `UsersIcon`), consistent with how
Services/Working hours/etc. already work as rows there rather than tabs of their own.

- [x] **`CustomersScreen`** (route `/manage-business/customers`) — search (name/phone/email,
      client-side filter over `useCustomersStore`) + alphabetical list. Empty states for "no
      customers yet" vs "no customers match this search" are distinct messages, not the same generic
      one
- [x] **`CustomerDetailScreen`** (route `/customers/[customerId]`, top-level so it hides the tab bar
      like `/appointment/[bookingId]`) — contact card (name, phone, email) with a "Call" button
      (`Linking.openURL('tel:' + phone)`, same approach as Appointment Detail's), a "New appointment"
      button that jumps to `/schedule` with `customerName`/`customerPhone`/`customerEmail` as query
      params, and an **appointment history** list (reuses `AppointmentCard`). Bookings don't carry a
      `customerId` (they predate this store, and online bookings never go through it at all), so
      history is matched by phone when the customer has one, falling back to an exact name match
      otherwise
- [x] **`ScheduleAppointmentScreen` now accepts a customer preset** — reading
      `customerName`/`customerPhone`/`customerEmail` from route params (in addition to the existing
      `date`/`time` preset from tapping a Calendar slot) and prefilling the customer fields;
      `customerPhone` (stored E.164) is recovered into country + national number via
      `parsePhoneNumberFromString`, the same approach `EditBusinessInfoScreen` already used for the
      business's own phone

## Solo API reference closeout (before starting Phase 5)

Asked directly: "have you prepared the API references for solo, or should we finish that first?"
Audited and found `reference/api/fulfillment.json` was still the original empty stub — every
fulfillment-domain mock function built this session (`createWalkInBooking`,
`createScheduledBooking`, `chargeBookingPayment`/`chargeBookingCash`) only had an inline "no
contract entry yet" code comment, never an actual JSON entry. The audit also turned up a real
mock-layer inconsistency, not just a docs gap: **Appointment Detail's status stepper and
`useCustomersStore.saveCustomer` never called a mock API function at all** — they mutated local
Zustand state directly, unlike every other write in the app (which all go through a
`USE_MOCK_API` branch + `mockDelay`/`apiRequest`). Fixed both, then wrote the contracts, rather
than documenting the shortcut as if it were the intended behavior — decided explicitly rather
than assumed, since this was worth the extra pass before Phase 5 (Front Desk/Staff) extends this
same fulfillment domain and would otherwise inherit the inconsistency.

- [x] **New `updateBookingStatus(booking, status)`** in `src/api/booking.ts` (mock-only "takes the
      full booking" quirk, same reason as `chargeBookingPayment`/`confirmBookingPayment`) — wired
      into `AppointmentDetailScreen`'s `setStatus` (now async, with an `isUpdatingStatus` guard
      disabling the Check in/No-show/Cancel buttons mid-request rather than allowing a double-tap)
- [x] **New `src/api/customers.ts`** — `saveCustomer(businessId, input)` mock function (create when
      no `customerId`, update when one's passed — the dedupe-by-phone matching itself still happens
      in `useCustomersStore`, which now calls this instead of building the `Customer` record
      itself). `useCustomersStore.saveCustomer`'s signature changed from sync `Customer` to `Promise
      <Customer>`; both call sites (`StartWalkInScreen`, `ScheduleAppointmentScreen`) already run
      inside an async handler, so this was just adding `await`. `listCustomers` was **not** added as
      a mock function — documented in the JSON contract only, matching the existing precedent that
      `list-service-categories` (business-setup.json) also has no mock implementation
- [x] **`reference/api/fulfillment.json` drafted** (was: stub) — 8 endpoints: `list-business-
      bookings` (no mock implementation yet either — Today/Calendar/Earnings all read the client-
      side `useBookingsStore` array directly, which only ever holds bookings created this session),
      `create-walk-in-booking`, `create-scheduled-booking`, `update-booking-status`, `charge-
      booking` (one endpoint, `method: 'mpesa' | 'cash'` — covers both `chargeBookingPayment`/
      `chargeBookingCash`), `get-earnings-summary` (documents the shape `src/utils/earnings.ts`
      currently computes client-side — flagged in the description that aggregating every booking
      in memory isn't a real backend's job long-term), `save-customer`, `list-customers`. File's
      top-level `auth` note explicitly says these are audited against the **solo owner** session
      only, and Phase 5 extends rather than replaces this domain
- [x] **Fixed stale "no reference/api contract entry yet" comments** in `businessSetup.ts`
      (`update-business-info`/`delete-business-photo`/`update-service` — the JSON entries for these
      were added earlier this session but the code comments never got updated to point at them) and
      `booking.ts` (now point at their new `fulfillment.json` entries) — doc rot, not missing
      coverage, but worth catching in the same pass
- [x] **`reference/api/README.md`'s status table updated** — fulfillment.json: stub → drafted
      (solo owner session only)
- [x] **Followed up by auditing customer-facing `discovery.json`** too, per direct question
      ("have we been updating the required endpoints for discovery?"). Found it in much better
      shape than fulfillment was — both endpoints already match the current code exactly
      (`search-businesses`'s example request already includes all 3 `FilterSheet` params;
      `get-business-profile`'s example response already embeds `staff[]`/`reviews[]`, so
      `StaffProfileScreen` re-fetching the whole profile and picking a member client-side was never
      missing an endpoint). Two doc-rot fixes in `reference/api/README.md`: the discovery.json status
      note ("filters/staff-profile endpoints not added yet") was stale, since both are covered;
      `booking.json` was mislabeled "stub" despite having 2 real endpoints (`create-booking`,
      `confirm-booking-payment`) — relabeled "drafted", noting reschedule/cancel (C3) is genuinely
      not covered but that's Post-MVP backlog, not a gap in what's built. Also fixed the file's own
      stale intro claiming "no API layer exists in the app yet" (a mock layer has existed for most
      of this project by now). **Left alone, per explicit choice**: Favorites/Wishlist has no
      contract anywhere and `useFavoritesStore` is explicitly client-only — but it has no story id
      in `customer.md` yet (mentioned only as a capability + candidate screen, not one of C1–C5), so
      formalizing it means editing the user-story docs first, not just adding an endpoint; decided
      that's a separate, bigger decision than this audit

## Phase 5 — Team management ([O2](business-owner.md#o2--team-management))

Admin-side team management, picked as the next thing to build after auditing the API docs. An
invitation IS the roster record throughout this — see `types/team.ts` — since there's no separate
staff/front-desk signup flow built yet (`GetStartedScreen`/`team.json`'s `list-my-invitations`/
`respond-to-invitation` are the invitee's side of this, already existed before this pass) and
therefore no independent "member" entity to create once one's accepted.

- [x] **`TeamInvitation` extended**: `name?`, `commissionPercent`, `workingDays` (`(keyof
      WeeklyHours)[] | null` — null means "follows the business's own working days"). Onboarding's
      Team invite step (`inviteTeamMember`, `business-setup.json#invite-team-member`) is unchanged
      and still only collects email/phone/role — it now just defaults `commissionPercent: 40,
      workingDays: null` so the type stays whole. New `src/api/team.ts` functions `addTeamMember`/
      `updateTeamMember`/`removeTeamMember` are the post-publish, fuller-featured path (documented
      as `add-team-member`/`update-team-member`/`remove-team-member` in `team.json`, alongside the
      pre-existing invitee-side endpoints — **had to be careful reconstructing this file**, since an
      early `Write` call clobbered the already-committed `listMyInvitations`/`respondToInvitation`
      functions before the mistake was caught via a stray `GetStartedScreen` type error)
- [x] **`TeamScreen`** — list of invitations (pending sorted first), tap → `TeamMemberDetailScreen`.
      **Its own tab** (`app/(business-app)/team.tsx`, `BadgeIcon`) — originally scoped as a row
      inside Manage Business (matching how Customers/Services/etc. work), then explicitly promoted
      to a tab once the "team businesses shouldn't default to Today/Calendar" architecture change
      (below) landed, since team management is central enough to a team business's day that it
      deserves top-level billing, not a level deeper
- [x] **`InviteTeamMemberScreen`** (route `/team-invite`) — name, phone/email (at least one
      required), role pills, commission % input, `WorkingDaysPicker` (new shared component — see
      below). Calls `addTeamMemberNow`
- [x] **`TeamMemberDetailScreen`** (route `/team/[invitationId]`) — read-only contact card (name/
      role/phone/email/status badge), editable commission % + working days (`updateTeamMemberNow`),
      "Cancel invite"/"Remove from team" (`removeTeamMemberNow`, label depends on status). **"Mark as
      joined (testing)"** button on pending invitations — explicit testing convenience, not real
      auth (flips status locally, no API call) — simulates the invitee accepting via
      `respond-to-invitation`, which isn't reachable from this app since no Staff/Front Desk session
      exists to receive it
- [x] **New `WorkingDaysPicker` component** (`src/components/WorkingDaysPicker.tsx`) — a lighter
      concept than a full per-member `WeeklyHours` clone (exact open/close times), which would
      duplicate the business-hours editor's complexity for something [S4](staff.md#s4--availability)
      ("Availability" — marking specific unavailable blocks) is meant to cover in more detail and
      isn't built yet. Just which weekdays a member works, defaulting to "follows business hours."
      Shared between Invite and Member Detail
- [ ] Invite flow: SMS/link → first-login password/PIN + profile completion — still not built; this
      pass only covers the owner's side

### Architecture change: team businesses no longer default to Today/Calendar

Raised directly mid-build: "if it's business teams, it should not have the calendar and today... it
should start at earnings, business, team, menu — then if the owner wants to go to staff mode they
should be able to switch." Agreed — Today/Calendar are per-shift fulfillment views that fit a solo
owner (who IS the staff) but not a team owner, whose default posture is oversight once there's an
actual team doing the daily work.

- [x] **`(business-app)/_layout.tsx` reads `teamMode`** and conditionally hides tabs via expo-router's
      `href: null` (route stays fully functional, just not shown in the bar) rather than removing
      them: Today/Calendar hidden for `teamMode: 'team'`, Team hidden for `teamMode: 'solo'` (nothing
      to manage). Earnings/Business/Menu are always visible. Net effect: solo sees Today, Calendar,
      Earnings, Business, Menu (5 tabs); team sees Earnings, Team, Business, Menu (4 tabs)
- [x] **`BusinessMenuScreen` gained a "Switch to staff view" row** (`teamMode: 'team'` only) —
      `router.push('/today')` into the hidden tab, for an owner who also works shifts themselves.
      Since Today/Calendar are hidden rather than removed, this works with no special-casing; leaving
      is just tapping any of the visible tabs (Earnings/Business/Menu stay in the bar the whole time)

### `ProfileScreen`'s testing panel now covers every mode that actually exists

Per explicit request to "put all the switches to all modes... for us to test every mode created."
Replaced the single "Switch to hosting" button with a small "Testing: switch mode" section: separate
**Business (solo)**/**Business (team)** buttons (each reseeds via `seedOwnedBusinessForTesting` with
the matching `teamMode` and lands on `/today` or `/earnings` respectively, matching which tab is
actually visible first for that mode), plus a note that **Staff and Front Desk aren't built as their
own experience yet** — there's nothing distinct to switch into for those roles, so no button fakes
one. (Previously this button only ever seeded solo and skipped reseeding if a business already
existed; now it always reseeds deterministically on tap, since a testing panel that depends on
prior state would make testing less reliable, not more.)

## Team screen: grid layout, "Team" promoted to its own tab

Two follow-up requests on the Team management work above, both addressed directly:

- [x] **`TeamScreen` rendered as a 2-column photo grid** (`Avatar` — deterministic initials
      placeholder, since no member has an actual photo yet — + name + role + status), not a plain
      row list, per explicit request ("could we list them as a grid photo or placeholder, name,
      role").
- [x] **"Team" promoted from a row inside Manage Business to its own tab** (`app/(business-app)/
      team.tsx`), hidden via `href: null` for `teamMode: 'solo'` (mirrors how Today/Calendar are
      hidden for `'team'`) — per explicit request once the Today/Calendar-hiding architecture change
      landed, since team management is central enough to a team business's day to deserve top-level
      billing. `InviteTeamMemberScreen` moved from `/manage-business/team-invite` to a top-level
      `/team-invite` route to match (no longer conceptually part of "manage business").

## Team member earnings (per-staff revenue, mirroring the Earnings tab)

Requested directly: "I'd wish for the business owner to be able to see the team members['] ...
earning[s]... kinda what we have on the business earnings." Required a foundational piece first —
**no booking was ever attributed to a specific team member**: owner-created walk-in/scheduled
bookings always had `staffId: null` with a fixed placeholder `staffName` ("Walk-in"/"Any
available"), and online bookings' staff selection comes from an entirely separate, unrelated data
source (`BusinessProfileStaffMember`, the discovery-profile mock staff list customers pick from at
booking time — not `TeamInvitation`). Scoped explicitly: assignment is **optional** (defaults to
unassigned, same as online bookings already allow `staffId: null`), and the earnings view **reuses
the Earnings tab's exact shape** rather than a lighter custom summary.

- [x] **New shared `StaffPicker` component** (`src/components/StaffPicker.tsx`) — "Any available" +
      one pill per invited `role: 'staff'` member (front_desk excluded — they check people in, they
      don't perform services). Added to both `StartWalkInScreen` and `ScheduleAppointmentScreen`,
      only rendered at all when the business actually has staff invited (nothing to pick for solo)
- [x] **`CreateOwnerBookingInput` gained required `staffId`/`staffName`** (previously hardcoded
      inside `createWalkInBooking`/`createScheduledBooking`'s mock bodies to `null`/a fixed string) —
      both screens now pass the picker's selection through, falling back to the same placeholder
      strings as before when left on "Any available". `staffId`, when set, is a `TeamInvitation`'s
      `invitationId` — this is what lets a member's earnings view find "their" bookings, since
      there's still no separate "team member" entity (see the Team management section above)
- [x] **`TeamMemberDetailScreen` gained an Earnings section** — deliberately mirrors `EarningsScreen`
      exactly: same Today/Week/Month/Year/Custom range toggle, same `BarChart` revenue trend, same
      `DonutChart` payment-method breakdown, same services-performed breakdown (via the same
      `getEarningsBuckets`/`getPaymentMethodBreakdown`/`getServicesBreakdown`/`getAppointmentStats`
      pure functions from `utils/earnings.ts` — no changes needed there, since they already just take
      a `Booking[]`, and this screen simply pre-filters `useBookingsStore`'s bookings to
      `staffId === invitation.invitationId` before passing them in). Hero card additionally shows
      **"Their commission"** — `totalRevenue × commissionPercent / 100` — alongside the raw revenue
      total, since that's the number that actually matters for a specific member rather than the
      business as a whole. Not extracted into a shared component with `EarningsScreen` (the JSX/
      styles are specific enough, and this screen already has its own contact-card/editable-fields
      content above and below it) — some duplication accepted rather than a risky refactor of the
      already-working Earnings tab
- [x] **`reference/api/fulfillment.json` updated**: `create-walk-in-booking`/`create-scheduled-
      booking`'s request examples gained `staffId`/`staffName`; `get-earnings-summary` documented an
      optional `staffId` query param for the real backend to scope its response the same way

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
- Owner: [O3](business-owner.md#o3--performance-dashboard) dashboard — **the Earnings tab above
  covers this for solo**, not yet extended to per-staff/team-wide breakdowns,
  [O4](business-owner.md#o4--payout-approval) payouts,
  [O5](business-owner.md#o5--role-switching) role switching — **partially done**: customer↔business
  and solo↔team-tab-shape switching exist (`ProfileScreen`'s testing panel, `(business-app)/
  _layout.tsx`), but there's no real Staff/Front Desk session to switch *into* yet
- Staff: [S2](staff.md#s2--earnings-tracking) earnings — **done for the solo owner's own earnings**
  (the Earnings tab), not built as a distinct per-staff-member view (needs "your split" vs. the
  business's total, which needs actual Staff sessions to exist first),
  [S3](staff.md#s3--payout-request) payout request,
  [S4](staff.md#s4--availability) availability
