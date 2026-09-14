// Not consumed anywhere yet — every on-chain/backend interaction in this
// app is still simulated client-side (see README "Status"). This exists so
// wiring a flow to the real backend (see ARCHITECTURE.md) means importing
// this constant instead of first inventing where the base URL should live.
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";
