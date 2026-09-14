import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// A real render smoke test: mounts the actual App (real state, real child
// components — MobileApp, WebPortal, NetworkLedger, ProtocolFlow — nothing
// mocked out) and drives real navigation. Framer-motion's animations run
// for real too; nothing here waits on them, it just asserts on the DOM
// they produce.
describe("App", () => {
  it("renders the dashboard by default with real seed data", () => {
    render(<App />);
    expect(screen.getByText(/Ajo, the West African savings/i)).toBeInTheDocument();
    // "Lagos Solar Orbit" legitimately appears twice by design — once as
    // the hero's live-contract-link badge, once as the orbit card's own
    // heading — so this asserts presence via getAllByText, not exactly one.
    expect(screen.getAllByText("Lagos Solar Orbit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Abuja Galaxy Orbit").length).toBeGreaterThan(0);
  });

  it("surfaces the real testnet factory contract address as a link", () => {
    render(<App />);
    const link = screen.getByText(/CA5BML.*FLZK/).closest("a");
    expect(link).toHaveAttribute(
      "href",
      "https://stellar.expert/explorer/testnet/contract/CA5BMLNRG6OU7U6ZVPO4MUDHG5EHAGGMV3QTGQL4NS2IW35RKITLFLZK"
    );
  });

  it("navigates between views via the desktop top nav", async () => {
    // jsdom doesn't apply the real CSS behind the "hidden lg:hidden"
    // Tailwind classes that keep desktop nav and the mobile bottom tab bar
    // from both being visible at once — both sets of nav buttons exist in
    // the DOM simultaneously in this test environment, with the same
    // labels. Scope to the semantic <header> (the desktop nav) to avoid
    // ambiguous matches against the mobile tab bar's duplicates.
    const user = userEvent.setup();
    render(<App />);
    const desktopNav = within(screen.getByRole("banner"));

    // findByText (not getByText) because the view swap runs through
    // framer-motion's AnimatePresence mode="wait" — the new view's content
    // doesn't mount until the previous one's exit transition resolves,
    // which isn't necessarily synchronous with the click even in jsdom.
    await user.click(desktopNav.getByRole("button", { name: /guide/i }));
    expect(await screen.findByText(/How ORBIT Actually Works/i)).toBeInTheDocument();

    await user.click(desktopNav.getByRole("button", { name: /ledger/i }));
    expect(await screen.findByText(/Postgres Indexer logs Console/i)).toBeInTheDocument();

    await user.click(desktopNav.getByRole("button", { name: /dashboard/i }));
    expect(await screen.findByText(/Ajo, the West African savings/i)).toBeInTheDocument();
  });

  it("toggles theme when the header's theme button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const root = container.firstChild as HTMLElement;
    const desktopNav = within(screen.getByRole("banner"));

    const initiallyDark = root.className.includes("0A0A0C");
    // The theme button is icon-only (Sun/Moon, no visible text) — it's the
    // only button in the header without an accessible name.
    const themeButton = desktopNav.getAllByRole("button").find((b) => b.textContent === "");
    expect(themeButton).toBeDefined();

    await user.click(themeButton!);
    expect(root.className.includes("0A0A0C")).toBe(!initiallyDark);
  });

  it("renders the org/repo links in the footer", () => {
    render(<App />);
    const githubLink = screen.getByRole("link", { name: /github org/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/ORBIT-Ajo-Protocol");
  });
});
