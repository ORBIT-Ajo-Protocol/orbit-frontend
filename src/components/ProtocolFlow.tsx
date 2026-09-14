import React, { useState } from 'react';
import { 
  RefreshCw, Shield, Key, Landmark, BadgePercent, CheckCircle2, 
  HelpCircle, ChevronRight, Play, Award, EyeOff, Radio, Lock, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProtocolFlowProps {
  theme?: 'dark' | 'light';
}

interface StepDetail {
  id: number;
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  description: string;
  contractMethod: string;
  onChainAction: string;
  dataPoints: string[];
}

export default function ProtocolFlow({ theme }: ProtocolFlowProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationTrigger, setSimulationTrigger] = useState<number>(0);

  const isLight = theme === 'light';

  const steps: StepDetail[] = [
    {
      id: 1,
      title: 'USDC Fiat Anchor (SEP-24)',
      icon: <Landmark className="w-5 h-5 text-emerald-500" />,
      subtitle: 'Naira to USDC Deposit & Withdrawal',
      description: 'Members deposit local currency (NGN Naira) via standard bank transfer through a Stellar SEP-24 compliant anchor. The anchor takes NGN, mints/locks equivalent USDC tokens on the Stellar ledger, and transfers them directly to the user’s smart wallet address. This abstracts the blockchain friction for non-technical users.',
      contractMethod: 'anchor_deposit_resolve()',
      onChainAction: 'Stellar Ledger transfer of 50.00 USDC to GD7R...ZPL',
      dataPoints: [
        'Local Payment Gateway confirmation',
        'Stellar transaction signed by Anchor Key',
        'Automatic balance refresh via WebSocket'
      ]
    },
    {
      id: 2,
      title: 'Soroban Smart ROSCA (Orbit)',
      icon: <RefreshCw className="w-5 h-5 text-orange-500" />,
      subtitle: 'Locked Collateral & Rotating Payout',
      description: 'A unique, autonomous smart contract is deployed on the Soroban virtual machine. When joining, members lock 10% collateral stake. Every round (Weekly/Monthly), each member contributes their fixed quota (e.g. 50 USDC). The smart contract automatically verifies all signatures, aggregates the pot, and instantly routes the payout to the designated round winner’s wallet.',
      contractMethod: 'orbit_cycle_rotate()',
      onChainAction: 'Soroban VM invoked. 250 USDC transferred from Escrow to GA8K...W1',
      dataPoints: [
        'Member passkey signature verification',
        'Collateral stakes locked in Escrow',
        'Decentralized autonomous payout router'
      ]
    },
    {
      id: 3,
      title: 'Collateral Slasher & Dispute Resolution',
      icon: <Shield className="w-5 h-5 text-red-500" />,
      subtitle: 'Stake Slashing on Payment Failure',
      description: 'If a member defaults or fails to make their rotation payment, a 48-hour grace period is triggered. If the debt remains unpaid, other members can open a collateral-slashing proposal. Members cast signed votes. Upon majority consensus, the contract automatically slashes the defaulter’s locked collateral to reimburse the pool, completely eliminating counterpart risk.',
      contractMethod: 'propose_stake_slash()',
      onChainAction: 'Defaulted member stake slashed. Reallocated 50 USDC to pool.',
      dataPoints: [
        'Arbitration phase 24-hour lock',
        'Decentralized consensus threshold check',
        'Automatic victim payout reimbursement'
      ]
    },
    {
      id: 4,
      title: 'ZK-Reputation Proof Generation',
      icon: <Award className="w-5 h-5 text-cyan-500" />,
      subtitle: 'Anonymized Credit Scoring',
      description: 'When an Orbit cycle completes successfully, the Reputation Issuer contract mints an immutable reputation seal to the compliant user’s cryptographic keys. When applying for loans from external lenders, the user generates a Zero-Knowledge proof. The lender verifies the proof in seconds, confirming perfect repayment history without knowing the user’s identity or wallet addresses.',
      contractMethod: 'reputation_issuer_verify()',
      onChainAction: 'ZK proof verified. Constraint Satisfied: Cycles >= 4, Default Rate = 0%.',
      dataPoints: [
        'Zero-knowledge signature expansion',
        'Selective disclosure credentials',
        'Third-party automated trust handshake'
      ]
    }
  ];

  const handlePlaySimulation = () => {
    setIsPlaying(true);
    setSimulationTrigger(prev => prev + 1);
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  const currentStep = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <div className={`border rounded-3xl p-8 shadow-2xl transition-all duration-300 text-left ${
      isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0A0A0A] border-white/10 text-[#E0E0E0]'
    }`}>
      <div className="flex items-center gap-3.5 mb-6">
        <div className={`p-2.5 rounded-xl border text-orange-500 ${
          isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-white/10'
        }`}>
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className={`font-serif italic text-base tracking-wider ${isLight ? 'text-zinc-900 font-medium' : 'text-white'}`}>
            System Data Flow & Architecture Guide
          </h2>
          <p className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
            Interactive protocol simulation of Stellar-anchored savings and Soroban smart contracts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Selector List */}
        <div className="lg:col-span-4 space-y-2.5">
          {steps.map((step) => {
            const isActive = step.id === activeStep;
            return (
              <motion.button
                key={step.id}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveStep(step.id);
                  setIsPlaying(false);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-colors duration-300 flex items-start gap-3.5 ${
                  isActive 
                    ? (isLight 
                        ? 'bg-orange-50/50 border-orange-500/40 text-zinc-900 shadow-sm' 
                        : 'bg-orange-950/20 border-orange-500/30 text-white')
                    : (isLight 
                        ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600' 
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/60')
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isActive 
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                    : (isLight ? 'bg-white border-zinc-200' : 'bg-[#050505] border-white/5')
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                      Phase 0{step.id}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    )}
                  </div>
                  <h3 className="font-serif italic text-xs font-medium mt-0.5 truncate">
                    {step.title}
                  </h3>
                  <p className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                    {step.subtitle}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Detailed Explanation and Interactive Simulation */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Step Panel */}
          <div className={`p-5 rounded-3xl border text-xs leading-relaxed transition-colors duration-300 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/10'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-dashed border-zinc-200/50 dark:border-white/5">
              <div>
                <span className="text-[9px] font-bold tracking-widest uppercase text-orange-500">
                  Step {currentStep.id} of 4 • Protocol Mechanics
                </span>
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`font-serif italic text-sm font-medium mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}
                  >
                    {currentStep.title}
                  </motion.h3>
                </AnimatePresence>
              </div>

              <button
                onClick={handlePlaySimulation}
                disabled={isPlaying}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ${
                  isPlaying 
                    ? 'bg-orange-500 text-white border-transparent cursor-not-allowed animate-pulse'
                    : (isLight
                        ? 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white')
                }`}
              >
                {isPlaying ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-spin-slow" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Flow Simulation
                  </>
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, delay: 0.03 }}
                className={`text-[11px] leading-relaxed mb-4 ${isLight ? 'text-zinc-650' : 'text-white/70'}`}
              >
                {currentStep.description}
              </motion.p>
            </AnimatePresence>

            {/* Simulated Live Visuals (SVG animations) */}
            <div className={`h-40 rounded-2xl border flex items-center justify-center relative overflow-hidden p-6 mb-4 ${
              isLight ? 'bg-white border-zinc-200 shadow-inner' : 'bg-black/40 border-white/5 shadow-inner'
            }`}>
              {/* Simulation animation tracks */}
              <AnimatePresence>
                {activeStep === 1 && (
                  <div className="w-full flex items-center justify-around text-[10px] font-mono relative z-10">
                    <div className="flex flex-col items-center">
                      <Landmark className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold mt-1">Naira Bank</span>
                    </div>

                    <div className="flex-1 max-w-[120px] h-0.5 bg-dashed border-t border-dashed border-emerald-500/40 relative">
                      {isPlaying && (
                        <motion.div 
                          key={`sim1_${simulationTrigger}`}
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.5, ease: 'easeInOut' }}
                          className="absolute -top-1.5 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[7px] text-white font-bold font-sans shadow"
                        >
                          ₦
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="px-2 py-1 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20 font-bold uppercase text-[9px]">
                        SEP-24 Anchor
                      </div>
                    </div>

                    <div className="flex-1 max-w-[120px] h-0.5 bg-dashed border-t border-dashed border-orange-500/40 relative">
                      {isPlaying && (
                        <motion.div 
                          key={`sim2_${simulationTrigger}`}
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{ delay: 1.2, duration: 1.5, ease: 'easeInOut' }}
                          className="absolute -top-1.5 w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center text-[7px] text-white font-bold font-sans shadow"
                        >
                          $
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <Key className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold mt-1">Smart Wallet</span>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="w-full flex items-center justify-around text-[10px] font-mono relative z-10">
                    <div className="flex flex-col items-center">
                      <Users className="w-5 h-5 text-orange-400" />
                      <span className="font-semibold mt-1">Members (5)</span>
                    </div>

                    <div className="flex-1 max-w-[100px] h-0.5 border-t border-dashed border-orange-500/30 relative">
                      {isPlaying && (
                        <>
                          <motion.div 
                            initial={{ left: '0%', scale: 0.8 }}
                            animate={{ left: '100%' }}
                            transition={{ duration: 1, delay: 0 }}
                            className="absolute -top-1 w-2 h-2 rounded-full bg-orange-500"
                          />
                          <motion.div 
                            initial={{ left: '0%', scale: 0.8 }}
                            animate={{ left: '100%' }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="absolute -top-1 w-2 h-2 rounded-full bg-orange-500"
                          />
                          <motion.div 
                            initial={{ left: '0%', scale: 0.8 }}
                            animate={{ left: '100%' }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="absolute -top-1 w-2 h-2 rounded-full bg-orange-500"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex flex-col items-center relative">
                      <div className="w-10 h-10 rounded-full border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-orange-500 animate-spin-slow">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="font-semibold mt-1">Escrow Pot</span>
                    </div>

                    <div className="flex-1 max-w-[100px] h-0.5 border-t border-dashed border-emerald-500/30 relative">
                      {isPlaying && (
                        <motion.div 
                          key={`sim2_winner_${simulationTrigger}`}
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{ delay: 1.2, duration: 1.4, ease: 'easeOut' }}
                          className="absolute -top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[7px] text-white font-bold"
                        >
                          USDC
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <Award className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold mt-1">Round Winner</span>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="w-full flex items-center justify-around text-[10px] font-mono relative z-10">
                    <div className="flex flex-col items-center text-red-500">
                      <Lock className="w-5 h-5" />
                      <span className="font-semibold mt-1">Locked Collateral</span>
                    </div>

                    <div className="flex-1 max-w-[120px] h-0.5 border-t border-dashed border-red-500/40 relative">
                      {isPlaying && (
                        <motion.div 
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.5 }}
                          className="absolute -top-1.5 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-white text-[7px] font-bold"
                        >
                          ✗
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col items-center text-amber-500">
                      <Shield className="w-6 h-6 animate-pulse" />
                      <span className="font-semibold mt-1">Dispute Resolution</span>
                    </div>

                    <div className="flex-1 max-w-[120px] h-0.5 border-t border-dashed border-emerald-500/40 relative">
                      {isPlaying && (
                        <motion.div 
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.5, delay: 1.3 }}
                          className="absolute -top-1.5 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[7px] font-bold"
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col items-center text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold mt-1">Victim Reimbursed</span>
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="w-full flex items-center justify-around text-[10px] font-mono relative z-10">
                    <div className="flex flex-col items-center text-orange-400">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold mt-1">On-Chain ROSCAs</span>
                    </div>

                    <div className="flex-1 max-w-[100px] h-0.5 border-t border-dashed border-orange-500/20 relative">
                      {isPlaying && (
                        <motion.div 
                          initial={{ left: '0%', opacity: 1 }}
                          animate={{ left: '100%', opacity: 0.1 }}
                          transition={{ duration: 1.2 }}
                          className="absolute -top-1 w-2 h-2 rounded-full bg-orange-400"
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-center text-cyan-500">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[9px] uppercase font-bold">ZK Proof</span>
                      </div>
                      <span className="font-semibold mt-1">Anonymized Record</span>
                    </div>

                    <div className="flex-1 max-w-[100px] h-0.5 border-t border-dashed border-cyan-500/20 relative">
                      {isPlaying && (
                        <motion.div 
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.2, delay: 1.1 }}
                          className="absolute -top-1 w-2 h-2 rounded-full bg-cyan-400"
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-center text-cyan-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold mt-1">Trusted Lender</span>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Background ambient light */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
            </div>

            {/* Smart Contract Signature & Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border font-mono text-[10px] transition-colors hover:border-orange-500/40 ${
                isLight ? 'bg-white border-zinc-200' : 'bg-black/20 border-white/5'
              }`}>
                <span className={`text-[8px] uppercase tracking-wider block font-bold font-sans ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                  Soroban Contract Invocation
                </span>
                <span className="text-orange-500 font-bold block mt-1">{currentStep.contractMethod}</span>
                <span className={`block mt-0.5 truncate ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                  Triggered on signature execution. Gas paid in Stroops.
                </span>
              </div>

              <div className={`p-3 rounded-xl border font-mono text-[10px] transition-colors hover:border-emerald-500/40 ${
                isLight ? 'bg-white border-zinc-200' : 'bg-black/20 border-white/5'
              }`}>
                <span className={`text-[8px] uppercase tracking-wider block font-bold font-sans ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                  On-Chain State Mutation
                </span>
                <span className="text-emerald-500 font-semibold block mt-1 truncate" title={currentStep.onChainAction}>
                  {currentStep.onChainAction}
                </span>
                <span className={`block mt-0.5 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                  Immutable receipt added to ledger sequence.
                </span>
              </div>
            </div>
          </div>

          {/* Core Technical Invariants */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-zinc-200/80' : 'bg-[#050505] border-white/10'
          }`}>
            <h4 className={`text-xs font-serif italic mb-2.5 font-medium flex items-center gap-1.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Trustless Compliance Data Points
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentStep.dataPoints.map((dp, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border text-[11px] font-sans flex items-start gap-2 transition-colors hover:border-orange-500/30 ${
                  isLight ? 'bg-zinc-50 border-zinc-150' : 'bg-white/5 border-white/5'
                }`}>
                  <span className="font-mono text-[10px] text-orange-500 font-bold">0{idx + 1}.</span>
                  <span className={isLight ? 'text-zinc-600' : 'text-white/60'}>{dp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
