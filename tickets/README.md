# Tickets

Small, arch-linked units of work with acceptance criteria. They exist to stop
drift: every ticket says *why it matters* (linked to `docs/` architecture), what
"done" means, and what's explicitly **out of scope**.

Prefix: **TBA-** (Travel Booking Assistant). Numbered in rough build order.

## Format

- **Status** — TODO / IN PROGRESS / DONE
- **Size** — rough time box
- **Who codes** — `you` (new learning, hand-typed) or `claude (lift-and-shift)`
  (porting code the user already owns elsewhere; user explains it back to confirm
  ownership, no nitpicking working code)
- **Files in play** — keep the blast radius named and small
- **Why (the arch bit)** — links back to the locked design in `docs/`
- **Nest concepts in play** — primitives the ticket touches + where to read (the
  user knows Express, is new to Nest)
- **Acceptance criteria** — numbered, concrete, testable
- **Out of scope** — what to resist
- **Reading first** — short, linked
- **Review** — user says "done"; Claude reviews the `git diff` against criteria
  (or, for lift-and-shift, Claude implements and the user explains it back)
