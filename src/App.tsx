import React, { useState, useEffect } from 'react';
import { INITIAL_ORBITS, INITIAL_USER_WALLET, ORBIT_FACTORY_ADDRESS, stellarExpertContractUrl } from './data';
import { OrbitGroup, UserWallet, LogEvent } from './types';
import MobileApp from './components/MobileApp';
import WebPortal from './components/WebPortal';
import NetworkLedger from './components/NetworkLedger';
import ProtocolFlow from './components/ProtocolFlow';
import {
  LayoutDashboard, Smartphone, Activity, BookOpen, ArrowUpRight, Scale,
  Radio, Award, UserCheck, ChevronRight, Coins, RefreshCw
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
  const sidebarItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'member-portal', label: 'Member Portal App', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'admin-portal', label: 'Admin Portal', icon: <Scale className="w-4 h-4" /> },
    { id: 'ledger', label: 'Stellar Ledger Monitor', icon: <Activity className="w-4 h-4" /> },
    { id: 'protocol', label: 'Protocol Flow Guide', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen flex font-sans antialiased selection:bg-orange-600 selection:text-white relative transition-colors duration-300 ${
      isLight ? 'bg-[#F4F4F6] text-zinc-800' : 'bg-[#050505] text-[#E0E0E0]'
    }`}>
      
      {/* Background Decorative Rings */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 z-0 overflow-hidden">
        <div className={`absolute top-[5%] left-[50%] -translate-x-1/2 w-[1200px] h-[1200px] border border-dashed rounded-full ${isLight ? 'border-zinc-300' : 'border-white/10'}`}></div>
        <div className={`absolute top-[15%] left-[50%] -translate-x-1/2 w-[900px] h-[900px] border border-dashed rounded-full ${isLight ? 'border-zinc-300' : 'border-white/15'}`}></div>
        <div className={`absolute top-[25%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] border rounded-full ${isLight ? 'border-zinc-200' : 'border-white/10'}`}></div>
      </div>

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className={`hidden xl:flex flex-col w-72 shrink-0 border-r z-20 relative select-none transition-colors duration-300 ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'
      }`}>
        {/* Sidebar Header Brand */}
        <div className={`p-6 border-b flex items-center justify-between ${isLight ? 'border-zinc-150' : 'border-white/5'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/15 blur-md rounded-full"></div>
              <div className={`relative border p-1.5 rounded-xl flex items-center justify-center text-orange-500 ${isLight ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <RefreshCw className="w-5.5 h-5.5 animate-spin-slow" />
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h1 className={`text-base font-serif italic tracking-widest leading-none ${isLight ? 'text-zinc-900 font-bold' : 'text-white font-medium'}`}>ORBIT</h1>
                <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono border ${isLight ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-white/5 text-orange-400 border-white/10'}`}>
                  v1.0
                </span>
              </div>
              <p className={`text-[8px] tracking-wider uppercase font-sans mt-0.5 leading-none ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>
                Soroban Rotating Savings
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className={`px-2.5 pb-2.5 text-[9px] uppercase tracking-widest font-semibold font-sans text-left ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
            Network Navigation
          </div>
          {sidebarItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 text-left border ${
                  isActive 
                    ? (isLight 
                        ? 'bg-zinc-900 border-transparent text-white shadow-md' 
                        : 'bg-white border-transparent text-black font-bold shadow-lg shadow-white/5')
                    : (isLight 
                        ? 'bg-transparent border-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900' 
                        : 'bg-transparent border-transparent hover:bg-white/5 text-white/60 hover:text-white')
                }`}
              >
                <div className={`shrink-0 ${isActive ? (isLight ? 'text-white' : 'text-black') : 'text-orange-500'}`}>
                  {item.icon}
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className={`w-1 h-3 rounded-full ${isLight ? 'bg-white' : 'bg-black'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Connected Wallet Info Area */}
        <div className={`p-4 border-t transition-colors duration-300 ${isLight ? 'border-zinc-150' : 'border-white/5'}`}>
          <div className={`flex items-center gap-3 p-2.5 rounded-2xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/3 border-white/5'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-300 shadow-sm flex items-center justify-center text-[10px] font-bold text-zinc-950 shrink-0 border border-white/10">
              A
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className={`text-[8px] uppercase tracking-wider block font-bold leading-none ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                Connected Wallet
              </span>
              <span className={`text-[10px] font-mono font-bold block mt-1 leading-none ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                {userWallet.address ? `${userWallet.address.slice(0, 6)}...${userWallet.address.slice(-6)}` : 'GDU8...4X2W'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[8px] uppercase font-bold ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Stellar</span>
            </div>
          </div>

          {/* Quick theme toggler in sidebar */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>
              Theme Preference
            </span>
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                isLight 
                  ? 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
              }`}
            >
              {isLight ? '☾ Dark' : '☀ Light'}
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR (branding + theme only — navigation lives in the
          bottom tab bar below, not hidden behind a drawer) --- */}
      <div className={`xl:hidden fixed top-0 left-0 right-0 h-16 border-b z-30 flex items-center justify-between px-4 select-none backdrop-blur-md transition-colors duration-300 ${
        isLight ? 'bg-white/95 border-zinc-200 text-zinc-800 shadow-sm' : 'bg-[#09090A]/95 border-white/10 text-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4.5 h-4.5 text-orange-500 animate-spin-slow" />
          <span className="text-sm font-serif italic tracking-widest font-bold">ORBIT</span>
          <span className="text-[8px] font-mono text-orange-400 border border-orange-500/25 px-1 rounded-full uppercase">v1</span>
        </div>

        <button
          onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className={`p-1.5 rounded-lg border transition-all ${isLight ? 'border-zinc-200' : 'border-white/10'}`}
        >
          {isLight ? '☾' : '☀'}
        </button>
      </div>

      {/* --- MOBILE BOTTOM TAB BAR --- */}
      <nav className={`xl:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-30 grid grid-cols-5 transition-colors duration-300 ${
        isLight ? 'bg-white/95 border-zinc-200' : 'bg-[#09090A]/95 border-white/10'
      }`}>
        {sidebarItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`flex flex-col items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-wide ${
                isActive ? 'text-orange-500' : (isLight ? 'text-zinc-400' : 'text-white/40')
              }`}
            >
              {item.icon}
              <span className="leading-none text-center px-0.5">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* --- MAIN PANEL WORKSPACE --- */}
      <main className="flex-1 flex flex-col min-w-0 xl:p-8 pt-20 pb-24 xl:pb-12 px-4 relative z-10 overflow-y-auto">
        {/* No max-w cap, no mx-auto: let content fill the space next to the
            sidebar instead of floating in a centered column with growing
            gutters on wide viewports. */}
        <div className="w-full flex flex-col gap-6">

          <AnimatePresence mode="wait">
            
            {/* 1. VIEW: OVERVIEW DASHBOARD */}
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                {/* Dashboard Jumbotron/Greeting */}
                <div className={`rounded-3xl p-6 border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
                  isLight 
                    ? 'bg-gradient-to-tr from-white to-zinc-50 border-zinc-200 shadow-sm' 
                    : 'bg-[#09090A] border-white/10 shadow-2xl shadow-orange-950/5'
                }`}>
                  <div className="space-y-1 relative z-10 max-w-xl">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-orange-500">
                      Stellar Soroban Sovereign Network Console
                    </span>
                    <h2 className={`font-serif italic text-xl md:text-2xl font-medium tracking-wide ${isLight ? 'text-zinc-950 font-semibold' : 'text-white'}`}>
                      Orbit Rotating Credit & Savings Protocol Monitor
                    </h2>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                      Welcome to the decentralized control tower. Monitor autonomous Soroban smart contracts, track on-chain deposits and rotate payouts, resolve defaults via consensus-based collateral slashing, and verify anonymized trust proofs.
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-start md:items-end gap-1 font-sans relative z-10">
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                      Global Epoch Sequence
                    </span>
                    <span className="font-mono text-xl font-bold text-orange-500">
                      LEDGER #481,291
                    </span>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                      Public Net Horizon Client
                    </span>
                  </div>

                  {/* Gradient Background Decoration */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* One-line explainer + real testnet contract links. Full concept
                    explanation lives on the Protocol Flow Guide page — this is
                    just enough to orient a first-time visitor, not a wall of text. */}
                <div className={`rounded-2xl px-5 py-4 border flex flex-col md:flex-row md:items-center gap-3 md:gap-6 transition-all duration-300 ${
                  isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'
                }`}>
                  <p className={`text-xs leading-relaxed flex-1 min-w-0 ${isLight ? 'text-zinc-600' : 'text-white/60'}`}>
                    <strong className={isLight ? 'text-zinc-900' : 'text-white'}>ORBIT</strong> is <strong>Ajo</strong> (a
                    West African rotating savings group) as a Soroban smart contract: staked collateral, scheduled
                    contributions, rotating payout, member-voted slashing on default.{' '}
                    <a
                      href="#" onClick={(e) => { e.preventDefault(); setActiveView('protocol'); }}
                      className="text-orange-500 font-semibold hover:underline whitespace-nowrap"
                    >
                      How it works →
                    </a>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={stellarExpertContractUrl(ORBIT_FACTORY_ADDRESS)}
                      target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all hover:border-orange-500/40 ${
                        isLight ? 'bg-zinc-50 border-zinc-200/80 text-zinc-600' : 'bg-white/5 border-white/5 text-white/60'
                      }`}
                    >
                      <span className="uppercase font-sans font-bold text-orange-500 text-[9px]">factory</span>
                      {ORBIT_FACTORY_ADDRESS.slice(0, 6)}…{ORBIT_FACTORY_ADDRESS.slice(-4)}
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                    </a>
                    {orbits.filter(o => o.contractAddress).map(o => (
                      <a
                        key={o.id}
                        href={stellarExpertContractUrl(o.contractAddress!)}
                        target="_blank" rel="noopener noreferrer"
                        title={o.name}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all hover:border-orange-500/40 ${
                          isLight ? 'bg-zinc-50 border-zinc-200/80 text-zinc-600' : 'bg-white/5 border-white/5 text-white/60'
                        }`}
                      >
                        <span className="uppercase font-sans font-bold text-orange-500 text-[9px]">{o.name.split(' ')[0]}</span>
                        {o.contractAddress!.slice(0, 6)}…{o.contractAddress!.slice(-4)}
                        <ArrowUpRight className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Stat Metrics Bento Grid (4 Cards) */}
                <motion.div
                  variants={staggerContainer} initial="hidden" animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {/* Card 1: TVL */}
                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-4.5 rounded-2xl border transition-colors duration-300 hover:shadow-lg ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Total Value Locked (TVL)</span>
                      <Coins className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1">
                      <span className="font-mono text-xl font-bold text-orange-500">{totalValueLocked.toLocaleString()}</span>
                      <span className={`font-sans text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>USDC</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1 py-0.2 rounded font-mono">+$50.00 Last Cycle</span>
                      <span className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Real-Time Escrow</span>
                    </div>
                  </motion.div>

                  {/* Card 2: Connected Orbits */}
                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-4.5 rounded-2xl border transition-colors duration-300 hover:shadow-lg ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Soroban Smart Contracts</span>
                      <RefreshCw className="w-4 h-4 text-orange-500 animate-spin-slow" />
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1">
                      <span className={`font-mono text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{orbits.length}</span>
                      <span className={`font-sans text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Deployed</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1 py-0.2 rounded font-mono">100% Active</span>
                      <span className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>0 Default Terminations</span>
                    </div>
                  </motion.div>

                  {/* Card 3: Total Enrolled Users */}
                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-4.5 rounded-2xl border transition-colors duration-300 hover:shadow-lg ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Active Peer Members</span>
                      <UserCheck className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1">
                      <span className={`font-mono text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{totalMembers}</span>
                      <span className={`font-sans text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Enrolled</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1 py-0.2 rounded font-mono">100% Repay Compliant</span>
                      <span className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Passkey Registered</span>
                    </div>
                  </motion.div>

                  {/* Card 4: Reputation Issuer Status */}
                  <motion.div variants={staggerItem} whileHover={{ y: -3 }} className={`p-4.5 rounded-2xl border transition-colors duration-300 hover:shadow-lg ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Reputation Issuer State</span>
                      <Award className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1">
                      <span className="font-mono text-xl font-bold text-orange-500">ZK-Verified</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1 py-0.2 rounded font-mono">Issuer Online</span>
                      <span className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Secured Credentials</span>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Full-width: quick actions/recent-events duplicated the sidebar
                    nav and the Ledger Monitor page, so they were cut rather than
                    squeezed into a side column here. */}
                <div className="space-y-4">
                    <h3 className={`font-serif italic text-sm font-medium flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      <RefreshCw className="w-4 h-4 text-orange-500 animate-spin-slow" /> Active Deployed Savings Orbits
                    </h3>

                    <motion.div
                      variants={staggerContainer} initial="hidden" animate="show"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {orbits.map((orbit) => {
                        const completedRounds = orbit.currentRound - 1;
                        const compliancePercent = Math.round(
                          (orbit.members.filter(m => m.status === 'active').length / orbit.members.length) * 100
                        );
                        return (
                          <motion.div
                            key={orbit.id}
                            variants={staggerItem}
                            whileHover={{ y: -3 }}
                            className={`p-4 rounded-2xl border flex flex-col justify-between h-48 transition-colors duration-300 hover:shadow-lg ${
                              isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#09090A] border-white/10'
                            }`}
                          >
                            <div className="space-y-1.5 text-left">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-serif italic text-xs font-semibold uppercase">{orbit.name}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-mono border uppercase font-semibold ${
                                  orbit.status === 'active' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                                    : 'bg-zinc-500/10 text-zinc-400 border-white/5'
                                }`}>
                                  {orbit.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                                <div>
                                  <span className={`text-[8px] uppercase block ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Payout Sequence</span>
                                  <span className="font-bold">{orbit.frequency} Rotation</span>
                                </div>
                                <div>
                                  <span className={`text-[8px] uppercase block ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>USDC Contribution</span>
                                  <span className="font-mono font-bold text-orange-500">{orbit.contributionAmount} USDC</span>
                                </div>
                              </div>
                            </div>

                            {/* Cycle Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-sans">
                                <span className={isLight ? 'text-zinc-400' : 'text-white/30'}>Rotation Progress:</span>
                                <span className="font-semibold">{orbit.currentRound} of {orbit.totalRounds} Rounds</span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full relative overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-white/5'}`}>
                                <div 
                                  className="absolute top-0 bottom-0 left-0 bg-orange-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(orbit.currentRound / orbit.totalRounds) * 100}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-250 dark:border-white/5 text-[10px]">
                              <div className="flex items-center gap-1">
                                <span className={isLight ? 'text-zinc-400' : 'text-white/30'}>Pot:</span>
                                <span className="font-mono font-bold text-orange-500">{orbit.livePotBalance} USDC</span>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveView('member-portal');
                                }}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border flex items-center gap-1 transition-all ${
                                  isLight 
                                    ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800' 
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                }`}
                              >
                                View Live <ChevronRight className="w-3 h-3 text-orange-500" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
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

            {/* 6. VIEW: STELLAR LEDGER MONITOR */}
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

            {/* 7. VIEW: PROTOCOL FLOW GUIDE */}
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
