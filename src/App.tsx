import React, { useState, useEffect } from 'react';
import { INITIAL_ORBITS, INITIAL_USER_WALLET, ORBIT_FACTORY_ADDRESS, stellarExpertContractUrl } from './data';
import { OrbitGroup, UserWallet, LogEvent } from './types';
import MobileApp from './components/MobileApp';
import WebPortal from './components/WebPortal';
import NetworkLedger from './components/NetworkLedger';
import ProtocolFlow from './components/ProtocolFlow';
import {
  LayoutDashboard, Smartphone, Activity, BookOpen, ArrowUpRight, Scale,
  Radio, ChevronRight, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ViewType = 'dashboard' | 'member-portal' | 'admin-portal' | 'ledger' | 'protocol';

export default function App() {
  const [orbits, setOrbits] = useState<OrbitGroup[]>(INITIAL_ORBITS);
  const [userWallet, setUserWallet] = useState<UserWallet>(INITIAL_USER_WALLET);
  const [incomingVerifierLink, setIncomingVerifierLink] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  // Initialize with some realistic system startup logs
  const [logs, setLogs] = useState<LogEvent[]>([
    {
      id: 'log_boot_1',
      timestamp: '04:00:10',
      type: 'ledger',
      message: 'System initialization complete. Connected to Stellar Pubnet Horizon endpoint.',
      details: 'Horizon URI: https://horizon.stellar.org\nChain ID: Public Global Stellar Network ; December 2015'
    },
    {
      id: 'log_boot_2',
      timestamp: '04:00:12',
      type: 'contract',
      message: 'Soroban: Synchronized OrbitFactory contract definition',
      details: 'Factory Address: CAS3J7GXHG76JCD...K2X7W7E\nRegistered WASM Hash: f9c02d184762ae31...982ab11'
    },
    {
      id: 'log_boot_3',
      timestamp: '04:00:15',
      type: 'indexer',
      message: 'Postgres Indexer: Initial database schema sync complete',
      details: 'Mirroring tables: orbits, members, contributions, payouts.\nListening to event filter: contract_id = CC3A...88X2'
    },
    {
      id: 'log_boot_4',
      timestamp: '04:00:16',
      type: 'websocket',
      message: 'WebSocket Server: Connected to frontend push channel',
      details: 'Active connections: 5 simulated mobile agents, 1 admin dashboard.'
    }
  ]);

  const addLog = (type: LogEvent['type'], message: string, details?: string) => {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    const newLog: LogEvent = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: time,
      type,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleNavigateToWebVerifier = (proofLink: string) => {
    setIncomingVerifierLink(proofLink);
    setActiveView('admin-portal');
  };

  const isLight = theme === 'light';

  // Shared entrance animation for card grids: parent staggers children in
  // rather than the whole grid popping in flat and static.
  const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const staggerItem = {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 220 } },
  };

  // Calculate dynamically for dashboard metrics
  const totalValueLocked = orbits.reduce((sum, o) => {
    // Escrow balance + Collateral locked (10% standard stake on total group size potential contributions)
    const activeMembersCount = o.members.filter(m => m.status === 'active').length;
    const collateralLocked = o.contributionAmount * activeMembersCount * (o.stakePercentage / 100);
    return sum + o.livePotBalance + collateralLocked;
  }, 0);

  const totalMembers = Array.from(
    new Set(orbits.flatMap(o => o.members.filter(m => m.status === 'active').map(m => m.id)))
  ).length;

  // Consolidated from 7 items to 5: "Deploy Smart Contracts", "Admin Control
  // Hub" and "ZK Reputation Verifier" were 3 separate top-level nav entries
  // that all rendered the same WebPortal component (just with a different
  // defaultTab) — WebPortal already has its own create/admin/verifier tab
  // switcher, so those 3 collapse into one "Admin Portal" entry.
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'member-portal', label: 'Member App', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'admin-portal', label: 'Admin Portal', icon: <Scale className="w-4 h-4" /> },
    { id: 'ledger', label: 'Ledger', icon: <Activity className="w-4 h-4" /> },
    { id: 'protocol', label: 'Guide', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-orange-600 selection:text-white transition-colors duration-300 ${
      isLight ? 'bg-[#F7F6F4] text-[#15151A]' : 'bg-[#0A0A0C] text-[#F5F4F2]'
    }`}>

      {/* --- DESKTOP HEADER (lg+): full-width top nav, no left rail --- */}
      <header className={`hidden lg:flex items-center justify-between px-10 h-[72px] shrink-0 border-b transition-colors duration-300 ${
        isLight ? 'bg-[#F7F6F4] border-[#15151A]/[0.09]' : 'bg-[#0A0A0C] border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-9">
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="currentColor" strokeWidth="1.6" transform="rotate(-24 12 12)" />
              <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="currentColor" strokeWidth="1.6" transform="rotate(24 12 12)" />
              <circle cx="12" cy="12" r="2.4" className="fill-orange-500" />
            </svg>
            <span className="font-display text-[17px] font-bold tracking-tight">ORBIT</span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ViewType)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-orange-500/[0.14] text-orange-500'
                      : (isLight ? 'text-[#15151A]/60 hover:text-[#15151A]' : 'text-white/50 hover:text-white')
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className={`w-[34px] h-[34px] rounded-[9px] border flex items-center justify-center transition-colors ${
              isLight ? 'border-[#15151A]/[0.09] text-[#15151A]/60 hover:text-[#15151A]' : 'border-white/[0.08] text-white/50 hover:text-white'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <div className={`flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-[10px] border ${
            isLight ? 'border-[#15151A]/[0.09]' : 'border-white/[0.08]'
          }`}>
            <div className="w-[22px] h-[22px] rounded-[7px] bg-gradient-to-tr from-orange-500 to-amber-300" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-[11px] font-bold">
                {userWallet.address ? `${userWallet.address.slice(0, 4)}…${userWallet.address.slice(-4)}` : 'GD7R…Z5PL'}
              </span>
              <span className={`text-[9.5px] font-semibold uppercase tracking-wide mt-0.5 ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>
                Stellar Testnet
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
          </div>
        </div>
      </header>

      {/* --- MOBILE TOP BAR (branding + theme only — navigation lives in the
          bottom tab bar below, not hidden behind a drawer) --- */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 border-b z-30 flex items-center justify-between px-4 select-none backdrop-blur-md transition-colors duration-300 ${
        isLight ? 'bg-[#F7F6F4]/95 border-[#15151A]/[0.09]' : 'bg-[#0A0A0C]/95 border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="currentColor" strokeWidth="1.6" transform="rotate(-24 12 12)" />
            <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="currentColor" strokeWidth="1.6" transform="rotate(24 12 12)" />
            <circle cx="12" cy="12" r="2.4" className="fill-orange-500" />
          </svg>
          <span className="font-display text-sm font-bold tracking-tight">ORBIT</span>
        </div>

        <button
          onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isLight ? 'border-[#15151A]/[0.09]' : 'border-white/[0.08]'}`}
        >
          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* --- MOBILE BOTTOM TAB BAR --- */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-30 grid grid-cols-5 transition-colors duration-300 ${
        isLight ? 'bg-[#F7F6F4]/95 border-[#15151A]/[0.09]' : 'bg-[#0A0A0C]/95 border-white/[0.08]'
      }`}>
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] font-bold ${
                isActive ? 'text-orange-500' : (isLight ? 'text-[#15151A]/40' : 'text-white/34')
              }`}
            >
              {item.icon}
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* --- MAIN PANEL WORKSPACE --- */}
      <main className="flex-1 flex flex-col min-w-0 pt-20 pb-24 lg:pt-11 lg:pb-14 px-4 lg:px-10 overflow-y-auto">
        <div className="w-full flex flex-col gap-9">

          <AnimatePresence mode="wait">

            {/* 1. VIEW: OVERVIEW DASHBOARD */}
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-9 text-left"
              >
                {/* HERO */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
                  <div className="max-w-[600px]">
                    <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-orange-500 mb-3.5">
                      Rotating Savings, On Soroban
                    </div>
                    <h1 className="font-display text-[28px] lg:text-[38px] leading-[1.14] font-semibold tracking-tight mb-4">
                      Ajo, the West African savings circle — as a smart contract.
                    </h1>
                    <p className={`text-[15px] leading-relaxed max-w-[480px] ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>
                      Members stake collateral, contribute on a schedule, and rotate the payout.
                      Default, and the group votes to slash your stake — enforced on-chain, not on trust.
                    </p>
                    <a
                      href="#" onClick={(e) => { e.preventDefault(); setActiveView('protocol'); }}
                      className={`inline-flex items-center gap-1.5 mt-4 text-[13px] font-bold border-b-[1.5px] border-orange-500 pb-0.5 ${isLight ? 'text-[#15151A]' : 'text-white'}`}
                    >
                      See how the protocol works
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 pt-1 w-full lg:w-auto">
                    <span className={`text-[11px] font-bold uppercase tracking-wide mb-0.5 ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>
                      Live on testnet — verify it yourself
                    </span>
                    <a
                      href={stellarExpertContractUrl(ORBIT_FACTORY_ADDRESS)}
                      target="_blank" rel="noopener noreferrer"
                      className={`flex items-center justify-between gap-5 px-3.5 py-3 rounded-[11px] border lg:min-w-[290px] transition-colors hover:border-orange-500/40 ${
                        isLight ? 'bg-white border-[#15151A]/[0.09]' : 'bg-[#131316] border-white/[0.08]'
                      }`}
                    >
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-orange-500">orbit-factory</span>
                        <span className={`font-mono text-[12px] truncate ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>{ORBIT_FACTORY_ADDRESS}</span>
                      </span>
                      <ArrowUpRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`} />
                    </a>
                    {orbits.filter(o => o.contractAddress).map(o => (
                      <a
                        key={o.id}
                        href={stellarExpertContractUrl(o.contractAddress!)}
                        target="_blank" rel="noopener noreferrer"
                        className={`flex items-center justify-between gap-5 px-3.5 py-3 rounded-[11px] border lg:min-w-[290px] transition-colors hover:border-orange-500/40 ${
                          isLight ? 'bg-white border-[#15151A]/[0.09]' : 'bg-[#131316] border-white/[0.08]'
                        }`}
                      >
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-500">{o.name}</span>
                          <span className={`font-mono text-[12px] truncate ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>{o.contractAddress}</span>
                        </span>
                        <ArrowUpRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* STATS */}
                <motion.div
                  variants={staggerContainer} initial="hidden" animate="show"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-5.5 rounded-[14px] border transition-colors hover:shadow-lg ${isLight ? 'bg-white border-[#15151A]/[0.09]' : 'bg-[#131316] border-white/[0.08]'}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>Total Value Locked</span>
                    <div className="flex items-baseline gap-1.5 mt-2.5">
                      <span className="font-display text-[28px] font-semibold">{totalValueLocked.toLocaleString()}</span>
                      <span className={`text-[13px] font-bold ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>USDC</span>
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-5.5 rounded-[14px] border transition-colors hover:shadow-lg ${isLight ? 'bg-white border-[#15151A]/[0.09]' : 'bg-[#131316] border-white/[0.08]'}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>Active Orbits</span>
                    <div className="flex items-baseline gap-1.5 mt-2.5">
                      <span className="font-display text-[28px] font-semibold">{orbits.length}</span>
                      <span className={`text-[13px] font-bold ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>deployed</span>
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-5.5 rounded-[14px] border transition-colors hover:shadow-lg ${isLight ? 'bg-white border-[#15151A]/[0.09]' : 'bg-[#131316] border-white/[0.08]'}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>Members Enrolled</span>
                    <div className="flex items-baseline gap-1.5 mt-2.5">
                      <span className="font-display text-[28px] font-semibold">{totalMembers}</span>
                      <span className={`text-[13px] font-bold ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>across both groups</span>
                    </div>
                  </motion.div>
                </motion.div>

                {/* ORBITS LIST */}
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="font-display text-[19px] font-semibold">Active Savings Orbits</h2>
                  </div>

                  <motion.div
                    variants={staggerContainer} initial="hidden" animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {orbits.map((orbit) => (
                      <motion.div
                        key={orbit.id}
                        variants={staggerItem}
                        whileHover={{ y: -3 }}
                        className={`p-5.5 rounded-[16px] border flex flex-col gap-4.5 transition-colors hover:shadow-lg ${
                          isLight ? 'bg-white border-[#15151A]/[0.09]' : 'bg-[#131316] border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display text-[16px] font-semibold mb-1">{orbit.name}</h3>
                            {orbit.contractAddress && (
                              <span className={`font-mono text-[11px] ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>
                                {orbit.contractAddress.slice(0, 6)}…{orbit.contractAddress.slice(-4)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-500 bg-emerald-500/12 px-2.5 py-1 rounded-full shrink-0">
                            {orbit.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <span className={`text-[10.5px] font-bold uppercase tracking-wide ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>Contribution</span>
                            <div className="text-[14px] font-bold mt-0.5">{orbit.contributionAmount} USDC / {orbit.frequency}</div>
                          </div>
                          <div>
                            <span className={`text-[10.5px] font-bold uppercase tracking-wide ${isLight ? 'text-[#15151A]/40' : 'text-white/34'}`}>Pot</span>
                            <div className="text-[14px] font-bold mt-0.5 text-orange-500">{orbit.livePotBalance} USDC</div>
                          </div>
                        </div>

                        <div>
                          <div className={`flex justify-between text-[11.5px] mb-1.5 ${isLight ? 'text-[#15151A]/60' : 'text-white/58'}`}>
                            <span>Round {orbit.currentRound} of {orbit.totalRounds}</span>
                            <span>{Math.round((orbit.currentRound / orbit.totalRounds) * 100)}%</span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-[#15151A]/[0.06]' : 'bg-white/[0.06]'}`}>
                            <div
                              className="h-full rounded-full bg-orange-500 transition-all duration-500"
                              style={{ width: `${(orbit.currentRound / orbit.totalRounds) * 100}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveView('member-portal')}
                          className={`self-start mt-0.5 px-4 py-2.5 rounded-[9px] text-[12.5px] font-bold transition-opacity hover:opacity-85 ${
                            isLight ? 'bg-[#15151A] text-[#F7F6F4]' : 'bg-[#F5F4F2] text-[#0A0A0C]'
                          }`}
                        >
                          View Orbit
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* 2. VIEW: MEMBER PORTAL SIMULATOR */}
            {activeView === 'member-portal' && (
              <motion.div
                key="member-portal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* Mobile Frame Simulator - Centered perfectly */}
                <div className="lg:col-span-5 flex justify-center w-full">
                  <MobileApp
                    orbits={orbits}
                    setOrbits={setOrbits}
                    userWallet={userWallet}
                    setUserWallet={setUserWallet}
                    addLog={addLog}
                    onNavigateToWebVerifier={handleNavigateToWebVerifier}
                    theme={theme}
                    setTheme={setTheme}
                  />
                </div>

                {/* Educational/Helper Side panel */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className={`p-6 rounded-3xl border transition-colors duration-300 ${
                    isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'
                  }`}>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-orange-500">
                      Interactive Client Simulation Workspace
                    </span>
                    <h3 className={`font-serif italic text-lg md:text-xl font-medium mt-1 mb-3.5 ${isLight ? 'text-zinc-900 font-bold' : 'text-white'}`}>
                      Simulating the Member Mobile Experience
                    </h3>

                    <div className="space-y-4 text-xs leading-relaxed">
                      <p className={isLight ? 'text-zinc-600' : 'text-white/60'}>
                        The mobile client interface on the left represents the member-facing application. Users can onboarding themselves using standard local Nigerian credentials and biometrics, simulate funding a wallet via a Stellar SEP-24 compliant gateway, and interact with smart ROSCA groups.
                      </p>

                      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        isLight ? 'bg-orange-50/50 border-orange-200/50' : 'bg-orange-950/10 border-orange-900/10'
                      }`}>
                        <Radio className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <span className={`font-semibold text-xs ${isLight ? 'text-zinc-900' : 'text-white'}`}>Simulating Real-Time Block Sync</span>
                          <p className={`mt-0.5 text-[11px] ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                            Any payment contribute, payout claim, or ZK-proof generation inside the phone interface is processed locally and broadcast to our emulated database indexer. The state synchronizes instantly, prompting realistic Horizon and WebSocket server logging.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <span className={`text-[10px] uppercase font-bold tracking-wider block ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>
                          Key Features to Simulate inside the App:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className={`p-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200/80' : 'bg-white/5 border-white/5'}`}>
                            <span className="font-bold text-orange-500 font-mono text-xs block">01. Onboarding Flow</span>
                            <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Reset the app or start onboarding to register telephone numbers and simulate WebAuthn FIDO2 passkeys on-chain.</span>
                          </div>
                          <div className={`p-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200/80' : 'bg-white/5 border-white/5'}`}>
                            <span className="font-bold text-orange-500 font-mono text-xs block">02. SEP-24 deposits</span>
                            <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Add funds by exchanging Naira (NGN) for USDC, mimicking standard local bank transfers and stellar ledger sequences.</span>
                          </div>
                          <div className={`p-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200/80' : 'bg-white/5 border-white/5'}`}>
                            <span className="font-bold text-orange-500 font-mono text-xs block">03. Group Contributions</span>
                            <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Contribute USDC to Lagos Solar or Abuja Galaxy, update live smart contract balances, and inspect the D3 line charts.</span>
                          </div>
                          <div className={`p-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200/80' : 'bg-[#050505] border-white/5'}`}>
                            <span className="font-bold text-orange-500 font-mono text-xs block">04. Dispute Flagging</span>
                            <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Flag suspicious ledger transactions to trigger details reviews and dispute summary panels in the history views.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. VIEW: ADMIN PORTAL (create / admin / verifier — WebPortal's own tabs) */}
            {activeView === 'admin-portal' && (
              <motion.div
                key="admin-portal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <WebPortal
                  orbits={orbits}
                  setOrbits={setOrbits}
                  addLog={addLog}
                  incomingVerifierLink={incomingVerifierLink}
                  clearIncomingVerifierLink={() => setIncomingVerifierLink('')}
                  theme={theme}
                  defaultTab="create"
                />
              </motion.div>
            )}

            {/* 4. VIEW: STELLAR LEDGER MONITOR */}
            {activeView === 'ledger' && (
              <motion.div
                key="ledger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full text-left"
              >
                <div className="mb-4">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-orange-500">
                    Real-Time Stellar Sequence & Indexer
                  </span>
                  <h2 className={`font-serif italic text-lg md:text-xl font-medium mt-1 ${isLight ? 'text-zinc-900 font-bold' : 'text-white'}`}>
                    Postgres Indexer logs Console
                  </h2>
                </div>
                <NetworkLedger
                  logs={logs}
                  clearLogs={clearLogs}
                  theme={theme}
                />
              </motion.div>
            )}

            {/* 5. VIEW: PROTOCOL FLOW GUIDE */}
            {activeView === 'protocol' && (
              <motion.div
                key="protocol"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <ProtocolFlow theme={theme} />
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

    </div>
  );
}
