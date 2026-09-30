# Customer (Client)

**Primary goal:** Find, book, pay for, and attend personal care services with minimal friction.

## Capabilities

**Discovery**
- Search businesses by location/"near me", service type, price range, rating/reviews
- Browse business profiles (photos, services, prices, policies) and staff profiles (bios, specialties, ratings)

**Booking**
- Select service, staff (or "any available"), and date & time from real availability
- See deposit requirement, amount, and cancellation/no-show policy before confirming
- Complete a 3-tap booking flow: confirm service + time → confirm payment method → confirm booking

**Payment**
- Trigger M-Pesa STK push for deposit or full prepayment
- View payment status: `pending_payment`, `confirmed`, `refunded`

**Appointment management**
- View upcoming and past appointments
- Reschedule and cancel within policy
- Receive reminders via push/SMS/WhatsApp (e.g. 24h, 2h before)

**Profile & preferences**
- Manage name, phone, email, default location, preferred payment method
- Save favorite businesses and favorite staff
- Upload reference images and personal notes/preferences visible to providers

## Explicitly NOT allowed

- View other clients' data or appointments
- View business financials, staff schedules (beyond their own bookings), or internal settings
- Change pricing, policies, or staff assignments

## User stories

### C1 — Search & discovery
As a customer, I want to search for salons and staff near me by service, price, and rating, so that I can quickly find a trusted provider for my needs.

**Acceptance criteria**
- Home screen has a search bar (service, business, staff), a "near me" default location (changeable), and quick filters (category, price range, rating)
- Searching "haircut" returns businesses/staff offering haircuts near my location
- Each result shows: name, distance, starting price, average rating, thumbnail
- Filters (e.g. "under KSh 800", "4.5+ stars") update results instantly
- Tapping a result opens a business/staff profile with services, prices, photos, reviews, policies

### C2 — Booking flow
As a customer, I want to book an appointment in as few steps as possible, so that I can secure a slot without back-and-forth messages or calls.

**Acceptance criteria**
- From a profile, select a service from a clear list (name, duration, price)
- See available time slots for the next 7 days (or configurable window)
- Choose a specific staff member or "Any available"
- 3-step flow: (1) confirm service + staff + time, (2) review deposit/prepay + cancellation policy, (3) confirm booking
- If deposit/prepay required: prompt for phone number, send M-Pesa STK, booking shows `pending_payment` until paid
- If no deposit required, booking confirms immediately
- After confirmation: in-app confirmation screen (business, staff, service, date/time, payment status, cancel/reschedule link) + push/SMS/WhatsApp confirmation

### C3 — Manage appointments
As a customer, I want to view, reschedule, or cancel my appointments within policy, so that I can adapt my plans without calling the salon.

**Acceptance criteria**
- "My Appointments" tab with Upcoming, Past, Cancelled
- Each upcoming appointment shows business & staff, service, date & time, payment status, Reschedule/Cancel actions
- Reschedule shows alternative slots for the same service & staff (or business); any fee is shown before confirming
- Cancel shows refund outcome (full/partial/none) and penalty fees before confirming
- After reschedule/cancel: updated status in "My Appointments" + confirmation notification

### C4 — Saved styles & preferences
As a customer, I want to save my style preferences and reference images, so that my stylist knows exactly what I want without long explanations.

**Acceptance criteria**
- "My Styles" section: upload images (hair, nails, beard, etc.) + notes (e.g. "low fade with line-up")
- When booking, staff can see my past services with that business/staff, plus saved reference images and notes
- Can mark images/notes as "Favorite" or "Default for haircuts"
- Can delete or edit saved preferences at any time

### C5 — Reminders
As a customer, I want to receive timely reminders before my appointments, so that I don't forget and don't lose money on no-show fees.

**Acceptance criteria**
- Reminder 24h before and 2h before a confirmed appointment (configurable)
- Reminders include business name, staff, service, time, location (map link), and actions: Reschedule, Cancel, Directions
- On a missed appointment, a clear explanation of any no-show fee and its effect on future bookings with that business

## Candidate screens

Grouped by flow, in the shape of a navigator. `(modal)` = presented over the current stack, not a new tab.

**Tab: Discover** (`C1`)
- **Home / Discover** — search bar (service, business, staff), location chip, quick filter chips (category, price, rating), horizontal "near me" result cards, sections for "Favorites" and "Recently viewed". Empty state: no location permission → prompt to set location manually.
- **Search Results** — list/map toggle, active filter bar, sort control (distance / price / rating), result card (thumbnail, name, distance, starting price, rating). Loading skeleton + empty state ("no results, try widening filters").
- **Filter Sheet** *(modal)* — category, price range slider, rating minimum, distance radius, apply/reset.
- **Business Profile** — cover photos, name, rating, policies summary (deposit/cancellation), services list, staff list, reviews, map/address, "Book" CTA (sticky).
- **Staff Profile** — photo, bio, specialties, rating, services they perform, availability preview, "Book with [name]" CTA.

**Flow: Booking** (`C2`, launched from a profile)
- **Select Service** — service list grouped by category (name, duration, price), single-select, sticky "Continue".
- **Select Staff** — "Any available" option pinned first, staff cards with rating/specialty.
- **Select Date & Time** — horizontal date scroller (7–14 days), time slot grid per selected date, disabled/unavailable slots visibly muted.
- **Review & Policies** — service/staff/time summary, deposit amount + cancellation/no-show policy text, edit links back to each prior step.
- **Payment Method** — M-Pesa phone number input (prefilled from profile), "Send STK Push" primary action, alternate methods if enabled later.
- **STK Push Pending** *(modal/full-screen)* — spinner + instructions ("check your phone"), polling state, timeout/retry, success/failure transition.
- **Booking Confirmed** — confirmation summary, add-to-calendar action, "View appointment" / "Done".

**Tab: Appointments** (`C3`, `C5`)
- **My Appointments** — segmented control (Upcoming / Past / Cancelled), appointment card (business, staff, service, date/time, payment status badge).
- **Appointment Detail** — full details, map/directions, Reschedule and Cancel actions, receipt/payment status.
- **Reschedule** *(modal)* — reuses Select Date & Time, shows fee impact if any, confirm step.
- **Cancel Confirmation** *(modal)* — refund/fee breakdown, reason picker (optional), confirm/keep-booking.
- **No-show notice** *(inline banner or modal)* — explains fee applied and future-booking impact.

**Tab: Profile**
- **Profile Home** — name/phone/email, default location, preferred payment method, edit entry points.
- **Edit Profile** — form fields, save/validation states.
- **My Styles** — grid of saved reference images with notes, "Favorite" / "Default for [category]" toggles, add-image action.
- **Style Detail / Add Style** *(modal)* — image upload/camera, notes field, category tag, favorite toggle, delete.
- **Favorites** — saved businesses and staff, quick "Book again" action.
- **Notification Preferences** — reminder timing toggles (24h/2h), channel toggles (push/SMS/WhatsApp).
