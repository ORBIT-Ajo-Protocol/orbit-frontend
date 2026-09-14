// Consumed by src/lib/api.ts to fetch each sample orbit's real on-chain
// state for the Dashboard (read-only — see ARCHITECTURE.md). The Member
// App / Admin Portal simulators are still fully simulated; that's a
// separate, larger wiring pass (real wallet signing, not just reads).
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";
