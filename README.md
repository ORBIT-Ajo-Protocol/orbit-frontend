# ORBIT Ajo Protocol — Frontend

Part of the [ORBIT Ajo Protocol](https://github.com/ORBIT-Ajo-Protocol) —
a rotating savings & credit association (ROSCA / "Ajo") built on Stellar
Soroban with staked collateral and member-voted default slashing. See also:
[orbit-contracts](https://github.com/ORBIT-Ajo-Protocol/orbit-contracts)
(Soroban smart contracts) and
[orbit-backend](https://github.com/ORBIT-Ajo-Protocol/orbit-backend)
(indexer + API).

React/Vite/Tailwind UI for the protocol: a member-facing mobile app
simulator (onboarding, contributions, payouts, dispute flagging, ZK
reputation sharing) and a web admin portal (deploy a group, dispute &
slashing hub, ZK proof verifier), plus a walkthrough of the protocol's four
stages (SEP-24 anchor, Soroban ROSCA, collateral slasher, ZK reputation).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how all three ORBIT repos fit
together and a detailed end-to-end workflow of the protocol.

## Status

**Currently fully simulated** — all on-chain, indexer, and anchor behavior
in this repo is faked client-side with `useState` and fixed timeouts (see
`src/components/MobileApp.tsx` and `src/components/WebPortal.tsx`). The real
contracts are deployed and the real backend is live (see the two repos
above); this frontend has not yet been wired to either. Concretely, that
means:

- Wallet addresses, transaction hashes, and ledger sequences shown in the UI
  are fabricated strings, not real chain data.
- The ZK reputation proof is a plaintext query string with hardcoded values,
  not a cryptographic proof.
- Contributions, payouts, staking, and slashing only mutate local React
  state and never touch the deployed `orbit-contract`/`orbit-factory`.

The Dashboard's live testnet contract links (factory + two sample orbits)
are a deliberate exception — those addresses are real, independently
verifiable on `stellar.expert`. Its stat numbers also tick up periodically
via a simulated "activity heartbeat" (a small pot-balance increment + a
matching Ledger log entry every 9–14s); that's explicitly dummy data for
demo texture, not a claim of live chain sync — see ARCHITECTURE.md.

## Run locally

**Prerequisites:** Node.js

```sh
npm install
npm run dev
```

Serves on `http://localhost:3000`. `npm run build` produces a static
`dist/` bundle; `npm run lint` runs `tsc --noEmit`.

No environment variables are required to run the app as-is — the
`GEMINI_API_KEY`/`APP_URL` entries in `.env.example` are leftover scaffolding
from the Google AI Studio template this project started from and are not
read anywhere in `src/`.

## Layout

- `src/App.tsx` — shell: top nav (5 views — Dashboard, Member App, Admin
  Portal, Ledger, Guide) on desktop, bottom tab bar on mobile, theming, and
  the Dashboard view itself.
- `src/components/MobileApp.tsx` — member app simulator (onboarding, SEP-24
  deposit/withdrawal, contributions, payouts, dispute flagging, ZK proof
  generation).
- `src/components/WebPortal.tsx` — Admin Portal: its own internal tabs for
  create-orbit, the dispute & slashing hub, and the ZK proof verifier (one
  component, `defaultTab` prop selects which tab opens).
- `src/components/ProtocolFlow.tsx` — the four-stage conceptual walkthrough
  (the Guide view).
- `src/components/NetworkLedger.tsx` — the simulated live log console.
- `src/data.ts` / `src/types.ts` — seed data and the `OrbitGroup`/`Member`/
  `UserWallet`/`LogEvent` domain model.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for what each piece maps to on the
real contracts/backend side, and the detailed end-to-end workflow.
