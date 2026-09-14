import { API_BASE_URL } from '../config';

// Mirrors orbit-backend's GET /api/orbits/:address response shape (see
// that repo's src/routes/orbits.ts and openapi.yaml). Amounts come back as
// stringified i128 in the token's base unit (7 decimal places for a
// Stellar asset) — see stroopsToDisplay below.
export interface LiveOrbitConfig {
  admin: string;
  token: string;
  name: string;
  contribution_amount: string;
  frequency: { tag: 'Daily' | 'Weekly' | 'Monthly' };
  payout_order: { tag: 'Fixed' | 'Random' | 'Auction' };
  stake_bps: number;
  total_rounds: number;
}

export interface LiveOrbitState {
  status: 0 | 1 | 2; // Pending | Active | Completed
  current_round: number;
  live_pot_balance: string;
  member_count: number;
  last_payout_recipient: string | null;
  last_payout_amount: string;
}

export interface LiveOrbit {
  config: LiveOrbitConfig;
  state: LiveOrbitState;
  members: string[];
}

/** Stellar assets use 7 decimal places (1 unit = 10,000,000 stroops). */
export function stroopsToDisplay(stroops: string | number): number {
  return Number(stroops) / 10_000_000;
}

/**
 * Fetches an orbit's real on-chain state from the real backend. Returns
 * `null` on any failure (backend unreachable, orbit not found, network
 * error) rather than throwing — callers are expected to fall back to
 * simulated data when this returns null, not crash the dashboard because
 * a demo backend isn't running.
 */
export async function fetchLiveOrbit(address: string): Promise<LiveOrbit | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orbits/${address}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as LiveOrbit;
  } catch {
    return null;
  }
}
