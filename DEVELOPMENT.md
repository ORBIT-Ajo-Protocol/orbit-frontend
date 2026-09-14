# Development history

What's actually happened across all three ORBIT repos since they were first
cloned, in order. Written from the real git history (`git log`), not from
memory — every change below corresponds to an actual commit.

## Starting point (2026-07-08)

All three repos were created the same day, split out from an original
monorepo into `orbit-contracts`, `orbit-backend`, and `orbit-frontend`
under the ORBIT-Ajo-Protocol org:

- **`orbit-contracts`**: the two Soroban contracts (`orbit-contract`,
  `orbit-factory`) already implemented and already tested end-to-end on
  Stellar testnet — factory deploy, orbit deploy via factory, member
  seating, activation, contribution/payout settlement all worked.
- **`orbit-backend`**: the indexer, REST API, WebSocket push, and mock
  SEP-24 anchor already implemented and already tested end-to-end against
  the deployed contracts — including a real `create_orbit` call built,
  signed, and submitted through the API.
- **`orbit-frontend`**: the React/Vite/Tailwind demo UI already built —
  member portal simulation, admin/web portal, protocol flow walkthrough —
  but still carrying leftover scaffolding from the Google AI Studio
  template it started from (a stray `GEMINI_API_KEY`/`APP_URL` in
  `.env.example`, unused `@google/genai` dependency, the browser tab titled
  "My Google AI Studio App").

So: **contracts and backend were real and proven from day one.** The
frontend was a complete UI, but everything in it — every on-chain
interaction, every balance, every transaction hash — was simulated
client-side, never wired to the real backend or contracts.

## Phase 1 — making the repos submittable (2026-09-13)

Triggered by evaluating the project against the Stellar Wave / Drips
funding program's criteria, which surfaced concrete gaps: no LICENSE file
in any repo (disqualifying for an "open-source" funding program regardless
of how public the repo was), no CI, and a leftover pre-split monorepo
clone (`orbit-ajo-protocol`, no `.git`) sitting alongside the real repos.

- Added an MIT `LICENSE` and a GitHub Actions CI workflow to **all three
  repos**. Contracts' CI runs `cargo test` + `cargo clippy` (which meant
  solving the actual build order first — `orbit-factory` won't compile at
  all until `orbit-contract` is built to wasm and optimized, since it
  imports that compiled artifact directly). Backend's CI typechecks and
  builds, including building the two generated client packages first
  (their `dist/` is gitignored, so a fresh checkout has nothing to
  typecheck against otherwise — this broke on the first attempt and was
  fixed in a follow-up commit). Frontend's CI typechecks and builds.
- Set up git/GitHub identity: commits and pushes to all three repos now go
  through the `ndii-dev` GitHub account, direct to `main`, no PRs.
- Identified (but did not delete) two things worth knowing about: a second
  GitHub org, `the-orbit-ajo-protocol`, holding an identical mirror of all
  three repos (created 3 days after the real one — unclear which is meant
  to be canonical), and a Desktop project called `ORBIT-WALLET` that is
  **unrelated** to this protocol despite the similar name (different org,
  different codebase).

## Phase 2 — frontend visual redesign (2026-09-13 – 2026-09-14)

The frontend UI was functionally complete but visually and structurally
rough: a desktop sidebar next to a mobile experience that trapped most of
the app's real interactions inside a fixed-height card with its own
internal scrollbar (the classic "phone simulator" pattern, applied even on
an actual phone), 7 top-level nav items where 3 were duplicate entry points
into the same component, dead AI Studio scaffolding, and a page ledger
console hardcoded to 256px regardless of screen size.

- **Navigation rebuild**: consolidated 7 sidebar items to 5 ("Deploy Smart
  Contracts" / "Admin Control Hub" / "ZK Reputation Verifier" were three
  separate entries all rendering the same `WebPortal` component with a
  different default tab — collapsed into one "Admin Portal" entry using
  that component's own internal tabs). Replaced the mobile hamburger +
  slide-out drawer with an always-visible bottom tab bar. Fixed
  `MobileApp`/`WebPortal`'s `h-[640px]` fixed height, which was active on
  every viewport instead of just the desktop layout it was designed for —
  on mobile this trapped the app's actual interactive screens (onboarding,
  contribute, dispute flows) in a small box fighting the page's own
  scroll.
- **Design system overhaul**: new type system (Space Grotesk for
  headings, Manrope for body, replacing Inter), a new neutral color
  palette, and a full dashboard rebuild — a plain-English explainer of
  what the protocol actually is, the real deployed testnet contract
  addresses surfaced as clickable `stellar.expert` links (not buried in a
  README), and real stat cards (dropped a fabricated "Reputation Issuer"
  card that never corresponded to anything real).
- **Fixed real bugs found along the way**: a mobile top-nav bar whose
  className was a plain string with a literal `${...}` instead of a
  template literal, so its theme colors silently never applied; the Ledger
  console's 256px fixed height regardless of viewport; the desktop header
  not being sticky, so it scrolled away on any page taller than one
  screen.
- **Added what was missing rather than just polishing what existed**: a
  site-wide footer (org/repo links, MIT badge) where the page previously
  just ended; scroll-triggered reveal animations and hover motion across
  card grids instead of a flat static fade; a proper header on the
  Protocol Guide page; a simulated "activity heartbeat" — one orbit's pot
  balance ticks up periodically (capped at that round's real contribution
  total) with a matching Ledger log entry, so the Dashboard's numbers and
  the Ledger feed move together and stay mutually consistent, instead of
  the whole UI reading as inert.

## Phase 3 — explaining the system (2026-09-14)

Added `ARCHITECTURE.md` (this repo) — a from-scratch explanation of how
the three repos fit together: every contract method and what it actually
does, the backend's four jobs, a table of every frontend view, and a
7-step walkthrough of the full protocol lifecycle (deploy → join/stake →
contribute/payout → dispute/slash → fiat on-ramp → reputation sharing →
indexing) with each step tagged **[LIVE]** or **[SIMULATED]** so it's
unambiguous which parts are real. Cross-linked from all three repos' READMEs
and the GitHub org profile.

## Phase 4 — working the issue backlog (2026-09-14)

All three repos had a backlog of open GitHub issues written when each was
first split out — some genuinely quick, several requiring real design
decisions or infrastructure this pass didn't have. Worked through as many
as could be done **properly** (implemented and verified, not just marked
closed) in one pass:

**`orbit-contracts`** (11 closed): a manual access-control + integer-
overflow audit that found and fixed a real gap — `propose_dispute` proved
the caller had signed but never verified they were actually a member of
the orbit, so an outsider could spam disputes against a legitimately-
overdue defaulter. Fixed, with a regression test. Also: 5 new test cases
(multi-round Auction end-to-end, concurrent disputes across independently-
deployed orbits, a member defaulting mid-cycle under each payout order, an
overflow-panic proof for the stake calculation), rustdoc on every
previously-undocumented public method, and three new docs — `SECURITY.md`
(the audit writeup plus the reasoning behind staying single-EOA-admin and
immutable-by-design for now), `ERROR_CODES.md` (every error code, the exact
scenario that triggers it, and one finding that a defined error is never
actually returned anywhere), `DEPLOYMENT.md` (a real mainnet checklist).
Test count: 11 → 19.

**`orbit-backend`** (18 closed): a real test suite (26 tests, run against
the actual docker-compose Postgres and real Stellar testnet RPC, not
mocked) that caught a genuine bug in the process — malformed `limit`/
`offset` query parameters produced `NaN`, which threw a 500 once it hit a
SQL `LIMIT`/`OFFSET`. Fixed with a shared, unit-tested clamping helper.
Split `server.ts` into a side-effect-free `app.ts` (importable by tests)
and a thin bootstrap. Fixed a real indexer bug: it fetched one 200-event
page from Soroban RPC then advanced its cursor to the scan's latest ledger
regardless of whether more than 200 events existed in that window —
silently capable of skipping events in a large backlog. Now paginates
properly via the RPC's cursor, with a reentrancy guard so overlapping poll
ticks can't race, and detects/recovers from a cursor that's aged past the
RPC's retention window instead of erroring forever. Added, and verified
actually working (not just written): rate limiting (confirmed the 6th
request in a window gets a real 429), structured logging with request IDs,
`/health` + `/metrics`, graceful shutdown on SIGTERM/SIGINT (confirmed
clean exit), a Dockerfile (actually built and run as a container against
the real DB), DB connection pool limits, WebSocket heartbeat + backpressure
handling, stricter address validation on every route (replacing opaque SDK
failures with clean 400s), an OpenAPI spec, a bindings-regeneration script,
and SEP-24/secrets-management planning docs.

**`orbit-frontend`** (3 closed): a real test suite (11 tests) — seed-data
sanity checks and an actual `<App />` render/navigation smoke test with
nothing mocked, which caught two real test-authoring mistakes along the
way (missing `cleanup()` between tests under vitest, and asserting on a
view swap synchronously when it goes through an animated transition). Also
a `VITE_API_BASE_URL` config placeholder for whoever wires the first real
backend call, and an empty state for the orbit list.

Left open, deliberately, because closing them would mean guessing at a
design decision or faking infrastructure this pass didn't have: an
auth/authz layer for the backend API (would change its current public
contract), integration tests against a live Soroban sandbox, real Stellar
Asset Contract integration tests (need a funded testnet identity), gas
profiling (needs real benchmarking tooling), real Auction-order rebate
economics (a financial-logic change that deserves more care than a solo
pass), and — the largest bucket — every frontend issue that amounts to
"wire this simulated flow to the real backend," which is genuinely
separate, substantial engineering, not a backlog item to rush.

## Where things stand now

Contracts and backend remain real and tested. The frontend is meaningfully
more honest about what it is — real contract links surfaced instead of
buried, an explicit [LIVE]/[SIMULATED] accounting in `ARCHITECTURE.md`,
real docs, real tests, real CI everywhere — but the core gap from day one
is unchanged: **the frontend is still not wired to the real backend or
contracts.** That's the next real piece of work, and it's sized like one:
not a quick pass, a proper implementation effort touching wallet signing,
transaction building, and replacing `MobileApp.tsx`/`WebPortal.tsx`'s
`useState`-based simulation with real calls end to end.
