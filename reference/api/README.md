# API Contracts

Machine-readable request/response contracts for the backend team, one JSON file per MVP phase
(matching [../TASKS.md](../TASKS.md)). These are the app's *requirements* of the backend, not a
description of anything already built — no API layer exists in the app yet (see the codebase
audit in TASKS.md), so every value here is illustrative dummy data for now.

## Why JSON, not prose

Each file is a flat contract the backend team can read without cross-referencing the user-story
docs: for every screen, what request goes out and what response is expected back, with a
realistic example payload. Update these as decisions firm up (auth scheme, pagination, error
shape) — they should stay accurate enough to hand to a backend engineer as-is.

## File-per-phase

| File | Phase | Status |
|---|---|---|
| [business-setup.json](business-setup.json) | Phase 1 — Business setup | drafted |
| [discovery.json](discovery.json) | Phase 2 — Discovery | stub |
| [booking.json](booking.json) | Phase 3 — Booking flow | stub |
| [fulfillment.json](fulfillment.json) | Phase 4 — Fulfillment view | stub |
| [team.json](team.json) | Phase 5 — Team management | drafted (invitation endpoints only, needed by Get Started) |

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
