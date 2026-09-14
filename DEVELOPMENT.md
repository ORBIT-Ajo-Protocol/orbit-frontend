# What's changed

A description of the substantive work done across all three ORBIT repos
since the project was last reviewed — real code, not just documentation.

## Contracts

A manual security review found and fixed a real access-control gap:
`propose_dispute` proved the caller had signed but never verified they
were actually a member of the orbit, so an outsider with no stake in the
group could open disputes against a legitimately-overdue defaulter. Fixed,
with a regression test proving it. The same review covered integer
overflow/underflow on the stake and pot math — confirmed the contract
relies on `overflow-checks = true` in the release profile (the one
actually used to build the deployed wasm) to catch overflow rather than
silently wrap, and added a test that proves it panics as expected rather
than just asserting it does.

Five new test cases were added: a full multi-round Auction-order cycle run
end to end (not just one round), concurrent disputes proven independent
across two separately-deployed orbits, and a member defaulting mid-cycle
verified to recover correctly under each of the three payout orders
(Fixed, Random, Auction). Test count went from 11 to 19, all passing.

Two design decisions that were previously open questions got resolved and
written down, not implemented: staying with a single admin key rather than
multisig for now, because no member funds are actually admin-gated (member
contributions, staking, and payout settlement are all member- or
protocol-driven); and confirming the contracts are immutable by design,
with no upgrade path, because that's the simpler and more auditable trust
model for a protocol whose entire value proposition is that the rules
can't change out from under a member after they've staked collateral.
Separately, verified — with a new test, not just an assertion — that
rotating the factory's registered wasm hash cannot retroactively affect
already-deployed orbit instances, since each is a separate contract with
its own wasm baked in at deploy time.

New documentation: every error code on both contracts, with the exact
scenario that triggers it (including a finding that one defined error is
never actually returned anywhere in the code); a real mainnet deployment
checklist covering the audit, admin-key, and token questions that would
need resolving before any deployment with real funds; rustdoc added to
every public method that lacked it.

## Backend

Went from zero automated tests to a real suite of 26, run against an
actual Postgres instance and, for a couple of routes, real Stellar testnet
RPC — not mocked. Writing that suite caught a genuine bug before it
shipped further: malformed `limit`/`offset` query parameters produced
`NaN`, which throws a 500 once it reaches a SQL `LIMIT`/`OFFSET` clause.
Fixed with a shared, unit-tested clamping helper, applied to both paginated
routes.

A second real bug was found and fixed in the event indexer: it fetched one
200-event page from the Soroban RPC, then advanced its position tracker to
the scan's latest ledger regardless of whether more than 200 events
actually existed in that window — meaning it was silently capable of
skipping events in any backlog larger than 200. It now pages properly
through the RPC's own cursor until a page comes back partially full, with
a guard so two poll cycles can't overlap and race on the same database
row. It also now detects a cursor that's aged past what the RPC still
retains (e.g. after extended downtime) and recovers by logging the gap
honestly and re-bootstrapping, instead of erroring on every poll forever.

Added, and actually verified working rather than just written: rate
limiting (confirmed by hammering an endpoint past its limit and getting a
real 429 back); structured request logging with a request ID that
round-trips in the response headers; a `/health` endpoint that checks real
database connectivity and whether the indexer has gone stale, and a
`/metrics` endpoint in Prometheus format; graceful shutdown on SIGTERM/
SIGINT, confirmed by sending the real signal and watching it drain
in-flight work and exit cleanly instead of just dying; a Dockerfile that
was actually built and run as a container against the real database over
host networking, not just written and assumed to work; database connection
pool limits with error recovery; WebSocket connection heartbeat (evicting
dead connections) and backpressure handling (skipping a broadcast to a
client whose send buffer is backed up instead of letting it grow
unboundedly); and strict address validation on every route that takes a
Stellar contract or account address, replacing opaque SDK failures with
clean, immediate 400 responses.

New documentation: a full OpenAPI specification for the REST API; a script
that automates what was previously a multi-step manual process for
regenerating the TypeScript contract bindings after a redeploy; a written
plan for what a real SEP-24 anchor integration would require (a licensed
partner, `stellar.toml` discovery, the interactive KYC flow, webhook
handling) versus the mock that exists today; and reasoning for why a
secrets-manager integration isn't being built yet at this scale, and what
should change before one is needed.

Deliberately not touched: adding an authentication/authorization layer to
the API, because that would change its current public contract and is a
design decision, not something to make unilaterally; and integration tests
against a live Soroban sandbox, which needs infrastructure this pass
didn't have.

## Frontend

The UI was functionally complete but had real, specific problems, not just
matters of taste — each one traced down and fixed rather than papered
over. The mobile top navigation bar's styling was silently dead because
its className was a plain string with a stray `${...}` in it instead of a
template literal — a real, if invisible, bug. The member-app and
admin-portal components had a fixed height active on every screen size,
not just the desktop layout it was designed for, which on mobile trapped
the app's actual interactive screens inside a small box with its own
scrollbar fighting the page's own scroll — the exact opposite of usable.
The activity ledger's log console was hardcoded to a fixed 256 pixels
regardless of screen size, leaving most of a tall page empty. The desktop
header wasn't sticky, so it scrolled out of view on any page taller than
one screen. All fixed.

Structurally, seven top-level navigation items were consolidated to five:
three of them were separate entry points into the exact same underlying
component, which already had its own internal tab switcher for exactly
that purpose. The mobile hamburger-and-drawer pattern was replaced with an
always-visible bottom tab bar, since hiding navigation behind a tap a
first-time visitor has to discover is a real usability cost. A full visual
redesign followed a drafted-and-approved mockup rather than being iterated
blind: a new type system, a new color palette, and a rebuilt dashboard that
leads with a plain-English explanation of what the protocol actually is
and puts the real, live, independently-verifiable testnet contract
addresses front and center as clickable links — rather than something a
visitor would have to already know to look for in a README.

A footer was added where the page previously just ended with no closing
content at all. A simulated activity heartbeat was added so the numbers on
the dashboard aren't static and dead — but built so that the pot balance,
the total-value-locked figure, and the activity log all derive from one
single, capped state change, so they stay mutually consistent with each
other rather than reading as independently-flickering, obviously-fake
numbers sitting next to genuinely real contract links.

A real test suite was added — render and navigation tests against the
actual component tree with nothing mocked out, plus sanity checks on the
seed data itself (that the real contract addresses are well-formed, that
no two orbits share an address, that the displayed pot balance can never
exceed what the underlying contract's own settlement logic would actually
allow given the real member count). A full architecture document was
written explaining how the three repositories fit together, what every
contract method actually does, and a step-by-step walkthrough of the whole
protocol lifecycle with each step explicitly marked as either real or
simulated — so nothing in this project overstates what's actually working
versus what's still a demonstration.

## What this doesn't claim

The frontend is still not wired to the real backend or the real deployed
contracts — every on-chain interaction a user takes in the demo UI is
still simulated client-side. That gap is explicitly documented, not
hidden, in this repo's own architecture notes. Everything described above
is real: a genuine security fix with a regression test proving it, two
genuine bugs caught by tests that didn't exist before, working CI on every
repo, a container that was actually built and run, and a graceful shutdown
that was actually triggered and observed — not a list of things merely
written and assumed to work.
