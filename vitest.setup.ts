import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Without this, each test's render(<App />) accumulates in the DOM instead
// of being torn down before the next test — the exact cause of the
// "found multiple elements" failures this file was written to explain.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement these; framer-motion's whileInView (used by the
// footer) needs IntersectionObserver, and matchMedia is a common
// jsdom-vs-browser gap for CSS-aware libraries. Minimal stubs — nothing
// under test asserts on actual intersection/media-query behavior.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error -- test-environment stub, not a full type-correct implementation
globalThis.IntersectionObserver = MockIntersectionObserver;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
