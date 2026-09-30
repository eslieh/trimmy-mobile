# Trimyy — User Stories Reference

Source of truth for product requirements, split by **session (user type)** so each can be
turned into its own screen flow / navigator. A single human account can hold multiple
roles (e.g. an Owner who also works the chair), but in the data model and in these docs
each role is treated as an independent session with its own permissions and screens.

## Sessions (user types)

| Session | File | Core responsibility |
|---|---|---|
| Customer (Client) | [customer.md](customer.md) | Discover, book, pay, manage own appointments, maintain profile |
| Business Owner | [business-owner.md](business-owner.md) | Configure business, manage team, see all money, approve payouts, switch into Front Desk / Staff views |
| Front Desk | [front-desk.md](front-desk.md) | Run the calendar, handle walk-ins, check-in clients, collect payments, daily summaries |
| Staff (Stylist / Therapist / Technician) | [staff.md](staff.md) | Follow personal schedule, deliver services, track own earnings, request payouts |

## Other reference material

- [TASKS.md](TASKS.md) — phased MVP build tracker, checked off as work lands
- [api/](api/README.md) — JSON API contracts for the backend team, one file per phase

## How to use these docs

Each session file contains:

1. **Primary goal** — the one-line purpose of the session.
2. **Capabilities** — what the role can see/do, grouped by area.
3. **Explicitly NOT allowed** — guardrails, useful for permission checks and empty/blocked states.
4. **User stories** — `As a [role], I want [goal], so that [benefit]`, each with acceptance criteria.
5. **Candidate screens** — a first-pass list of screens implied by the stories above, meant as
   the starting point for the actual navigator/screen list for that session. Not final —
   use it to drive the "what screens does this session need" conversation.

## Role switching note

Owner, Front Desk, and Staff are distinct *sessions*, not just tabs — the app should be able
to render a self-contained flow for whichever role is currently active, and a user with
multiple roles switches between these sessions explicitly (see `O5` in
[business-owner.md](business-owner.md)).
