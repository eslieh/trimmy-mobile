# API Contracts

Machine-readable request/response contracts for the backend (one JSON file per MVP phase,
matching [../TASKS.md](../TASKS.md)). They started as the app's *requirements* before the backend
existed; `trimmy-server` now implements every domain below, and entries are marked `live` as they
ship. Anything the app still needs is an entry with `"status": "requested"`, listed next.

## Open backend requests

What the app needs next from the backend, most urgent first. Each one has a full entry
(`"status": "requested"`) in the file named, with request/response examples and errors.

| Priority | Request | File → entry | Unblocks |
|---|---|---|---|
| P1 | Charging vs. staff completing: let `charge-booking` take a completed-but-unpaid booking, or stop unpaid bookings being completed via the status endpoint | fulfillment.json → `charge-booking` (issues) | Staff finishing their own appointments without losing the payment |
| P1 | Staff can see their own services | team.json → `get-my-staff-services` | Staff app "My services" |
| P2 | Push tokens (BK-41) | auth.json → `register-push-token` | Notifications for every role; push reminders |
| P2 | Day summary + submit to owner (F4) | fulfillment.json → `get-day-summary`, `submit-day-summary` | Front desk end-of-day reconciliation |
| P2 | Confirm front desk can use the public profile + every "owner or front desk" endpoint | fulfillment.json → `frontDeskNote` | Front desk app (F1–F3) |
| P2 | Reviews | booking.json → `create-review` | Customers leaving reviews |
| P3 | Reminder preferences (C5 "configurable") | — (not specified yet) | Customers turning reminders off / choosing times |
| P3 | Favorites | discovery.json → `favorites` | Wishlist that survives reinstalls |
| P3 | Bookings by customer | fulfillment.json → `list-business-bookings` (issues) | Full history on Customer Detail |
| P3 | `PATCH /businesses/{id}` ignores `amenities` | business-setup.json → `update-business-info` (issues) | Editing amenities after setup |

## Why JSON, not prose

Each file is a flat contract the backend team can read without cross-referencing the user-story
docs: for every screen, what request goes out and what response is expected back, with a
realistic example payload. Update these as decisions firm up (auth scheme, pagination, error
shape) — they should stay accurate enough to hand to a backend engineer as-is.

## File-per-phase

| File | Phase | Status |
|---|---|---|
| [auth.json](auth.json) | Auth | live (register, login, refresh, logout, verify-email, check-email, me + update/delete, change-password, forgot/verify-reset-otp/reset password, resend-otp, me/businesses, Google sign-in) |
| [business-setup.json](business-setup.json) | Phase 1 — Business setup | live on staging/prod (create/read/wizard writes + post-publish management: update-business, photos, services, categories, policies, payment, publish) |
| [discovery.json](discovery.json) | Phase 2 — Discovery | live on staging/prod (search — including all current filter params — + business profile, which embeds staff/reviews/policies; favorites/wishlist not yet covered — no story id for it in customer.md yet) |
| [booking.json](booking.json) | Phase 3 — Booking flow | live: availability, create/get/list bookings, M-Pesa deposit payment, cancel with manual refunds, reschedule |
| [fulfillment.json](fulfillment.json) | Phase 4 — Fulfillment view | live: business bookings, walk-in, scheduled, status, assign staff, checkout charge, customers, payouts + wallet balance. earnings summary |
| [team.json](team.json) | Phase 5 — Team management | live (my-invitations, respond, and list/add/update/remove team members) |

A "stub" file just holds the `domain` and an empty `endpoints` array — fill it in when that
phase actually starts, using `business-setup.json` as the template.

## Schema shape

Every file is:

```jsonc
{
  "domain": "business-setup",
  "baseUrl": "/api/v1",
  "auth": "All endpoints require a Bearer token for a user with role `owner` unless noted.",
  "endpoints": [
    {
      "id": "kebab-case-unique-id",
      "screen": "Screen name from the reference/*.md candidate screens list",
      "story": "O1",                 // story id from reference/*.md
      "method": "POST",
      "path": "/businesses",
      "description": "One line: what this call does and why the screen needs it",
      "auth": "owner",               // or "public", "customer", "front_desk", "staff"
      "request": { "...": "example request body, or null if none (e.g. GET)" },
      "response": { "...": "example success response body" },
      "errors": [
        { "status": 400, "code": "validation_error", "message": "..." }
      ]
    }
  ]
}
```

Notes for whoever fills these in:
- `request`/`response` are **example payloads**, not JSON Schema — keep them realistic (real
  field names, plausible dummy values) so they double as fixtures for mocking the API in-app
  before the backend exists.
- Reuse field names/casing consistently across files (e.g. always `businessId`, not sometimes
  `business_id`) — pick a convention now and note it here once decided.
- Every endpoint should trace back to a story id in `reference/{customer,business-owner,
  front-desk,staff}.md` so it's obvious why it's needed.
