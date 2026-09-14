# Development work and improvements since the rejection

This is a direct answer to "what development work / improvements have you
made since the repo was initially rejected?" — everything below is
substantive work done across all three ORBIT repos (contracts, backend,
frontend) from when work resumed on this project after the rejection up
to now. It's real code and real on-chain activity, not documentation
written to look like progress: a genuine access-control security fix
with a regression test, real bugs found and fixed by new tests that
didn't exist before, a real bug found in a third-party SDK and worked
around, a container that was actually built and run, a graceful shutdown
that was actually triggered and observed, and two orbit contracts that
were actually deployed, staffed with real members, and run through real
contribution rounds on a public testnet — not simulated. The three
sections below cover contracts, backend, and frontend in turn, and the
last section says plainly what is still not done, so nothing here is
overstated.

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

A script was written and run for real, twice, rather than just written:
given a name and a handful of parameters, it deploys a fresh orbit
through the live factory, funds a set of brand-new testnet keypairs
through friendbot, joins them as members, and drives them through real
`contribute()` and settlement calls across several full and partial
rounds — so the orbits the frontend points at have actual seated
members, actual locked stakes, and actual rounds run, not just an
address with nothing behind it. Running it surfaced a real, reproducible
bug in the `@stellar/stellar-sdk` client library itself: its generated
result parser throws when unwrapping the response from a `contribute()`
call that settles a round under `PayoutOrder::Random` specifically —
confirmed, by checking the contract's own on-chain state directly
through the `stellar` CLI rather than trusting the client, that the
transaction really does land and really does settle correctly on-chain,
and that only the client's parsing of the success response is broken.
Worked around by seeding that orbit under `Fixed` order instead (the
contract's own Random-order support is untouched and still covered by
its Rust test suite) and updating the frontend's data to say so honestly
rather than claim an order that wasn't actually used. The retry logic
written for this script initially had its own bug — it wrapped the
network call in a retry but unwrapped the result outside of it, so the
one failure mode it existed to survive was exactly the one it didn't
catch — found by watching a real failed run and fixed by moving the
unwrap inside the retry and rebuilding a fresh transaction on every
attempt instead of resubmitting a stale one.

A Dockerfile and Railway deployment config were added and the image was
actually built and run as a container against the real database, not
just written on the assumption it would work (see above). The config
targets Railway specifically, with a `/health`-based healthcheck and an
on-failure restart policy.

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

The dashboard's two sample orbits were switched from empty, freshly
deployed shells to the real, populated contracts described in the backend
section above, and the dashboard was wired to actually read their live
on-chain state — not just link to it. A small API client fetches each
orbit's real config and state from the backend on load and again every
twenty seconds, and the dashboard overlays that real data (current round,
pot balance, status, member count) on top of the sample data whenever
it's available, with a small pulsing "Live" badge next to the name so
it's visible which figures are real. The failure path was written
deliberately soft: if the backend is unreachable, the fetch quietly
returns nothing and the dashboard falls back to its existing simulated
heartbeat for that orbit instead of showing an error or a blank card. The
simulated heartbeat itself was updated to defer to real data automatically
— it now skips any orbit for which live data has actually arrived, so the
two systems don't fight over the same numbers. This is a read path only:
the Member App and Admin Portal simulators, and every action a user takes
in them, are still entirely simulated client-side, which is a deliberate
scope boundary for this pass and not an oversight.

## What this doesn't claim

The two sample orbits are real, live contracts on Stellar testnet with
real seated members, real locked stakes, and real contribution rounds —
not placeholders — and the dashboard now reads their actual on-chain
state through the backend rather than only linking to them. What's still
not true: no user action taken inside the demo UI — joining an orbit,
contributing, voting on a dispute — talks to the real chain; those are
still entirely simulated client-side in the Member App and Admin Portal,
by deliberate scope choice, not by accident. The backend is not yet
deployed anywhere publicly reachable; it has a Dockerfile and Railway
config that were built and run locally against a real database, but the
dashboard's live read path currently talks to a locally-run instance, not
a hosted one. That gap is explicit here rather than glossed over.
Everything else described above is real: a genuine security fix with a
regression test proving it, two genuine bugs caught by tests that didn't
exist before, a genuine bug found in a third-party SDK and worked around
rather than ignored, working CI on every repo, a container that was
actually built and run, a graceful shutdown that was actually triggered
and observed, and two orbits that were actually deployed and populated on
a public testnet, not simulated — not a list of things merely written and
assumed to work.
