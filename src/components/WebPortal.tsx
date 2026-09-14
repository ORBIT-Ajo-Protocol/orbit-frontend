import React, { useState, useEffect } from 'react';
import { OrbitGroup, Member, LogEvent, PayoutOrderType } from '../types';
import { 
  Plus, Users, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle2, 
  Trash2, Send, Check, RefreshCw, Star, ArrowUpRight, Copy, Award, Shield, 
  HelpCircle, CircleDot, Info, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WebPortalProps {
  orbits: OrbitGroup[];
  setOrbits: React.Dispatch<React.SetStateAction<OrbitGroup[]>>;
  addLog: (type: LogEvent['type'], message: string, details?: string) => void;
  incomingVerifierLink: string;
  clearIncomingVerifierLink: () => void;
  theme?: 'dark' | 'light';
  defaultTab?: TabType;
}

type TabType = 'create' | 'admin' | 'verifier';

export default function WebPortal({ 
  orbits, 
  setOrbits, 
  addLog,
  incomingVerifierLink,
  clearIncomingVerifierLink,
  theme,
  defaultTab
}: WebPortalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab || 'create');

  // Sync activeTab when defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  // Create Orbit form states
  const [orbitName, setOrbitName] = useState<string>('Enugu Solar Orbit');
  const [groupSize, setGroupSize] = useState<number>(5);
  const [contributionAmount, setContributionAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<OrbitGroup['frequency']>('Weekly');
  const [payoutOrder, setPayoutOrder] = useState<PayoutOrderType>('fixed');
  const [stakePercentage, setStakePercentage] = useState<number>(10);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Admin Dashboard states
  const [selectedAdminOrbitId, setSelectedAdminOrbitId] = useState<string>('orbit_lagos_solar');
  const [smsPhoneInput, setSmsPhoneInput] = useState<string>('+234 ');
  const [disputeInProgress, setDisputeInProgress] = useState<boolean>(false);
  const [slashVoteCounts, setSlashVoteCounts] = useState({ yes: 0, no: 0, voted: [] as string[] });
  
  // Verifier Portal states
  const [pasteUrlInput, setPasteUrlInput] = useState<string>('');
  const [verifyingProof, setVerifyingProof] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    address?: string;
    completedCycles?: number;
    completionRate?: number;
    error?: string;
  } | null>(null);

  // Listen to incoming verifier links from the phone's QR copy action
  useEffect(() => {
    if (incomingVerifierLink) {
      setPasteUrlInput(incomingVerifierLink);
      setActiveTab('verifier');
      // Auto run verification
      handleVerifyUrl(incomingVerifierLink);
      clearIncomingVerifierLink();
    }
  }, [incomingVerifierLink]);

  const selectedAdminOrbit = orbits.find(o => o.id === selectedAdminOrbitId) || orbits[0];

  // ACTION 1: DEPLOY CONTRACT VIA ORBIT FACTORY
  const handleCreateOrbit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    addLog('contract', `OrbitFactory: Deploying contract for OrbitGroup [${orbitName}]`, `Compiling Soroban smart contract...\nInitializing constructor arguments:\n- Name: ${orbitName}\n- Contribution: ${contributionAmount} USDC\n- Frequency: ${frequency}\n- Payout: ${payoutOrder}\n- Stake Required: ${stakePercentage}%`);

    setTimeout(() => {
      const newOrbitId = `orbit_${orbitName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      // Generate some standard initial members for the new group
      const defaultMembers: Member[] = [
        {
          id: 'user_efe',
          name: 'Efe Adebayo (YOU)',
          phone: '+234 801 234 5678',
          status: 'active',
          rotationIndex: 0,
          address: 'GD7R...Z5PL',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          completedCycles: 4,
          completionRate: 100
        },
        {
          id: `new_member_1`,
          name: 'Ibrahim Musa',
          phone: '+234 809 999 1111',
          status: 'invited',
          rotationIndex: 1,
          address: 'GA8K...H9W1',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
          completedCycles: 1,
          completionRate: 100
        },
        {
          id: `new_member_2`,
          name: 'Chioma Obi',
          phone: '+234 809 999 2222',
          status: 'invited',
          rotationIndex: 2,
          address: 'GCL2...X9Y4',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          completedCycles: 2,
          completionRate: 98
        }
      ];

      // Add other empty spots to match groupSize
      for (let i = 3; i < groupSize; i++) {
        defaultMembers.push({
          id: `new_member_${i}`,
          name: `Unassigned Slot ${i + 1}`,
          phone: '',
          status: 'invited',
          rotationIndex: i,
          address: 'G___...____',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          completedCycles: 0,
          completionRate: 100
        });
      }

      // Initial history (all false)
      const roundsHistory: { [memberId: string]: boolean[] } = {};
      defaultMembers.forEach(m => {
        roundsHistory[m.id] = Array(groupSize).fill(false);
      });

      const newOrbit: OrbitGroup = {
        id: newOrbitId,
        name: orbitName,
        contributionAmount,
        frequency,
        payoutOrder,
        stakePercentage,
        totalRounds: groupSize,
        currentRound: 1,
        status: 'pending',
        members: defaultMembers,
        daysToNextContribution: 7,
        livePotBalance: 0,
        roundsHistory
      };

      setOrbits(prev => [...prev, newOrbit]);
      setSelectedAdminOrbitId(newOrbitId);
      setIsDeploying(false);
      setActiveTab('admin');

      addLog('ledger', `Stellar Ledger: Contract deployed at OrbitGroup address CC${Math.random().toString(36).substring(2, 6).toUpperCase()}...88X2`, `Deployer Signature verified.\nGas paid: 0.12 Stroops.`);
      addLog('indexer', `Stellar Indexer: New OrbitGroup [${orbitName}] detected on-chain.`, `Adding contract state to Postgres schema. Real-time updates pushed to Web & Mobile subscribers.`);
    }, 2000);
  };

  // ACTION 2: INVITE MEMBER VIA SMS
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhoneInput || smsPhoneInput.length < 8) return;

    addLog('websocket', `SMS dispatch service triggered`, `Recipient: ${smsPhoneInput}\nMessage: You are invited to join Orbit '${selectedAdminOrbit.name}'. Tap to join: https://orbit.ajo/join/${selectedAdminOrbit.id}`);

    // Auto-accept mock invitation after 3 seconds to demonstrate real-time WebSocket state update
    addLog('indexer', `Simulating member acceptance on phone invite...`, `Chioma Obi clicked join link. Executing passkey registration.`);

    setTimeout(() => {
      const updatedOrbits = orbits.map(o => {
        if (o.id === selectedAdminOrbit.id) {
          const updatedMembers = o.members.map(m => {
            if (m.phone === '' || m.status === 'invited') {
              // Populate an empty invite spot
              addLog('ledger', `Stellar Ledger: Registered passkey signature for invited member.`, `Address: ${m.address || 'GDS9...Z8W7'}`);
              addLog('indexer', `Stellar Indexer: Member accepted invitation. Synchronizing state to Postgres.`, `Updated Member ID: ${m.id} to STATUS = ACTIVE`);
              addLog('websocket', `WebSockets: Broadcast member_joined to all group participants.`, `Lagos Solar Orbit: Now 5/5 active members.`);
              return {
                ...m,
                name: 'Chioma Obi',
                phone: smsPhoneInput,
                status: 'active' as const,
                address: 'GDS9...Z8W7',
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'
              };
            }
            return m;
          });

          return {
            ...o,
            members: updatedMembers
          };
        }
        return o;
      });

      setOrbits(updatedOrbits);
      setSmsPhoneInput('+234 ');
    }, 3000);
  };

  // ACTION 3: INITIATE STAKE SLASH DISPUTE VOTE
  const handleStartDispute = () => {
    setDisputeInProgress(true);
    setSlashVoteCounts({ yes: 0, no: 0, voted: [] });
    addLog('contract', `OrbitGroup [${selectedAdminOrbit.name}]: Stake Slash dispute triggered!`, `Member Tunde Bakare defaulted on contribution for 48 hours. Slashing stake requires majority consent from other active members.`);
  };

  const handleCastSlashVote = (voterId: string, vote: 'yes' | 'no') => {
    if (slashVoteCounts.voted.includes(voterId)) return;

    const newVoted = [...slashVoteCounts.voted, voterId];
    const newYes = slashVoteCounts.yes + (vote === 'yes' ? 1 : 0);
    const newNo = slashVoteCounts.no + (vote === 'no' ? 1 : 0);

    setSlashVoteCounts({
      yes: newYes,
      no: newNo,
      voted: newVoted
    });

    addLog('contract', `Soroban: Vote cast on default slashing dispute`, `Voter: ${voterId}\nOpinion: ${vote.toUpperCase()}`);

    // If all (or enough) members voted
    const activeVoters = selectedAdminOrbit.members.filter(m => m.status === 'active' && m.id !== 'member_tunde'); // exclude the defaulter
    if (newVoted.length >= activeVoters.length) {
      setTimeout(() => {
        setDisputeInProgress(false);
        if (newYes > newNo) {
          addLog('contract', `Soroban Contract: Dispute settled. SLAHING COMPLETED!`, `Slashing 10% stake of Tunde Bakare.\nReleased stake funds to cover round default.`);
          addLog('indexer', `Stellar Indexer: Slashing event processed. Default resolved via collateral release.`);
        } else {
          addLog('contract', `Soroban Contract: Dispute settled. Slash proposal REJECTED.`, `Stake locked. Extending default grace period by 24 hours.`);
        }
      }, 1000);
    }
  };

  // ACTION 4: PUBLIC ZK VERIFIER
  const handleVerifyUrl = (url: string) => {
    setVerifyingProof(true);
    setVerificationResult(null);
    addLog('contract', `ZK-Verifier Server: Checking cryptographic signature validity...`, `Proof Payload URL: ${url}`);

    setTimeout(() => {
      // Parse parameters from query URL
      try {
        const queryParams = new URLSearchParams(url.split('?')[1]);
        const address = queryParams.get('address') || 'GD7R...Z5PL';
        const completedCycles = parseInt(queryParams.get('cycles') || '4');
        const completionRate = parseInt(queryParams.get('rate') || '100');

        setVerificationResult({
          verified: true,
          address,
          completedCycles,
          completionRate
        });

        addLog('contract', `ZK-Verifier: Proof valid. Zero-knowledge constraints SATISFIED!`, `The user has cryptographically proven:\n- Completed Cycles >= 4\n- Default Rate = 0%\nIdentity and current active balances remain completely hidden.`);
      } catch (err) {
        setVerificationResult({
          verified: false,
          error: 'Invalid or corrupted zero-knowledge signature format.'
        });
        addLog('contract', `ZK-Verifier error: Failed to parse proof signature parameters.`, `The cryptographic proof payload is invalid or expired.`);
      }
      setVerifyingProof(false);
    }, 1500);
  };

  const isLight = theme === 'light';

  // Unlike MobileApp (paired with a side panel it needs to height-match at
  // lg+), WebPortal renders full-width alone — a fixed height here just left
  // a large empty gap on shorter tabs (e.g. "Create") and would force an
  // unnecessary nested scrollbar on taller ones. Let it size to content.
  return (
    <div id="web-portal" className={`border rounded-3xl p-5 shadow-2xl flex flex-col transition-colors duration-300 ${
      isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0A0A0A] border-white/10 text-[#E0E0E0]'
    }`}>
      {/* Tab Menu Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4 mb-5 ${
        isLight ? 'border-zinc-200' : 'border-white/10'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border text-orange-500 ${
            isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-white/10'
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className={`font-serif italic text-base tracking-wider ${isLight ? 'text-zinc-900 font-medium' : 'text-white'}`}>Orbit Web Dashboard</h2>
            <p className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>Group creation dashboard & public reputation portal</p>
          </div>
        </div>

        <div className={`flex p-1 rounded-xl border shrink-0 text-xs transition-colors duration-300 ${
          isLight ? 'bg-zinc-100 border-zinc-200/80' : 'bg-[#050505] border-white/10'
        }`}>
          <button 
            onClick={() => setActiveTab('create')} 
            className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'create' 
                ? (isLight ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'bg-white text-black shadow-sm') 
                : (isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-white/40 hover:text-white/80')
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Create Orbit
          </button>
          <button 
            onClick={() => setActiveTab('admin')} 
            className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'admin' 
                ? (isLight ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'bg-white text-black shadow-sm') 
                : (isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-white/40 hover:text-white/80')
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Admin Portal
          </button>
          <button 
            onClick={() => setActiveTab('verifier')} 
            className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'verifier' 
                ? (isLight ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'bg-white text-black shadow-sm') 
                : (isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-white/40 hover:text-white/80')
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Public Verifier
          </button>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* TAB 1: CREATE ORBIT CONTRACT */}
          {activeTab === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className={`rounded-2xl p-4 flex gap-3.5 items-start transition-colors duration-300 ${
                isLight ? 'bg-orange-50/60 border border-orange-200/60' : 'bg-orange-950/10 border border-orange-900/20'
              }`}>
                <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs text-left">
                  <span className={`font-serif italic text-sm ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>Orbit Factory Protocol Deployment</span>
                  <p className={`mt-1 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-white/50'}`}>
                    Deploying a group instantiates a unique autonomous Soroban smart contract on the Stellar blockchain. The contract securely holds collateral, enforces payment deadlines, and programmatically distributes payout pots.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateOrbit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-left">
                    <label className={`block text-xs mb-1 font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-550' : 'text-white/40'}`}>Group Name</label>
                    <input 
                      type="text" 
                      required
                      value={orbitName}
                      onChange={(e) => setOrbitName(e.target.value)}
                      className={`w-full rounded-xl py-2 px-3 text-sm outline-none transition-colors font-sans ${
                        isLight 
                          ? 'bg-zinc-50 border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                          : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div>
                      <label className={`block text-xs mb-1 font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-550' : 'text-white/40'}`}>Group Size</label>
                      <select 
                        value={groupSize}
                        onChange={(e) => setGroupSize(parseInt(e.target.value))}
                        className={`w-full rounded-xl py-2 px-3 text-sm outline-none ${
                          isLight 
                            ? 'bg-zinc-50 border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                            : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value={3} className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>3 Members</option>
                        <option value={5} className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>5 Members</option>
                        <option value={7} className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>7 Members</option>
                        <option value={10} className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>10 Members</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-550' : 'text-white/40'}`}>Contribution (USDC)</label>
                      <input 
                        type="number" 
                        required
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(parseInt(e.target.value))}
                        className={`w-full rounded-xl py-2 px-3 text-sm outline-none font-mono ${
                          isLight 
                            ? 'bg-zinc-50 border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                            : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div>
                      <label className={`block text-xs mb-1 font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-550' : 'text-white/40'}`}>Frequency</label>
                      <select 
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as OrbitGroup['frequency'])}
                        className={`w-full rounded-xl py-2 px-3 text-sm outline-none ${
                          isLight 
                            ? 'bg-zinc-50 border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                            : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value="Daily" className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>Daily Orbit</option>
                        <option value="Weekly" className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>Weekly Orbit</option>
                        <option value="Monthly" className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>Monthly Orbit</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-550' : 'text-white/40'}`}>Payout Order</label>
                      <select 
                        value={payoutOrder}
                        onChange={(e) => setPayoutOrder(e.target.value as PayoutOrderType)}
                        className={`w-full rounded-xl py-2 px-3 text-sm outline-none ${
                          isLight 
                            ? 'bg-zinc-50 border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                            : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value="fixed" className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>Fixed Rotation</option>
                        <option value="random" className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>Random Shuffled</option>
                        <option value="auction" className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>Auction Bid</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-left">
                    <label className={`block text-xs mb-1 font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-550' : 'text-white/40'}`}>Stake Percentage Required (Collateral)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min={5}
                        max={30}
                        step={5}
                        value={stakePercentage}
                        onChange={(e) => setStakePercentage(parseInt(e.target.value))}
                        className="flex-1 accent-orange-500"
                      />
                      <span className={`text-sm font-mono font-bold px-3 py-1.5 border rounded-lg ${
                        isLight 
                          ? 'bg-zinc-100 border-zinc-300 text-orange-600' 
                          : 'bg-[#050505] border-white/10 text-orange-400'
                      }`}>
                        {stakePercentage}%
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Slashed in the event of default to reimburse compliant members.</p>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit"
                    disabled={isDeploying}
                    className={`w-full font-sans font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider ${
                      isLight 
                        ? 'bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white' 
                        : 'bg-white hover:bg-white/90 disabled:bg-white/5 disabled:text-white/20 text-black'
                    }`}
                  >
                    {isDeploying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Deploying autonomous Soroban contract...
                      </>
                    ) : (
                      <>
                        <Shield className={`w-4 h-4 ${isLight ? 'text-white/50' : 'text-black/50'}`} /> Deploy Contract to Stellar Network
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 2: ADMIN GROUP HUB */}
          {activeTab === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-colors duration-300 ${
                isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#050505] border-white/10'
              }`}>
                <span className={`text-xs font-semibold uppercase ${isLight ? 'text-zinc-600' : 'text-white/50'}`}>Administer Orbit Group:</span>
                <select 
                  value={selectedAdminOrbitId}
                  onChange={(e) => setSelectedAdminOrbitId(e.target.value)}
                  className={`border rounded-lg py-1.5 px-3 text-xs outline-none font-sans ${
                    isLight 
                      ? 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500' 
                      : 'bg-white/5 border-white/10 text-white focus:border-orange-500'
                  }`}
                >
                  {orbits.map(o => (
                    <option key={o.id} value={o.id} className={isLight ? 'text-zinc-900' : 'text-white bg-zinc-950'}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invite Members */}
                <div className={`rounded-2xl p-4 border space-y-3.5 text-left transition-colors duration-300 ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/10'
                }`}>
                  <div>
                    <h3 className={`font-serif italic text-xs uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>
                      <Send className="w-3.5 h-3.5 text-orange-500" /> Invite Members via SMS Link
                    </h3>
                    <p className={`text-[10px] mt-1 leading-relaxed ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                      Send secure invitations containing on-chain contract parameters. Recipient signs via Passkey to commit collateral stake.
                    </p>
                  </div>

                  <form onSubmit={handleSendInvite} className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={smsPhoneInput}
                        onChange={(e) => setSmsPhoneInput(e.target.value)}
                        placeholder="+234..."
                        className={`rounded-xl py-2 px-3 text-xs font-mono flex-1 outline-none transition-colors ${
                          isLight 
                            ? 'bg-white border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                            : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                        }`}
                      />
                      <button 
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl py-2 px-3 text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                      >
                        Send Invite
                      </button>
                    </div>
                  </form>

                  <div className={`space-y-1.5 pt-1.5 border-t text-[11px] ${
                    isLight ? 'border-zinc-200 text-zinc-600' : 'border-white/5 text-white/50'
                  }`}>
                    <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>Pending Invitations:</span>
                    {selectedAdminOrbit.members.filter(m => m.status === 'invited').length === 0 ? (
                      <p className={`text-[10px] font-sans italic ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>No pending invitations. Group is fully populated!</p>
                    ) : (
                      selectedAdminOrbit.members
                        .filter(m => m.status === 'invited')
                        .map(m => (
                          <div key={m.id} className={`flex justify-between items-center p-2 rounded-lg border ${
                            isLight ? 'bg-white border-zinc-200/60 text-zinc-800' : 'bg-white/5 border-white/5'
                          }`}>
                            <span className="font-mono text-[10px]">{m.name || 'Anonymous User'}</span>
                            <span className="text-[9px] text-amber-600 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">Invited</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Defaults / slash stakes */}
                <div className={`rounded-2xl p-4 border space-y-3.5 text-left transition-colors duration-300 ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/10'
                }`}>
                  <div>
                    <h3 className={`font-serif italic text-xs uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-550" /> Default Monitoring & Slash Votes
                    </h3>
                    <p className={`text-[10px] mt-1 leading-relaxed ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                      If a member defaults on a payment cycle, the autonomous Soroban contract enables dispute voting. If approved, the member's locked stake collateral is slashed.
                    </p>
                  </div>

                  {disputeInProgress ? (
                    <div className={`border p-3 rounded-xl space-y-3 ${
                      isLight ? 'bg-white border-zinc-300 shadow-sm' : 'bg-white/5 border-red-950/40'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <CircleDot className="w-3 h-3 text-red-500 animate-ping" /> Dispute Active: Slash Tunde Bakare
                        </span>
                        <span className={`font-mono text-xs ${isLight ? 'text-zinc-500' : 'text-white/60'}`}>Votes: {slashVoteCounts.voted.length}/4</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                        <div className={`border p-2 rounded-lg ${
                          isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/30 border-emerald-900/20'
                        }`}>
                          <span className="text-emerald-600 text-sm block font-bold">{slashVoteCounts.yes}</span>
                          <span className={`text-[9px] uppercase ${isLight ? 'text-zinc-500 font-medium' : 'text-white/40'}`}>Yes, Slash Stake</span>
                        </div>
                        <div className={`border p-2 rounded-lg ${
                          isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#050505] border-white/10'
                        }`}>
                          <span className={`text-sm block font-bold ${isLight ? 'text-zinc-800' : 'text-white/60'}`}>{slashVoteCounts.no}</span>
                          <span className={`text-[9px] uppercase ${isLight ? 'text-zinc-500 font-medium' : 'text-white/40'}`}>No, Mercy Lock</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className={`text-[9px] uppercase font-bold block ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>Simulate Other Members Voting:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button 
                            disabled={slashVoteCounts.voted.includes('member_chidi')}
                            onClick={() => handleCastSlashVote('member_chidi', 'yes')}
                            className={`text-[10px] rounded-lg py-1 transition-all border ${
                              isLight 
                                ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 disabled:text-zinc-300 disabled:border-transparent' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:text-white/20 disabled:border-transparent'
                            }`}
                          >
                            Chidi: Vote YES
                          </button>
                          <button 
                            disabled={slashVoteCounts.voted.includes('member_amina')}
                            onClick={() => handleCastSlashVote('member_amina', 'yes')}
                            className={`text-[10px] rounded-lg py-1 transition-all border ${
                              isLight 
                                ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 disabled:text-zinc-300 disabled:border-transparent' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:text-white/20 disabled:border-transparent'
                            }`}
                          >
                            Amina: Vote YES
                          </button>
                          <button 
                            disabled={slashVoteCounts.voted.includes('member_ngozi')}
                            onClick={() => handleCastSlashVote('member_ngozi', 'no')}
                            className={`text-[10px] rounded-lg py-1 transition-all border ${
                              isLight 
                                ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 disabled:text-zinc-300 disabled:border-transparent' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:text-white/20 disabled:border-transparent'
                            }`}
                          >
                            Ngozi: Vote NO
                          </button>
                          <button 
                            disabled={slashVoteCounts.voted.includes('user_efe')}
                            onClick={() => handleCastSlashVote('user_efe', 'yes')}
                            className={`text-[10px] font-bold rounded-lg py-1 transition-all border ${
                              isLight 
                                ? 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700 disabled:text-orange-300 disabled:border-transparent' 
                                : 'bg-orange-950/40 border-orange-900/20 hover:bg-orange-950/60 text-orange-400 disabled:text-orange-300 disabled:bg-transparent'
                            }`}
                          >
                            Efe (YOU): Vote YES
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-xl border text-center ${
                      isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'
                    }`}>
                      <span className={`text-xs block font-semibold ${isLight ? 'text-zinc-800' : 'text-white/60'}`}>Defaulters List</span>
                      <p className={`text-[9px] mt-0.5 mb-3 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Tunde Bakare has an overdue payment of 50 USDC (48 Hours Overdue).</p>
                      
                      <button 
                        onClick={handleStartDispute}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold rounded-xl py-2 px-4 text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Start Stake-Slash dispute Vote
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PUBLIC REPUTATION ZK VERIFIER */}
          {activeTab === 'verifier' && (
            <motion.div 
              key="verifier"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className={`rounded-2xl p-4 border space-y-4 text-left transition-colors duration-300 ${
                isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/10'
              }`}>
                <div>
                  <h3 className={`font-serif italic text-xs uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Decentralized Zero-Knowledge Verifier Portal
                  </h3>
                  <p className={`text-[10px] mt-1 leading-relaxed font-sans ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                    Third-party lenders, credit platforms, and auto finance providers verify on-chain savings records without exposing wallet addresses, credit scores, or identity details. Just paste the cryptographic proof URL here.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>Paste ZK Proof Link / Token</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={pasteUrlInput}
                      onChange={(e) => setPasteUrlInput(e.target.value)}
                      placeholder="Paste link copied from 'My Reputation' (e.g. https://orbit.ajo/verify?address=...)"
                      className={`rounded-xl py-2 px-3 text-xs font-mono flex-1 outline-none transition-colors ${
                        isLight 
                          ? 'bg-white border border-zinc-300 text-zinc-900 focus:border-orange-500' 
                          : 'bg-white/5 border border-white/10 text-white focus:border-orange-500'
                      }`}
                    />
                    <button 
                      onClick={() => handleVerifyUrl(pasteUrlInput)}
                      disabled={verifyingProof || !pasteUrlInput}
                      className={`font-semibold rounded-xl py-2 px-4 text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm ${
                        isLight 
                          ? 'bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {verifyingProof ? 'Verifying...' : 'Verify Proof'}
                    </button>
                  </div>
                </div>

                {/* Result Display */}
                <AnimatePresence mode="wait">
                  {verifyingProof && (
                    <motion.div 
                      key="verifying"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-8 border rounded-xl flex flex-col items-center justify-center space-y-2.5 text-center ${
                        isLight ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                      <span className={`text-xs font-semibold ${isLight ? 'text-zinc-800' : 'text-white'}`}>Decompressing Proof Cryptographic Constraints...</span>
                      <p className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Checking Stellar verification contract signatures and completion status</p>
                    </motion.div>
                  )}

                  {verificationResult && (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 border rounded-xl space-y-3.5 ${
                        isLight 
                          ? (verificationResult.verified ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200')
                          : (verificationResult.verified ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-red-950/10 border-red-900/20')
                      }`}
                    >
                      {verificationResult.verified ? (
                        <>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 border ${
                              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <span className={`text-xs font-bold tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>On-Chain Cryptographic Proof VERIFIED!</span>
                              <p className={`text-[10px] font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400/90'}`}>Stellar ReputationIssuer Proof: VALID</p>
                            </div>
                          </div>

                          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-white/5'}`}>
                            <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-white/5 border-white/5'}`}>
                              <span className={`text-[8px] uppercase block ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>ZK-Anonymized Address</span>
                              <span className={`font-mono text-[10px] font-semibold block mt-0.5 truncate ${isLight ? 'text-zinc-800' : 'text-white/80'}`} title={verificationResult.address}>
                                {verificationResult.address?.slice(0, 8)}...{verificationResult.address?.slice(-8)}
                              </span>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-white/5 border-white/5'}`}>
                              <span className={`text-[8px] uppercase block ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>Completed Cycles</span>
                              <span className="font-sans text-[10px] text-emerald-600 font-bold block mt-0.5 flex items-center gap-0.5">
                                <Award className="w-3 h-3 text-yellow-500 fill-yellow-500/10" /> {verificationResult.completedCycles} Orbits Completed
                              </span>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-white/5 border-white/5'}`}>
                              <span className={`text-[8px] uppercase block ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>Completion Compliance</span>
                              <span className="font-mono text-[10px] text-emerald-600 font-bold block mt-0.5">
                                {verificationResult.completionRate}% Perfect Rating
                              </span>
                            </div>
                          </div>

                          <div className={`p-2 rounded-lg text-[9px] leading-relaxed font-sans border ${
                            isLight ? 'bg-white border-zinc-200 text-zinc-600' : 'bg-white/5 border border-white/5 text-white/40'
                          }`}>
                            <strong>Lender Security Clearance:</strong> This client is cleared for high-trust micro-loans based on 100% savings circle completion. Zero personal details, BVNs, or phone records were exposed during the transaction verification.
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="bg-red-500/10 p-2 rounded-lg text-red-500 shrink-0 border border-red-500/20">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Proof Verification Failed</span>
                            <p className="text-[10px] text-red-500 mt-1">{verificationResult.error}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Orbit Guide quick footer block */}
      <div className={`border-t pt-3 flex items-center justify-between text-[10px] font-mono mt-4 transition-colors duration-300 ${
        isLight ? 'border-zinc-200 text-zinc-400' : 'border-white/10 text-white/30'
      }`}>
        <span className="flex items-center gap-1 text-left">
          <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10 animate-pulse" /> Stellar/Soroban Integration: ONLINE
        </span>
        <span className="font-mono">Gas: sponsor sponsored</span>
      </div>
    </div>
  );
}
