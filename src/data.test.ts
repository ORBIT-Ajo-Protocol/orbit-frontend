import { describe, it, expect } from "vitest";
import {
  INITIAL_ORBITS,
  ORBIT_FACTORY_ADDRESS,
  stellarExpertContractUrl,
} from "./data";

// Soroban contract addresses are strkey-encoded: 56 chars, starting with
// 'C'. Not re-implementing full strkey validation here (see orbit-backend's
// StrKey-based checks for that) — this is a much cheaper regression guard
// against the exact mistake that matters for THIS file: pasting a
// truncated or wrong-prefix address into seed data, which the Dashboard
// then renders as a clickable "verify this yourself" link.
function looksLikeContractAddress(address: string): boolean {
  return /^C[A-Z0-9]{55}$/.test(address);
}

describe("real testnet contract addresses in seed data", () => {
  it("factory address is a well-formed contract address", () => {
    expect(looksLikeContractAddress(ORBIT_FACTORY_ADDRESS)).toBe(true);
  });

  it("every sample orbit's contractAddress is well-formed", () => {
    const withAddresses = INITIAL_ORBITS.filter((o) => o.contractAddress);
    expect(withAddresses.length).toBeGreaterThan(0);
    for (const orbit of withAddresses) {
      expect(looksLikeContractAddress(orbit.contractAddress!)).toBe(true);
    }
  });

  it("no two orbits share a contract address", () => {
    const addresses = INITIAL_ORBITS.map((o) => o.contractAddress).filter(Boolean);
    expect(new Set(addresses).size).toBe(addresses.length);
  });
});

describe("stellarExpertContractUrl", () => {
  it("builds a testnet contract explorer URL", () => {
    const url = stellarExpertContractUrl(ORBIT_FACTORY_ADDRESS);
    expect(url).toBe(`https://stellar.expert/explorer/testnet/contract/${ORBIT_FACTORY_ADDRESS}`);
  });
});

describe("orbit seed data consistency", () => {
  it("livePotBalance never exceeds what the round could plausibly hold", () => {
    // contributionAmount * active member count is the max a round's pot
    // can hold before settling (see orbit-contract's maybe_settle_round) —
    // seed data implying more than that would misrepresent the protocol's
    // own invariant on the very dashboard that explains it.
    for (const orbit of INITIAL_ORBITS) {
      const activeMembers = orbit.members.filter((m) => m.status === "active").length;
      const roundCap = orbit.contributionAmount * activeMembers;
      expect(orbit.livePotBalance).toBeLessThanOrEqual(roundCap);
    }
  });

  it("currentRound never exceeds totalRounds", () => {
    for (const orbit of INITIAL_ORBITS) {
      expect(orbit.currentRound).toBeLessThanOrEqual(orbit.totalRounds);
    }
  });
});
