# ORBIT Ajo Protocol — Architecture

This document explains how the three ORBIT repos fit together — contracts,
backend, frontend — and walks through the full protocol workflow end to end.
It's written for someone who has never seen the codebase before.

If you just want a one-paragraph summary: **ORBIT digitizes "Ajo"** (a
West African rotating savings & credit association, also called a ROSCA) as
a Soroban smart contract on Stellar. A group of members each contribute a
fixed amount on a schedule; each round, the pooled contributions pay out to
one member, until everyone has been paid once. Members stake collateral
upfront, and if someone defaults, the group votes to slash their stake
instead of the pool absorbing the loss.

## The three repos

| Repo | Language | Role |
|---|---|---|
| [`orbit-contracts`](https://github.com/ORBIT-Ajo-Protocol/orbit-contracts) | Rust (Soroban) | The protocol's actual logic, on-chain |
| [`orbit-backend`](https://github.com/ORBIT-Ajo-Protocol/orbit-backend) | Node/TypeScript | Indexer, REST/WebSocket API, mock fiat on-ramp |
| [`orbit-frontend`](https://github.com/ORBIT-Ajo-Protocol/orbit-frontend) | React/Vite/TypeScript | Member app + admin portal (this repo) |

They're deliberately separate repos rather than a monorepo: contracts have
their own Rust toolchain and release cadence, the backend is a long-running
service, and the frontend is a static bundle — different build/deploy
lifecycles.

### 1. `orbit-contracts` — the protocol logic

Two Soroban contracts:

- **`orbit-factory`** — one instance for the whole protocol. Deploys a new
  `orbit-contract` instance per savings group and keeps a registry of every
  group ever created.
- **`orbit-contract`** — one instance *per savings group* ("an orbit").
  Holds membership, collateral, the contribution/payout state machine, and
  dispute resolution for that one group.

`orbit-factory` depends on a **compiled wasm artifact** of `orbit-contract`
(via `soroban_sdk::contractimport!`), not its source crate — two Soroban
`#[contract]` crates can't depend on each other directly, since their macros
generate identically-named wasm exports that would collide. This is why the
contracts repo's build order matters: `orbit-contract` must be built and
optimized to wasm *before* `orbit-factory` will compile at all (see that
repo's README for the exact commands).

**Public methods on `orbit-contract`** (the group contract):

| Method | Who calls it | What it does |
|---|---|---|
| `initialize` | factory, at creation | Sets config: token, contribution amount, frequency, payout order, stake %, round count |
| `add_member` | admin | Registers a member and their rotation slot |
| `lock_stake` | member | Locks that member's collateral — required before the group activates |
| `activate` | admin | Flips the group from pending to active once staking is done |
| `contribute` | member, every round | Transfers that round's contribution into the pot; auto-settles and pays out the round's recipient once conditions are met (see below) |
| `place_bid` | member (Auction orbits only) | Signals the smallest payout they'd accept, for `PayoutOrder::Auction` groups |
| `propose_dispute` | any active member | Opens a dispute against a member who missed their contribution past the grace period |
| `vote_slash` | member | Votes yes/no on an open dispute |
| `finalize_dispute` | anyone, after voting closes | Executes the outcome — slashes the defaulter's stake to the pool if the vote passed |
| `get_config` / `get_state` / `get_members` / `get_member_info` / `has_contributed` / `get_dispute` | anyone | Read-only views |

There's no separate "claim payout" call — `contribute()` calls an internal
`maybe_settle_round` after recording the contribution, which pays out the
pot and advances to the next round automatically once the round's condition
is met. Collateral is collected via `lock_stake` *before* activation, not on
a member's first contribution, so a member who defaults on round 1 without
ever contributing still has collateral on the line.

**Live on testnet right now** — see that repo's README for the actual
addresses and `stellar.expert` explorer links (factory + two sample groups:
"Lagos Solar Orbit" and "Abuja Galaxy Orbit").

### 2. `orbit-backend` — indexer, API, mock anchor

A Node/TypeScript service with four jobs:

1. **Indexer** (`src/indexer/poller.ts`) — polls Soroban `getEvents` for the
   factory and every known orbit address, persists new events to Postgres,
   and auto-registers newly created orbits by watching the factory's
   `created` event.
2. **REST API** (`src/routes/`) — reads (`GET /api/orbits`,
   `GET /api/orbits/:address`, etc.) and *transaction building*
   (`POST /api/orbits/:address/tx`, `POST /api/factory/tx`) — these return
   **unsigned** transaction XDR, never a signature. The backend never holds
   a member's private key; the caller's own wallet signs, then submits via
   `POST /api/tx/submit`. This is what "non-custodial" means concretely.
3. **WebSocket feed** (`src/ws/hub.ts`) — broadcasts each newly indexed
   event to connected clients in real time.
4. **Mock SEP-24 anchor** (`src/routes/sep24.ts`) — SEP-24 is the Stellar
   standard for fiat on/off-ramps. A *real* one needs bank rails, KYC, and
   an interactive TOML flow, which is out of scope here. The mock exists so
   the demo moves real testnet funds on deposit instead of just incrementing
   a fake UI number — `POST /api/sep24/deposit` actually pays out from a
   funded testnet account.

Status: **live and tested end-to-end against Stellar testnet** — the
indexer, every REST route, and the mock deposit have each been exercised
against the real deployed contracts. It is not yet consumed by the
frontend (see below).

### 3. `orbit-frontend` — member app + admin portal

React/Vite/Tailwind, currently **fully simulated** — see "Status" below.
Five views (`src/App.tsx`):

| View | Renders | Purpose |
|---|---|---|
| Dashboard | — | Landing view: what the protocol is, live contract links, TVL/orbit/member stats, the two active orbits |
| Member App | `src/components/MobileApp.tsx` | The member-facing app: onboarding, SEP-24 deposit, contributions, payout claims, dispute flagging, ZK reputation sharing |
| Admin Portal | `src/components/WebPortal.tsx` | Three internal tabs: deploy a new orbit, run the dispute/slashing hub, verify a ZK reputation proof |
| Ledger | `src/components/NetworkLedger.tsx` | Live-updating log console of simulated chain/indexer/websocket activity |
| Guide | `src/components/ProtocolFlow.tsx` | Interactive four-stage walkthrough of the protocol mechanics |

## Status: what's real vs. simulated, precisely

This is the part most worth reading carefully, because the three repos are
at different levels of "real":

| Layer | Status |
|---|---|
| Contracts | **Real.** Deployed and tested on testnet. |
| Backend | **Real.** Live, tested end-to-end against the deployed contracts. |
| Frontend | **Simulated.** Every on-chain, indexer, and anchor interaction in `MobileApp.tsx`/`WebPortal.tsx` is faked client-side with `useState` and fixed timeouts. It has not been wired to the real backend or contracts yet. |

Concretely, in the frontend today: wallet addresses and transaction hashes
shown in the UI are fabricated strings, not real chain data; the "ZK
reputation proof" is a plaintext query string with hardcoded values, not a
cryptographic proof; contributions/payouts/staking/slashing only mutate
local React state. The Dashboard's live testnet contract links (factory +
the two sample orbits) are a deliberate exception — those addresses are
real and independently verifiable on `stellar.expert`, surfaced specifically
so the simulated parts of the demo aren't the *only* thing a visitor sees.
The Dashboard's stat numbers also tick up periodically via a simulated
"activity heartbeat" (a small pot-balance increment + matching Ledger log
entry every 9–14s) — that's explicitly dummy data for demo texture, not a
claim of live chain sync.

## Detailed workflow: how an orbit actually runs, end to end

This walks through the full lifecycle. Each step is tagged **[LIVE]** if
it's implemented and provably working today (contracts + backend), or
**[SIMULATED]** if it currently only exists as frontend UI state.

**1. Deploy the group — [LIVE] on contracts + backend, [SIMULATED] in the UI**

An admin fills out the "Create Orbit" form (Admin Portal → Create tab):
group name, size, contribution amount, frequency, payout order, stake %.
The backend's `POST /api/factory/tx` with `method: create_orbit` builds an
unsigned transaction calling `orbit-factory`'s `create_orbit`, which deploys
a fresh `orbit-contract` instance and calls its `initialize`. The admin's
wallet signs, and `POST /api/tx/submit` submits it. *Today, the frontend's
Create tab only mutates local state — it doesn't call the backend yet.*

**2. Members join and stake — [LIVE], [SIMULATED] in the UI**

Each member is registered (`add_member`) and calls `lock_stake` to lock
their collateral (a percentage of the contribution amount, set at group
creation). Once every member has staked, the admin calls `activate`, and
the group's `OrbitStatus` flips to `Active`. In the Member App, onboarding +
"joining an orbit" simulates this with a fake passkey/biometric step.

**3. Each round, members contribute — [LIVE], [SIMULATED] in the UI**

A member calls `contribute`, which transfers that round's contribution
amount (a real token transfer, via the Soroban token client) into the
contract's custody and records it. Once the round's contribution condition
is satisfied, the contract's internal `maybe_settle_round` fires
automatically inside that same call: it pays the full pot to that round's
recipient (determined by `PayoutOrder`: `Fixed` — a preset rotation order;
`Random` — chosen on-chain; `Auction` — whoever placed the lowest `place_bid`
that round) and advances `current_round`. In the Member App, the
"Contribute" action and the D3 pot-balance chart are simulated locally.

**4. A member defaults — [LIVE], [SIMULATED] in the UI**

If a member doesn't contribute before the grace period (set at group
creation) elapses, any other active member can call `propose_dispute`
against them. Other members call `vote_slash` (yes/no). Once voting closes,
`finalize_dispute` executes the outcome: if the vote passed, the defaulter's
locked stake is slashed and redistributed to the pool, reimbursing the
group instead of leaving them short. The Admin Portal's "Dispute & Slashing
Hub" simulates this with a scripted defaulter and a fake vote tally.

**5. Fiat on/off-ramp — [LIVE] (mocked, moves real testnet funds), [SIMULATED] in the UI**

A member wants to fund their wallet from Naira (NGN). The backend's mock
SEP-24 anchor (`POST /api/sep24/deposit`) actually pays out "USDC" (native
XLM on orbits using the native asset) from a funded testnet account — so a
balance change in a test against this endpoint is real, even though there's
no real bank transfer or KYC behind it. The Member App's SEP-24 deposit flow
does not call this endpoint yet; it fakes the balance change client-side.

**6. Reputation sharing — not implemented on-chain; [SIMULATED] in the UI only**

After completing a group successfully, a member can generate a "ZK
reputation proof" to share with a third-party lender, proving a clean
repayment history without revealing wallet identity. This is entirely
UI-only today: the "proof" is a plaintext URL query string with hardcoded
values, not a cryptographic proof, and there's no reputation-issuer contract
on-chain. It's the one piece of the walkthrough with no real backing yet on
either the contracts or backend side.

**7. Watching it all happen — [LIVE] backend, [SIMULATED] in the UI**

The backend's indexer polls every known orbit + the factory for new events
and mirrors them into Postgres; the WebSocket hub pushes each new event to
connected clients live. The frontend's Ledger console *looks* like this
same thing, but it's currently fed by locally-generated fake log entries
(plus the simulated activity heartbeat), not the real WebSocket feed.

## Data flow diagram

```
                 ┌──────────────────────┐
  create_orbit → │     orbit-factory     │  deploys one orbit-contract
                 │  (one per protocol)   │  instance per group, tracks
                 └───────────┬───────────┘  all deployed addresses
                              │ deploy_v2 + initialize
                              ▼
                 ┌──────────────────────┐
                 │     orbit-contract     │  one instance per group:
                 │   (one per orbit)      │  membership, stake, contribute
                 └───────────┬───────────┘  /maybe_settle_round, disputes
                              │ getEvents (poll)
                              ▼
                 ┌──────────────────────┐
                 │     orbit-backend      │  indexes events → Postgres,
                 │ (indexer + API + ws)   │  serves REST reads, builds
                 └───────────┬───────────┘  unsigned tx XDR (non-custodial)
                              │ (not yet wired)
                              ▼
                 ┌──────────────────────┐
                 │     orbit-frontend      │  member app + admin portal
                 │   (fully simulated)     │  — currently faked client-side
                 └──────────────────────┘
```

## Where to go next

- Want to touch the contracts? Start with `orbit-contracts/README.md` —
  build order matters (see above).
- Want to run the real backend against the real contracts? Start with
  `orbit-backend/README.md` — `docker compose up -d` + the API table there.
- Want to wire this frontend to the real backend? Start in
  `src/components/MobileApp.tsx` and `src/components/WebPortal.tsx` — every
  simulated action is a self-contained handler that currently calls
  `setState`; each one is documented above with the real endpoint/contract
  method it should call instead.
