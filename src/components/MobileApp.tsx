import React, { useState } from 'react';
import * as d3 from 'd3';
import { OrbitGroup, Member, UserWallet, LogEvent } from '../types';
import { 
  Phone, Key, ShieldCheck, CreditCard, ChevronRight, ArrowLeft, ArrowUpRight, 
  ArrowDownLeft, DollarSign, Wallet, RefreshCw, Smartphone, Star, Users, 
  Calendar, CheckCircle, AlertCircle, FileSpreadsheet, Fingerprint, Award,
  QrCode, Copy, ExternalLink, ArrowRight, UserCheck, HelpCircle, Check, Play,
  Plus, X, Search, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressRing } from './ProgressRing';

interface MobileAppProps {
  orbits: OrbitGroup[];
  setOrbits: React.Dispatch<React.SetStateAction<OrbitGroup[]>>;
  userWallet: UserWallet;
  setUserWallet: React.Dispatch<React.SetStateAction<UserWallet>>;
  addLog: (type: LogEvent['type'], message: string, details?: string) => void;
  onNavigateToWebVerifier: (proofLink: string) => void;
  theme?: 'dark' | 'light';
  setTheme?: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
}

type ScreenType = 'onboarding' | 'home' | 'group-detail' | 'contribute' | 'payout' | 'reputation';

export default function MobileApp({ 
  orbits, 
  setOrbits, 
  userWallet, 
  setUserWallet, 
  addLog,
  onNavigateToWebVerifier,
  theme,
  setTheme
}: MobileAppProps) {
  const [screen, setScreen] = useState<ScreenType>(userWallet.kycStatus === 'completed' ? 'home' : 'onboarding');
  const [onboardingStep, setOnboardingStep] = useState<number>(1); // 1: phone, 2: passkey, 3: kyc
  const [phoneInput, setPhoneInput] = useState<string>('+234 ');
  const [selectedOrbitId, setSelectedOrbitId] = useState<string>('orbit_lagos_solar');
  
  // SEP-24 States
  const [depositAmountNGN, setDepositAmountNGN] = useState<string>('75000'); // 75k NGN is approx 50 USDC at 1500 rate
  const [sep24Step, setSep24Step] = useState<'amount' | 'bank-transfer' | 'verifying' | 'signed'>('amount');
  const [kycForm, setKycForm] = useState({ name: '', bvn: '', bank: 'Zenith Bank' });
  const [isBiometricSigning, setIsBiometricSigning] = useState<boolean>(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean>(false);

  // Hardware Key simulation states
  const [walletUnlocked, setWalletUnlocked] = useState<boolean>(false); // Starts locked to showcase the FIDO2 hardware requirement!
  const [showHardwarePrompt, setShowHardwarePrompt] = useState<boolean>(false);
  const [isSimulatingHardwareTap, setIsSimulatingHardwareTap] = useState<boolean>(false);

  // Payout states
  const [payoutOption, setPayoutOption] = useState<'usdc' | 'naira'>('usdc');
  const [payoutBankForm, setPayoutBankForm] = useState({ bankName: 'Access Bank', accountNumber: '0123456789' });
  const [payoutProcessing, setPayoutProcessing] = useState<boolean>(false);

  // ZK-Proof States
  const [zkProofGenerated, setZkProofGenerated] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'contributions' | 'payouts'>('all');
  const [historySortOrder, setHistorySortOrder] = useState<'desc' | 'asc'>('desc');
  const [historyDateRange, setHistoryDateRange] = useState<'all' | '30days' | '3months'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'success' | 'pending' | 'arbitration'>('all');

  // Dispute states
  const [disputingEvent, setDisputingEvent] = useState<any | null>(null);
  const [disputeReasonCategory, setDisputeReasonCategory] = useState<string>('unauthorized');
  const [disputeExplanation, setDisputeExplanation] = useState<string>('');
  const [disputeContact, setDisputeContact] = useState<string>('');
  const [disputedEventIds, setDisputedEventIds] = useState<string[]>([]);
  const [disputeSuccessMessage, setDisputeSuccessMessage] = useState<string>('');
  const [disputeIsSubmitting, setDisputeIsSubmitting] = useState<boolean>(false);
  const [showDisputeSummary, setShowDisputeSummary] = useState<boolean>(false);

  // Reset function to demo onboarding again
  const handleResetProfile = () => {
    setUserWallet({
      address: '',
      phone: '',
      usdcBalance: 0,
      nairaBalance: 125000,
      hasPasskey: false,
      kycStatus: 'none'
    });
    setOnboardingStep(1);
    setScreen('onboarding');
    setWalletUnlocked(false);
    addLog('wallet', 'Simulated Mobile App profile reset.', 'User wallet cleared. Onboarding state restarted.');
  };

  const currentOrbit = orbits.find(o => o.id === selectedOrbitId) || orbits[0];

  const getHistoryEvents = () => {
    const events: Array<{
      id: string;
      type: 'contribution' | 'payout';
      round: number;
      amount: number;
      userName: string;
      status: 'success' | 'pending' | 'active';
      timestamp: string;
      date: Date;
    }> = [];

    const activeMembers = currentOrbit.members.filter(m => m.status === 'active');
    const intervalDays = currentOrbit.frequency.toLowerCase().includes('weekly') ? 7 : 30;

    for (let r = 1; r <= currentOrbit.totalRounds; r++) {
      const roundIdx = r - 1;
      const daysAgo = (currentOrbit.currentRound - r) * intervalDays;
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - daysAgo);
      
      // 1. Contributions for this round
      currentOrbit.members.forEach(member => {
        const hasContributed = currentOrbit.roundsHistory[member.id]?.[roundIdx];
        if (hasContributed) {
          events.push({
            id: `contrib-${member.id}-${r}`,
            type: 'contribution',
            round: r,
            amount: currentOrbit.contributionAmount,
            userName: member.name,
            status: 'success',
            timestamp: r < currentOrbit.currentRound ? `Round ${r} • Success` : `Round ${r} • Paid`,
            date: eventDate
          });
        } else if (r === currentOrbit.currentRound) {
          events.push({
            id: `contrib-pending-${member.id}-${r}`,
            type: 'contribution',
            round: r,
            amount: currentOrbit.contributionAmount,
            userName: member.name,
            status: 'pending',
            timestamp: `Round ${r} • Awaiting Sign`,
            date: eventDate
          });
        }
      });

      // 2. Payout for this round
      const recipient = currentOrbit.members.find(m => m.rotationIndex === roundIdx);
      if (recipient) {
        const totalPot = activeMembers.length * currentOrbit.contributionAmount;
        const allContributed = activeMembers.every(m => currentOrbit.roundsHistory[m.id]?.[roundIdx] === true);
        
        const payoutDate = new Date(eventDate);
        payoutDate.setDate(payoutDate.getDate() + 2);

        if (r < currentOrbit.currentRound) {
          events.push({
            id: `payout-${recipient.id}-${r}`,
            type: 'payout',
            round: r,
            amount: totalPot,
            userName: recipient.name,
            status: 'success',
            timestamp: `Round ${r} • Settled`,
            date: payoutDate
          });
        } else if (r === currentOrbit.currentRound) {
          events.push({
            id: `payout-${recipient.id}-${r}`,
            type: 'payout',
            round: r,
            amount: totalPot,
            userName: recipient.name,
            status: allContributed ? 'active' : 'pending',
            timestamp: `Round ${r} • ${allContributed ? 'Pending Claim' : 'Accruing'}`,
            date: payoutDate
          });
        }
      }
    }

    return events.sort((a, b) => {
      if (a.round !== b.round) {
        return historySortOrder === 'desc' ? b.round - a.round : a.round - b.round;
      }
      if (a.type !== b.type) {
        return a.type === 'payout' ? -1 : 1; // Payout first in the same round
      }
      return 0;
    });
  };

  // Onboarding action 1: Enter Phone
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length < 8) return;
    addLog('wallet', `Phone number registered: ${phoneInput}`, 'Validating phone carrier state and creating passkey credentials...');
    setOnboardingStep(2);
  };

  // Onboarding action 2: Create Passkey Wallet
  const handleCreatePasskey = () => {
    addLog('wallet', 'Requesting passkey credentials via WebAuthn...', 'Silently creating secure Stellar public/private keypair signed by device security chip.');
    setTimeout(() => {
      const generatedAddress = 'GD' + Array.from({length: 24}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
      setUserWallet(prev => ({
        ...prev,
        phone: phoneInput,
        hasPasskey: true,
        address: generatedAddress
      }));
      addLog('wallet', `Passkey created. Keypair generated on-chain!`, `Address: ${generatedAddress}\nPrivate key locked inside local Secure Enclave.`);
      setOnboardingStep(3);
    }, 1500);
  };

  // Onboarding action 3: Complete SEP-24 KYC
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.name) return;
    addLog('sep24', `Initiating SEP-24 KYC interactive session with Spark Anchor...`, `Sending BVN Verification & Bank details to compliance portal.`);
    
    setTimeout(() => {
      setUserWallet(prev => ({
        ...prev,
        kycStatus: 'completed'
      }));
      addLog('sep24', `KYC Approved! Anchor issued SEP-24 Deposit/Withdraw auth token.`, `Name: ${kycForm.name}\nBVN Status: Verified.`);
      setScreen('home');
    }, 1500);
  };

  // SEP-24 Deposit (Naira -> USDC)
  const handleSep24DepositStart = () => {
    setSep24Step('bank-transfer');
    const ngn = parseFloat(depositAmountNGN);
    const usdc = Math.round(ngn / 1500); // 1500 NGN = 1 USDC rate
    addLog('sep24', `Interactive Deposit: User requested to convert ${ngn.toLocaleString()} NGN into USDC.`, `Spark Anchor Exchange Rate: 1,500 NGN = 1.00 USDC.\nTarget: +${usdc} USDC`);
  };

  const handleConfirmBankTransfer = () => {
    setSep24Step('verifying');
    const ngn = parseFloat(depositAmountNGN);
    const usdc = Math.round(ngn / 1500);
    addLog('sep24', `Naira bank transfer confirmed. Spark Anchor verifying funds...`, `Bank transfer reference matched. Crediting Stellar ledger address: ${userWallet.address}`);
    
    setTimeout(() => {
      setUserWallet(prev => ({
        ...prev,
        nairaBalance: prev.nairaBalance - ngn,
        usdcBalance: prev.usdcBalance + usdc
      }));
      setSep24Step('signed');
      addLog('ledger', `Stellar Ledger: Spark Anchor minted & deposited ${usdc} USDC`, `Recipient: ${userWallet.address}\nHash: 7c4b...f82a`);
      addLog('wallet', `USDC balance credited: +${usdc} USDC`, `New balance: ${(userWallet.usdcBalance + usdc).toFixed(2)} USDC`);
    }, 2000);
  };

  // Simulating hardware key tap
  const handleSimulateHardwareKeyTap = () => {
    setIsSimulatingHardwareTap(true);
    addLog('wallet', 'Awaiting physical touch on FIDO2 security key...', 'Device NFC reader active. Handshaking with secure chip...');

    setTimeout(() => {
      setIsSimulatingHardwareTap(false);
      setWalletUnlocked(true);
      setShowHardwarePrompt(false);
      addLog('wallet', 'FIDO2 security key recognized successfully!', 'On-device cryptographic challenge approved. Hardware-bound credential unlocked.');
      
      // Auto trigger the biometric contribution signing
      setIsBiometricSigning(true);
      addLog('contract', `OrbitGroup [${currentOrbit.name}] contribution requested`, `Validating account state with hardware credentials...`);

      setTimeout(() => {
        setBiometricSuccess(true);
        setTimeout(() => {
          setIsBiometricSigning(false);
          setBiometricSuccess(false);

          // Deduct wallet balance
          const updatedUsdcBalance = userWallet.usdcBalance - currentOrbit.contributionAmount;
          setUserWallet(prev => ({
            ...prev,
            usdcBalance: updatedUsdcBalance
          }));

          // Update orbits list
          const updatedOrbits = orbits.map(o => {
            if (o.id === currentOrbit.id) {
              const history = { ...o.roundsHistory };
              history['user_efe'] = [...history['user_efe']];
              history['user_efe'][o.currentRound - 1] = true;

              const newLivePotBalance = o.livePotBalance + o.contributionAmount;
              
              // Check if ALL members contributed for this round
              const activeMembers = o.members.filter(m => m.status === 'active');
              const allContributed = activeMembers.every(m => history[m.id][o.currentRound - 1] === true);

              let nextRound = o.currentRound;
              let status = o.status;
              let livePot = newLivePotBalance;

              addLog('contract', `Soroban: User Efe Adebayo signed contribution of ${o.contributionAmount} USDC`, `OrbitGroup Contract Address: CC3A...88X2\nEvent: ContributionMade(user_efe, round=${o.currentRound})`);

              if (allContributed) {
                addLog('indexer', `Stellar Indexer: All members contributed for Round ${o.currentRound}! Auto-releasing pot to recipient.`, `Pot size: ${newLivePotBalance} USDC\nEmitted Event: RoundCompleted(round=${o.currentRound}, total=${newLivePotBalance})`);
                
                const currentRecipient = o.members.find(m => m.rotationIndex === o.currentRound - 1);
                if (currentRecipient) {
                  addLog('contract', `Soroban contract: Disbursed ${newLivePotBalance} USDC to recipient ${currentRecipient.name}`, `To Address: ${currentRecipient.address}\nStatus: Settled.`);
                }

                // Auto advance round
                if (o.currentRound < o.totalRounds) {
                   nextRound = o.currentRound + 1;
                   livePot = 0; // reset for next round
                   addLog('indexer', `Stellar Indexer: Advancing OrbitGroup to Round ${nextRound}`, `Postgres database table 'orbits' synchronized with on-chain ledger.`);
                   addLog('websocket', `WebSockets: Broadcast 'orbit_updated' event to all 5 active members.`, `Action: Home Screen UI updated instantly.`);
                } else {
                   status = 'completed';
                   livePot = 0;
                   addLog('contract', `Soroban: OrbitGroup cycle completed! All rounds settled successfully.`, `ReputationIssuer contract triggered: Mints ZK Credentials for all 100% compliant members.`);
                   addLog('indexer', `Stellar Indexer: Minting completed. Postgres updated status to 'completed'.`);
                }
              } else {
                addLog('indexer', `Stellar Indexer: Event ContributionMade captured in Postgres.`, `Orbit [${o.name}] now at ${newLivePotBalance}/${o.contributionAmount * activeMembers.length} USDC for Round ${o.currentRound}.`);
                addLog('websocket', `WebSockets: Broadcast contribution update to Lagos Solar Orbit.`, `Action: Green grid updated on details page.`);
              }

              return {
                ...o,
                livePotBalance: livePot,
                currentRound: nextRound,
                status,
                roundsHistory: history
              };
            }
            return o;
          });

          setOrbits(updatedOrbits);
          setSep24Step('amount');
          setScreen('group-detail');
        }, 1000);
      }, 1800);
    }, 1500);
  };

  // ONE-TAP SIGN CONTRIBUTION
  const handleContributeOneTap = () => {
    if (!walletUnlocked) {
      setShowHardwarePrompt(true);
      addLog('wallet', 'Signature authorization failed: Hardware Key Required', 'Hardware-bound credential requests physical touch-activation key verification.');
      return;
    }

    setIsBiometricSigning(true);
    addLog('contract', `OrbitGroup [${currentOrbit.name}] contribution requested`, `Validating account state...`);

    setTimeout(() => {
      setBiometricSuccess(true);
      setTimeout(() => {
        setIsBiometricSigning(false);
        setBiometricSuccess(false);

        // Deduct wallet balance
        const updatedUsdcBalance = userWallet.usdcBalance - currentOrbit.contributionAmount;
        setUserWallet(prev => ({
          ...prev,
          usdcBalance: updatedUsdcBalance
        }));

        // Update group state
        const updatedOrbits = orbits.map(o => {
          if (o.id === currentOrbit.id) {
            const history = { ...o.roundsHistory };
            history['user_efe'] = [...history['user_efe']];
            history['user_efe'][o.currentRound - 1] = true;

            const newLivePotBalance = o.livePotBalance + o.contributionAmount;
            
            // Check if ALL members contributed for this round
            const activeMembers = o.members.filter(m => m.status === 'active');
            const allContributed = activeMembers.every(m => history[m.id][o.currentRound - 1] === true);

            let nextRound = o.currentRound;
            let status = o.status;
            let livePot = newLivePotBalance;

            addLog('contract', `Soroban: User Efe Adebayo signed contribution of ${o.contributionAmount} USDC`, `OrbitGroup Contract Address: CC3A...88X2\nEvent: ContributionMade(user_efe, round=${o.currentRound})`);

            if (allContributed) {
              addLog('indexer', `Stellar Indexer: All members contributed for Round ${o.currentRound}! Auto-releasing pot to recipient.`, `Pot size: ${newLivePotBalance} USDC\nEmitted Event: RoundCompleted(round=${o.currentRound}, total=${newLivePotBalance})`);
              
              const currentRecipient = o.members.find(m => m.rotationIndex === o.currentRound - 1);
              if (currentRecipient) {
                addLog('contract', `Soroban contract: Disbursed ${newLivePotBalance} USDC to recipient ${currentRecipient.name}`, `To Address: ${currentRecipient.address}\nStatus: Settled.`);
              }

              // Auto advance round
              if (o.currentRound < o.totalRounds) {
                nextRound = o.currentRound + 1;
                livePot = 0; // reset for next round
                addLog('indexer', `Stellar Indexer: Advancing OrbitGroup to Round ${nextRound}`, `Postgres database table 'orbits' synchronized with on-chain ledger.`);
                addLog('websocket', `WebSockets: Broadcast 'orbit_updated' event to all 5 active members.`, `Action: Home Screen UI updated instantly.`);
              } else {
                status = 'completed';
                livePot = 0;
                addLog('contract', `Soroban: OrbitGroup cycle completed! All rounds settled successfully.`, `ReputationIssuer contract triggered: Mints ZK Credentials for all 100% compliant members.`);
                addLog('indexer', `Stellar Indexer: Minting completed. Postgres updated status to 'completed'.`);
              }
            } else {
              addLog('indexer', `Stellar Indexer: Event ContributionMade captured in Postgres.`, `Orbit [${o.name}] now at ${newLivePotBalance}/${o.contributionAmount * activeMembers.length} USDC for Round ${o.currentRound}.`);
              addLog('websocket', `WebSockets: Broadcast contribution update to Lagos Solar Orbit.`, `Action: Green grid updated on details page.`);
            }

            return {
              ...o,
              livePotBalance: livePot,
              currentRound: nextRound,
              status,
              roundsHistory: history
            };
          }
          return o;
        });

        setOrbits(updatedOrbits);
        setSep24Step('amount');
        setScreen('group-detail');
      }, 1000);
    }, 1800);
  };

  // CLAIM PAYOUT
  const handleClaimPayout = () => {
    setPayoutProcessing(true);
    const payoutAmount = currentOrbit.contributionAmount * currentOrbit.members.filter(m => m.status === 'active').length;
    addLog('contract', `Claim requested on OrbitGroup [${currentOrbit.name}]`, `Caller address: ${userWallet.address}\nRound: ${currentOrbit.currentRound}\nValidating eligible recipient...`);

    setTimeout(() => {
      // release pot
      addLog('ledger', `Stellar Ledger: Transaction verified. Release payout to recipient.`, `Hash: 0a4b...e8f3\nValue: +${payoutAmount} USDC`);
      setUserWallet(prev => ({
        ...prev,
        usdcBalance: prev.usdcBalance + payoutAmount
      }));

      // Update orbit history to mark current recipient payout as complete
      const updatedOrbits = orbits.map(o => {
        if (o.id === currentOrbit.id) {
          addLog('indexer', `Stellar Indexer: PayoutSent event indexed.`, `Postgres synced: Efe Adebayo received ${payoutAmount} USDC payout.`);
          return {
            ...o,
            livePotBalance: 0
          };
        }
        return o;
      });
      setOrbits(updatedOrbits);
      setPayoutProcessing(false);
      addLog('wallet', `USDC wallet balance updated: +${payoutAmount} USDC`);
    }, 1500);
  };

  // SEP-24 Off-ramp (USDC -> Naira bank)
  const handleSep24Withdrawal = (amount: number) => {
    setPayoutProcessing(true);
    const ngnValue = amount * 1500; // 1500 exchange rate
    addLog('sep24', `Interactive Withdrawal: Initiating SEP-24 off-ramp for ${amount} USDC`, `Target: ${payoutBankForm.accountNumber} (${payoutBankForm.bankName})\nExchange Rate: 1,500 NGN = 1.00 USDC`);

    setTimeout(() => {
      setUserWallet(prev => ({
        ...prev,
        usdcBalance: prev.usdcBalance - amount,
        nairaBalance: prev.nairaBalance + ngnValue
      }));
      setPayoutProcessing(false);
      addLog('ledger', `Stellar Ledger: USDC Burned for off-ramp reference.`, `Hash: dc83...ff12\nAmount: -${amount} USDC`);
      addLog('sep24', `Spark Anchor: Bank transfer initiated to Zenith bank.`, `Naira Sent: +${ngnValue.toLocaleString()} NGN\nTransaction completed.`);
      addLog('wallet', `Naira credited in Bank Account: +${ngnValue.toLocaleString()} NGN`);
    }, 1800);
  };

  // GENERATE ZK PROOF
  const handleGenerateZKProof = () => {
    addLog('contract', `ReputationIssuer: Fetching completed cycle history for address ${userWallet.address}`, `Cycles Completed: 4\nDefaults: 0\nCompliance Rate: 100%`);
    
    setTimeout(() => {
      setZkProofGenerated(true);
      addLog('contract', `ReputationIssuer: ZK Credential signed on-chain`, `Proof Hash: ZKP-0x8fd2a9...12c9b\nMints zero-knowledge token containing no personal identification data.`);
    }, 1200);
  };

  const proofUrl = `https://orbit.ajo/verify?address=${userWallet.address}&cycles=4&rate=100&ref=stellar-zk`;

  const copyProofLink = () => {
    navigator.clipboard.writeText(proofUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addLog('wallet', `Copied cryptographic verification link to clipboard.`);
  };

  const isLight = theme === 'light';

  // Fixed height + internal scroll makes sense at lg+, where this sits next
  // to a side panel styled like a phone-mockup card. On an actual mobile
  // viewport that's a scroll-within-scroll box trapping most of the app's
  // real interactions — let it flow with the page instead (lg:h-[640px]).
  return (
    <div id="member-app" className={`border rounded-3xl p-5 shadow-2xl flex flex-col lg:h-[640px] transition-colors duration-300 w-full relative overflow-hidden ${
      isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0A0A0A] border-white/10 text-[#E0E0E0]'
    }`}>
      {/* Header section of the Member App (replacing notch/status bar with a real web title) */}
      <div className={`flex justify-between items-center mb-5 pb-4 border-b border-dashed ${
        isLight ? 'border-zinc-200' : 'border-white/10'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border text-orange-500 ${
            isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-white/10'
          }`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className={`font-serif italic text-base tracking-wider ${isLight ? 'text-zinc-900 font-medium' : 'text-white'}`}>Member Wallet</h2>
            <p className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>Your personal savings & digital identity</p>
          </div>
        </div>
        {userWallet.address && (
          <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
            CONNECTED
          </span>
        )}
      </div>

      {/* Screen Content Wrapper */}
      <div className="flex-1 overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
            {/* SCREEN 1: ONBOARDING */}
            {screen === 'onboarding' && (
              <motion.div 
                key="onboarding"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 flex-1 flex flex-col justify-between pt-8"
              >
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-2xl border border-white/10">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className={`text-lg font-serif italic text-center tracking-wider mb-2 ${isLight ? 'text-zinc-900' : 'text-white'}`}>Orbit Savings</h2>
                  <p className={`text-[11px] text-center px-4 leading-relaxed mb-6 ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                    Savings group rotations structured on-chain. Secure, compliant, and decentralized.
                  </p>

                  {onboardingStep === 1 && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div>
                        <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Enter Phone Number</label>
                        <div className="relative">
                          <Phone className={`absolute left-3 top-3 w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-white/30'}`} />
                          <input 
                            type="text" 
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className={`w-full border focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none font-mono transition-colors ${
                              isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-[#0A0A0A] border-white/10 text-white'
                            }`}
                            placeholder="+234 801..."
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        disabled={phoneInput.length < 8}
                        className={`w-full font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors shadow-lg uppercase tracking-wider ${
                          isLight 
                            ? 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400' 
                            : 'bg-white text-black hover:bg-white/90 disabled:bg-white/5 disabled:text-white/20'
                        }`}
                      >
                        Create Account
                      </button>
                    </form>
                  )}

                  {onboardingStep === 2 && (
                    <div className="space-y-4 text-center mt-4">
                      <div className={`p-4 rounded-2xl border flex flex-col items-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <Key className="w-8 h-8 text-orange-400 mb-2 animate-bounce" />
                        <span className={`text-xs font-semibold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Generate Device Passkey</span>
                        <p className={`text-[10px] text-center mt-1 leading-relaxed ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                          We create a silent cryptographic wallet tied to your phone's biometric lock. No seed phrase needed.
                        </p>
                      </div>
                      <button 
                        onClick={handleCreatePasskey}
                        className={`w-full font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider ${
                          isLight ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-white/90'
                        }`}
                      >
                        <Fingerprint className="w-4 h-4" /> Sign with Biometrics
                      </button>
                    </div>
                  )}

                  {onboardingStep === 3 && (
                    <form onSubmit={handleKycSubmit} className="space-y-3 mt-2">
                      <div className={`p-3 border rounded-xl mb-2 text-left ${isLight ? 'bg-orange-50 border-orange-200/60' : 'bg-orange-950/10 border-orange-900/20'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-orange-500" />
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${isLight ? 'text-orange-700' : 'text-orange-300'}`}>SEP-24 KYC Interactive Portal</span>
                        </div>
                        <p className={`text-[9px] ${isLight ? 'text-zinc-600' : 'text-white/40'}`}>Nigerian regulations require a one-time identity clearance to connect Naira accounts.</p>
                      </div>
                      <div>
                        <label className={`block text-[9px] mb-1 font-semibold uppercase ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Full Legal Name</label>
                        <input 
                          type="text" 
                          required
                          value={kycForm.name}
                          onChange={(e) => setKycForm({...kycForm, name: e.target.value})}
                          placeholder="Efe Adebayo"
                          className={`w-full border focus:border-orange-500 rounded-lg py-2 px-3 text-xs outline-none transition-colors ${
                            isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] mb-1 font-semibold uppercase ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Bank Verification Number (BVN)</label>
                        <input 
                          type="password" 
                          maxLength={11}
                          placeholder="•••••••••••"
                          className={`w-full border focus:border-orange-500 rounded-lg py-2 px-3 text-xs outline-none font-mono transition-colors ${
                            isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900 font-sans' : 'bg-white/5 border-white/10 text-white font-mono'
                          }`}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors mt-2 uppercase tracking-wider"
                      >
                        Verify Identity (Anchor)
                      </button>
                    </form>
                  )}
                </div>

                <div className={`text-[9px] text-center border-t pt-3 flex items-center justify-center gap-1 ${isLight ? 'border-zinc-200 text-zinc-400' : 'border-white/5 text-white/30'}`}>
                  <ShieldCheck className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-white/40'}`} /> Verified via Stellar SEP-24 Compliance
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: HOME / MY ORBITS */}
            {screen === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex-1 flex flex-col justify-between relative"
              >
                <div>
                  {/* Persistent Minimal Account Balance Pills */}
                  <div className="flex justify-between items-center mb-5 gap-3">
                    <div className={`px-3 py-2 rounded-2xl border flex items-center gap-2 shadow-sm min-w-0 flex-1 ${
                      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border border-white/10'
                    }`}>
                      <Wallet className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <div className="text-left min-w-0">
                        <span className={`text-[8px] uppercase tracking-wider block font-semibold leading-none mb-0.5 ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                          Account Balance
                        </span>
                        <span className={`text-xs font-mono font-bold block leading-none truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                          {userWallet.usdcBalance.toFixed(2)} <span className="text-[9px] font-sans text-orange-500 font-bold">USDC</span>
                        </span>
                      </div>
                    </div>

                    <div className={`px-3 py-2 rounded-2xl border text-left shadow-sm flex-1 min-w-0 ${
                      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border border-white/10'
                    }`}>
                      <span className={`text-[8px] uppercase tracking-wider block font-semibold leading-none mb-0.5 ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                        Local Currency
                      </span>
                      <span className={`text-xs font-mono font-bold block leading-none truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        ₦{userWallet.nairaBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* My Orbits List */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>My Active Orbits</h3>
                      <span className="text-[9px] text-zinc-400">Showing {orbits.length} groups</span>
                    </div>

                    {orbits.map(orbit => {
                      // Find whose turn it is
                      const currentRecipient = orbit.members.find(m => m.rotationIndex === orbit.currentRound - 1);
                      const isYourTurn = currentRecipient?.id === 'user_efe';
                      const hasContributedThisRound = orbit.roundsHistory['user_efe'][orbit.currentRound - 1];

                      // Calculate round contribution progress
                      const roundIndex = orbit.currentRound - 1;
                      const totalMembers = orbit.members.length;
                      const contributedCount = orbit.status === 'completed'
                        ? totalMembers
                        : orbit.members.reduce((acc, m) => {
                            const history = orbit.roundsHistory[m.id];
                            return history && history[roundIndex] === true ? acc + 1 : acc;
                          }, 0);

                      return (
                        <motion.div 
                          key={orbit.id}
                          onClick={() => { setSelectedOrbitId(orbit.id); setScreen('group-detail'); }}
                          whileHover={{ scale: 1.012 }}
                          whileTap={{ scale: 0.985 }}
                          className={`rounded-2xl p-4 cursor-pointer transition-all border flex items-center justify-between gap-4 ${
                            isLight 
                              ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300' 
                              : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {/* Left: Progress Ring & Basic Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <ProgressRing contributed={contributedCount} total={totalMembers} isLight={isLight === true} />
                            <div className="text-left truncate">
                              <h4 className={`font-serif italic text-xs font-semibold flex items-center gap-1 ${isLight ? 'text-zinc-900 font-medium' : 'text-white'}`}>
                                {orbit.name}
                              </h4>
                              <p className={`text-[10px] mt-0.5 tracking-wide font-medium flex items-center gap-1.5 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                                <span>{orbit.contributionAmount} USDC</span>
                                <span className={isLight ? 'text-zinc-300' : 'text-white/10'}>•</span>
                                <span className="font-mono">R{orbit.currentRound}/{orbit.totalRounds}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Dynamic & Clean Action / Status */}
                          <div className="flex items-center gap-2 shrink-0">
                            {orbit.status === 'completed' ? (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                isLight ? 'bg-zinc-100 text-zinc-500' : 'bg-white/5 text-white/40'
                              }`}>
                                Completed
                              </span>
                            ) : isYourTurn ? (
                              <span className="bg-orange-500 text-zinc-950 font-sans text-[8px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm animate-pulse">
                                Your Turn
                              </span>
                            ) : (
                              <span className={`text-[8px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider ${
                                hasContributedThisRound 
                                  ? 'bg-emerald-500/10 text-emerald-650' 
                                  : (isLight ? 'bg-red-50 text-red-650' : 'bg-red-950/20 text-red-400')
                              }`}>
                                {hasContributedThisRound ? 'Paid' : 'Pending'}
                              </span>
                            )}
                            
                            {/* Direct sleek chevron / navigation cue */}
                            <div className={`p-1 rounded-lg border transition-colors ${
                              isLight ? 'bg-white border-zinc-200 text-zinc-400' : 'bg-white/5 border-white/10 text-white/40'
                            }`}>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* FAB Menu */}
                <div className="absolute bottom-16 right-4 z-40 flex flex-col items-end gap-2">
                  <AnimatePresence>
                    {isFabOpen && (
                      <div className="flex flex-col items-end gap-2 mb-2">
                        {/* Deposit Option */}
                        <motion.button
                          initial={{ opacity: 0, y: 15, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.9 }}
                          onClick={() => {
                            setIsFabOpen(false);
                            setSep24Step('amount');
                            setScreen('contribute');
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-semibold uppercase tracking-wider shadow-lg transition-colors duration-200 ${
                            isLight
                              ? 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                              : 'bg-[#141414] hover:bg-[#1C1C1C] text-white border-white/10'
                          }`}
                        >
                          <span>Deposit (SEP-24)</span>
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </div>
                        </motion.button>

                        {/* Reputation Option */}
                        <motion.button
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          onClick={() => {
                            setIsFabOpen(false);
                            setScreen('reputation');
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-semibold uppercase tracking-wider shadow-lg transition-colors duration-200 ${
                            isLight
                              ? 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                              : 'bg-[#141414] hover:bg-[#1C1C1C] text-white border-white/10'
                          }`}
                        >
                          <span>Reputation ZK-ID</span>
                          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                        </motion.button>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Main FAB Toggle Button */}
                  <button
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 border ${
                      isFabOpen 
                        ? (isLight ? 'bg-zinc-900 border-zinc-800' : 'bg-[#1C1C1C] border-white/15')
                        : 'bg-orange-500 hover:bg-orange-400 border-orange-600'
                    }`}
                  >
                    <Plus className={`w-5 h-5 transition-transform duration-300 ${isFabOpen ? 'rotate-45 text-white' : 'text-zinc-950'}`} />
                  </button>
                </div>

                <div className="pt-4 mt-6 border-t border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className={`${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Ajo Stellar Sandbox v1.0</span>
                  <button 
                    onClick={handleResetProfile}
                    className={`font-medium transition-all duration-200 underline hover:no-underline ${
                      isLight 
                        ? 'text-zinc-500 hover:text-orange-600' 
                        : 'text-white/40 hover:text-orange-400'
                    }`}
                  >
                    Reset Onboarding Session
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: GROUP DETAIL */}
            {screen === 'group-detail' && (
              <motion.div 
                key="detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setScreen('home')} className="p-1 hover:bg-zinc-800 rounded-lg">
                      <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <h3 className="font-sans font-semibold text-xs uppercase text-zinc-400 tracking-wide">Orbit Group Details</h3>
                  </div>

                  {/* Orbit Stats Card */}
                  <div className={`rounded-2xl p-3.5 border mb-4 relative overflow-hidden ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className={`text-sm font-serif italic tracking-wide flex items-center gap-1.5 ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>
                          {currentOrbit.name}
                        </h2>
                        <p className={`text-[9px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                          Stellar Contract ID: <span className={`font-mono text-[8px] select-all ${isLight ? 'text-orange-650' : 'text-orange-400/80'}`}>CC3A...88X2</span>
                        </p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                        isLight 
                          ? 'bg-orange-50 text-orange-600 border-orange-200' 
                          : 'bg-orange-950/30 text-orange-400 border-orange-900/20'
                      }`}>
                        Round {currentOrbit.currentRound} of {currentOrbit.totalRounds}
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 pt-2.5 border-t text-[9px] ${isLight ? 'border-zinc-200 text-zinc-500' : 'border-white/5 text-white/50'}`}>
                      <div className={`p-2 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                        <span>Live Pot Contract Balance:</span>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                          {currentOrbit.livePotBalance}.00 USDC
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                        <span>Contribution Cost:</span>
                        <div className={`text-xs font-sans font-semibold mt-0.5 ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                          {currentOrbit.contributionAmount} USDC <span className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>({currentOrbit.frequency})</span>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-2.5 pt-2 border-t flex justify-between items-center text-[9px] ${isLight ? 'border-zinc-200 text-zinc-400' : 'border-white/5 text-white/50'}`}>
                      <span>Ledger Records:</span>
                      <button
                        onClick={() => setShowHistoryDrawer(true)}
                        className={`font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                          isLight ? 'text-orange-600 hover:text-orange-700' : 'text-orange-400 hover:text-orange-350'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> View History
                      </button>
                    </div>
                  </div>

                  {/* Member Contribution Grid */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Contribution Matrix</h4>
                      <span className="text-[8px] text-zinc-500">Green = Contributed • Red = Pending</span>
                    </div>

                    <div className="space-y-2.5">
                      {currentOrbit.members.map(member => {
                        const isUser = member.id === 'user_efe';
                        const rotationNum = member.rotationIndex + 1;
                        const isCurrentPayoutRecip = member.rotationIndex === currentOrbit.currentRound - 1;

                        return (
                          <div key={member.id} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                                {isCurrentPayoutRecip && (
                                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-zinc-950 text-[6px] font-extrabold w-3 h-3 rounded-full flex items-center justify-center border border-zinc-950 select-none">
                                    🌟
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium text-[11px] flex items-center gap-1">
                                  {member.name} {isUser && <span className="text-[8px] text-orange-400">(YOU)</span>}
                                </span>
                                <span className="text-[8px] text-white/40 font-mono block">
                                  Orbit Order: {rotationNum}
                                </span>
                              </div>
                            </div>

                            {/* Round dots */}
                            <div className="flex gap-1 shrink-0">
                              {Array.from({ length: currentOrbit.totalRounds }).map((_, idx) => {
                                const hasContributed = currentOrbit.roundsHistory[member.id]?.[idx];
                                const isFuture = idx >= currentOrbit.currentRound;
                                const isCurrent = idx === currentOrbit.currentRound - 1;

                                let dotClass = 'bg-zinc-800 border-transparent';
                                if (hasContributed) {
                                  dotClass = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
                                } else if (!isFuture) {
                                  dotClass = isCurrent ? 'bg-red-500 animate-pulse' : 'bg-red-950/50 border border-red-900/30';
                                }

                                return (
                                  <div 
                                    key={idx} 
                                    title={`Round ${idx+1}`} 
                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${dotClass}`}
                                  >
                                    {hasContributed && '✓'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payout Schedule Tracker */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 mb-2.5">
                    <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-2">Cycle Payout Schedule</h4>
                    <div className="space-y-1.5 text-[10px]">
                      {currentOrbit.members
                        .sort((a,b) => a.rotationIndex - b.rotationIndex)
                        .map((member, idx) => {
                          const isFinished = idx < currentOrbit.currentRound - 1;
                          const isNext = idx === currentOrbit.currentRound - 1;
                          return (
                            <div key={member.id} className="flex justify-between items-center text-[10px] text-white/60">
                              <span className="flex items-center gap-1">
                                <span className="text-[8px] text-white/30 font-mono">[{idx+1}]</span>
                                <span className={isNext ? 'text-orange-400 font-semibold' : ''}>{member.name}</span>
                              </span>
                              <span className="text-[9px] font-mono">
                                {isFinished ? (
                                  <span className="text-white/30 flex items-center gap-0.5">Paid ✓</span>
                                ) : isNext ? (
                                  <span className="text-orange-400 font-semibold flex items-center gap-0.5">Active Payout...</span>
                                ) : (
                                  <span className="text-white/30">Round {idx+1}</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Primary Actions based on state */}
                <div className="shrink-0 space-y-2 mt-4 pt-4 border-t border-white/5">
                  {currentOrbit.status === 'completed' ? (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center text-xs">
                      <p className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Orbit Rotation Completed
                      </p>
                      <p className="text-[9px] text-white/40 mt-1">All members paid. Minted reputations verified on-chain!</p>
                      <button 
                        onClick={() => setScreen('reputation')} 
                        className="mt-2 w-full bg-orange-950/30 hover:bg-orange-950/50 border border-orange-900/20 text-orange-400 font-bold uppercase tracking-wider rounded-lg py-1.5 text-[10px] transition-colors"
                      >
                        Claim Reputation Certificate
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Check if you are the recipient for current round */}
                      {currentOrbit.members.find(m => m.rotationIndex === currentOrbit.currentRound - 1)?.id === 'user_efe' ? (
                        <div className="space-y-2">
                          <div className="p-2 bg-orange-950/20 border border-orange-900/20 rounded-xl text-xs text-center">
                            <span className="font-bold text-orange-400">🌟 IT'S YOUR TURN TO CLAIM!</span>
                            <p className="text-[9px] text-white/50 mt-0.5">Release the cycle's total pot of {(currentOrbit.contributionAmount * currentOrbit.members.filter(m => m.status==='active').length)} USDC.</p>
                          </div>
                          <button 
                            onClick={() => { setScreen('payout'); }}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
                          >
                            <Award className="w-4 h-4" /> Go to Payout Claim Screen
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* If you haven't contributed yet */}
                          {!currentOrbit.roundsHistory['user_efe'][currentOrbit.currentRound - 1] ? (
                            <button 
                              onClick={() => { setSep24Step('amount'); setScreen('contribute'); }}
                              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
                            >
                              <ArrowRight className="w-4 h-4" /> Contribute {currentOrbit.contributionAmount} USDC
                            </button>
                          ) : (
                            <div className="bg-emerald-950/20 border border-emerald-900/20 p-2.5 rounded-xl text-center text-[10px] text-emerald-400">
                              ✓ You contributed {currentOrbit.contributionAmount} USDC for Round {currentOrbit.currentRound}. Waiting for other orbits to complete...
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: CONTRIBUTE (USDC/Naira Interactive Deposit) */}
            {screen === 'contribute' && (
              <motion.div 
                key="contribute"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setScreen('group-detail')} className="p-1 hover:bg-zinc-800 rounded-lg">
                      <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <h3 className="font-sans font-semibold text-xs uppercase text-zinc-400 tracking-wide">Secure Contribution</h3>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] text-white/50 space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] text-white">
                      <span>Group:</span>
                      <span className="font-semibold">{currentOrbit.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contribution:</span>
                      <span className="font-mono text-white/80">{currentOrbit.contributionAmount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Wallet:</span>
                      <span className="font-mono text-orange-400 font-semibold">{userWallet.usdcBalance.toFixed(2)} USDC</span>
                    </div>
                  </div>

                  {sep24Step === 'amount' && (
                    <div className="space-y-4">
                      {userWallet.usdcBalance >= currentOrbit.contributionAmount ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-xl text-center text-xs text-emerald-400">
                            <span>You have sufficient USDC in your wallet!</span>
                            <p className="text-[9px] text-white/40 mt-1">One-Tap Passkey signing will instantly commit the funds to the group's Soroban contract.</p>
                          </div>

                          {/* Hardware Security Status Card */}
                          <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-left">
                            <div className="flex items-center gap-2">
                              <Key className={`w-3.5 h-3.5 ${walletUnlocked ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`} />
                              <div>
                                <span className="text-[9px] font-bold text-white block uppercase tracking-wider font-sans">Hardware Lock</span>
                                <span className="text-[8px] text-white/40 block">
                                  {walletUnlocked ? 'Status: Unlocked (FIDO2)' : 'Status: Locked (Key Req)'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setWalletUnlocked(!walletUnlocked);
                                addLog('wallet', walletUnlocked ? 'Wallet manually locked.' : 'Wallet manually unlocked.', 'User changed cryptographic token access restrictions.');
                              }}
                              className={`text-[8px] px-2 py-1 rounded font-bold uppercase tracking-wider border transition-colors ${
                                walletUnlocked 
                                  ? 'bg-amber-950/40 text-amber-500 border-amber-900/20 hover:bg-amber-950/60'
                                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/20 hover:bg-emerald-950/60'
                              }`}
                            >
                              {walletUnlocked ? 'Lock' : 'Unlock'}
                            </button>
                          </div>
                          
                          <button 
                            onClick={handleContributeOneTap}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-3 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider"
                          >
                            <Fingerprint className="w-5 h-5 text-black/50" /> One-Tap Passkey Contribution
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-red-950/20 border border-red-900/20 rounded-xl text-xs text-center text-red-400">
                            <span>Insufficient Wallet USDC:</span>
                            <p className="text-[9px] text-white/40 mt-1">
                              You need {(currentOrbit.contributionAmount - userWallet.usdcBalance).toFixed(2)} more USDC. Convert Naira bank funds via SEP-24 interactive flow.
                            </p>
                          </div>

                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <label className="block text-[9px] font-semibold text-white/40 uppercase mb-1">Interactive Naira Deposit Amount</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={depositAmountNGN}
                                onChange={(e) => setDepositAmountNGN(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-mono text-white flex-1 outline-none focus:border-orange-500"
                              />
                              <span className="text-xs font-semibold text-white/40">NGN</span>
                            </div>
                            <p className="text-[8px] text-white/30 mt-1.5">
                              Calculated conversion: ~{Math.round(parseFloat(depositAmountNGN || '0') / 1500)} USDC
                            </p>
                          </div>

                          <button 
                            onClick={handleSep24DepositStart}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Initiate SEP-24 NGN Deposit
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {sep24Step === 'bank-transfer' && (
                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                        <div className="text-center pb-2 border-b border-white/5">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Simulated Bank Transfer Portal</span>
                          <h4 className="text-sm font-bold text-white mt-1">₦{parseFloat(depositAmountNGN).toLocaleString()} NGN</h4>
                        </div>

                        <div className="space-y-2 text-[10px] text-white/50">
                          <div className="flex justify-between">
                            <span>Partner Bank:</span>
                            <span className="text-white/80">Providus Bank</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Account Number:</span>
                            <span className="font-mono text-white/80 font-bold">1029485710</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reference Code:</span>
                            <span className="font-mono text-orange-400 font-bold">ORB-EFE-SEP24</span>
                          </div>
                        </div>

                        <p className="text-[8px] text-white/30 text-center leading-relaxed">
                          This mock screen simulates the Stellar SEP-24 Anchor interactive popup widget. Payment triggers off-chain settlement directly with bank.
                        </p>
                      </div>

                      <button 
                        onClick={handleConfirmBankTransfer}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors uppercase tracking-wider"
                      >
                        Confirm Simulated Bank Transfer Paid
                      </button>
                    </div>
                  )}

                  {sep24Step === 'verifying' && (
                    <div className="p-8 flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-xs font-semibold">Verifying bank deposit...</span>
                      <p className="text-[9px] text-zinc-500 text-center">Settling off-chain NGN transaction with Stellar Anchor</p>
                    </div>
                  )}

                  {sep24Step === 'signed' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center space-y-1.5">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                        <h4 className="text-xs font-bold text-white">Interactive Deposit Complete!</h4>
                        <p className="text-[9px] text-white/50">
                          Anchor verified payment of ₦{parseFloat(depositAmountNGN).toLocaleString()} NGN and deposited equivalent USDC to your Stellar wallet.
                        </p>
                      </div>

                      <button 
                        onClick={() => setSep24Step('amount')}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors uppercase tracking-wider"
                      >
                        Proceed to Sign Contribution
                      </button>
                    </div>
                  )}
                </div>

                {isBiometricSigning && (
                  <div className="absolute inset-0 bg-zinc-950/90 z-50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-4">
                      <div className={`absolute inset-0 rounded-full blur-xl ${biometricSuccess ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}></div>
                      <div className={`relative p-5 rounded-full border ${biometricSuccess ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-indigo-950 border-indigo-500 text-indigo-400'}`}>
                        {biometricSuccess ? (
                          <Check className="w-12 h-12 animate-pulse" />
                        ) : (
                          <Fingerprint className="w-12 h-12 animate-pulse" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {biometricSuccess ? 'Biometrics Approved' : 'Authenticating Passkey...'}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">
                      {biometricSuccess ? 'Cryptographically signing transaction' : 'Use your devices biometric sensor to authorize transaction CC3A...88X2'}
                    </p>
                  </div>
                )}

                {showHardwarePrompt && (
                  <div className="absolute inset-0 bg-[#050505]/98 z-50 flex flex-col justify-between p-6 text-center">
                    <div className="my-auto space-y-5">
                      <div className="relative mx-auto w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 animate-pulse">
                        <Key className="w-8 h-8" />
                        {isSimulatingHardwareTap && (
                          <span className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping opacity-75"></span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Hardware Key Required</h3>
                        <p className="text-[10px] text-white/50 leading-relaxed font-sans px-2">
                          {isSimulatingHardwareTap 
                            ? 'Establishing secure challenge handshake with FIDO2 token...' 
                            : 'Your savings group requires a hardware-bound security signature. Please connect or tap your physical key to proceed.'}
                        </p>
                      </div>

                      {isSimulatingHardwareTap ? (
                        <div className="py-2 flex justify-center items-center gap-1.5 text-xs text-orange-400 font-bold uppercase tracking-wider font-sans animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Verifying Key...
                        </div>
                      ) : (
                        <div className="space-y-3 pt-3">
                          <button
                            onClick={handleSimulateHardwareKeyTap}
                            className="w-full bg-white hover:bg-white/90 text-black font-sans font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Smartphone className="w-3.5 h-3.5" /> Tap Security Key
                          </button>
                          
                          <button
                            onClick={() => setShowHardwarePrompt(false)}
                            className="text-[9px] text-white/40 hover:text-white/60 uppercase tracking-wider font-bold"
                          >
                            Cancel Signing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 5: PAYOUT (Release Pot) */}
            {screen === 'payout' && (
              <motion.div 
                key="payout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex-1 flex flex-col justify-between animate-fade-in"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setScreen('group-detail')} className="p-1 hover:bg-zinc-800 rounded-lg">
                      <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <h3 className="font-sans font-semibold text-xs uppercase text-zinc-400 tracking-wide">Claim Payout Pot</h3>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center space-y-2 mb-4">
                    <Award className="w-10 h-10 text-yellow-500 mx-auto fill-yellow-500/10" />
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Lagos Solar Orbit Round {currentOrbit.currentRound}</span>
                    <h2 className="text-xl font-bold text-orange-400 font-mono">250.00 USDC</h2>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                      You are the designated recipient for this rotation! Tap below to release the contract pot.
                    </p>
                  </div>

                  {userWallet.usdcBalance < 250 && currentOrbit.livePotBalance > 0 ? (
                    <div className="space-y-4">
                      <button 
                        onClick={handleClaimPayout}
                        disabled={payoutProcessing}
                        className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-white/5 text-black font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
                      >
                        {payoutProcessing ? 'Releasing Contract...' : 'Claim & Disburse Pot to Wallet'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center text-xs text-emerald-400 mb-2">
                        ✓ Pot released to your USDC Wallet address successfully!
                      </div>

                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-3">
                        <span className="text-[9px] font-semibold text-white/40 uppercase">Optional instant SEP-24 Naira Withdrawal</span>
                        
                        <div className="space-y-2 text-left">
                          <div>
                            <label className="block text-[8px] uppercase text-white/40">Destination Bank</label>
                            <input 
                              type="text" 
                              value={payoutBankForm.bankName}
                              onChange={(e) => setPayoutBankForm({...payoutBankForm, bankName: e.target.value})}
                              className="w-full bg-[#050505] border border-white/10 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase text-white/40">Account Number</label>
                            <input 
                              type="text" 
                              value={payoutBankForm.accountNumber}
                              onChange={(e) => setPayoutBankForm({...payoutBankForm, accountNumber: e.target.value})}
                              className="w-full bg-[#050505] border border-white/10 rounded-lg py-1.5 px-2 text-xs font-mono outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={() => handleSep24Withdrawal(250)}
                          disabled={payoutProcessing}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 text-white font-sans font-semibold rounded-lg py-2 text-[10px] transition-colors uppercase tracking-wider"
                        >
                          {payoutProcessing ? 'Withdrawing Naira...' : 'Initiate SEP-24 off-ramp (250 USDC)'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 shrink-0">
                  <button 
                    onClick={() => setScreen('home')} 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-sans font-medium rounded-xl py-2 text-xs transition-colors"
                  >
                    Back to My Orbits
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 6: MY REPUTATION (ZK Proof generation) */}
            {screen === 'reputation' && (
              <motion.div 
                key="reputation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setScreen('home')} className="p-1 hover:bg-zinc-800 rounded-lg">
                      <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <h3 className="font-sans font-semibold text-xs uppercase text-zinc-400 tracking-wide">Reputation Score</h3>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center space-y-3 mb-4">
                    <Award className="w-12 h-12 text-orange-400 mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-sm font-serif italic text-white">4 Completed Cycles</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold font-mono">100% Completion Rate</span>
                    </div>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                      ReputationIssuer contract verifies your complete record of contribution payments across all groups, with zero transaction defaults.
                    </p>
                  </div>

                  {!zkProofGenerated ? (
                    <button 
                      onClick={handleGenerateZKProof}
                      className="w-full bg-orange-500 hover:bg-orange-400 text-black font-sans font-semibold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <Fingerprint className="w-4 h-4" /> Generate Zero-Knowledge Proof
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center text-center space-y-2">
                        <QrCode className="w-24 h-24 text-white" />
                        <span className="text-[10px] text-emerald-400 font-semibold">ZK Cryptographic Proof Generated!</span>
                        <p className="text-[8px] text-white/40">
                          Provide this cryptographic certificate to any third-party lender. They verify your history without reading your private keys.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={copyProofLink}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg py-2 text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> {copiedLink ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button 
                          onClick={() => {
                            onNavigateToWebVerifier(proofUrl);
                            addLog('websocket', `Redirecting client to Web Verifier Portal.`, `Verifying proof for address: ${userWallet.address}`);
                          }}
                          className="bg-orange-950/30 border border-orange-900/20 hover:bg-orange-900 text-orange-400 font-semibold rounded-lg py-2 px-3 text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                          title="Open in Web Verifier Panel"
                        >
                          Verify Link <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 shrink-0">
                  <button 
                    onClick={() => setScreen('home')} 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-sans font-medium rounded-xl py-2 text-xs transition-colors"
                  >
                    Back to My Orbits
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slide-up History Drawer */}
        <AnimatePresence>
          {showHistoryDrawer && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistoryDrawer(false)}
                className="absolute inset-0 bg-black/60 z-50 cursor-pointer"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className={`absolute bottom-0 left-0 right-0 max-h-[540px] rounded-t-3xl p-5 z-50 border-t flex flex-col ${
                  isLight 
                    ? 'bg-zinc-50 border-zinc-200 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]' 
                    : 'bg-[#121212] border-white/10 shadow-[0_-8px_30px_rgb(0,0,0,0.3)]'
                }`}
              >
                {/* Drag Handle */}
                <div className="flex justify-center mb-4">
                  <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-white/10'}`} />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-left">
                    <h3 className={`font-serif italic text-sm ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>
                      {currentOrbit.name} History
                    </h3>
                    <p className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>
                      On-chain ledger events index
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowHistoryDrawer(false);
                      setHistorySearchQuery('');
                      setHistoryFilter('all');
                      setHistoryDateRange('all');
                      setHistoryStatusFilter('all');
                    }}
                    className={`p-1.5 rounded-lg border ${
                      isLight 
                        ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-400' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/40'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* D3 Contribution Volume Trend Line Chart */}
                {(() => {
                  const chartEvents = getHistoryEvents().filter(event => {
                    if (event.type !== 'contribution') return false;
                    if (event.status !== 'success') return false;
                    
                    if (historyDateRange === '30days') {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      if (event.date < thirtyDaysAgo) return false;
                    } else if (historyDateRange === '3months') {
                      const ninetyDaysAgo = new Date();
                      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                      if (event.date < ninetyDaysAgo) return false;
                    }
                    return true;
                  });

                  const sortedChartEvents = [...chartEvents].sort((a, b) => a.date.getTime() - b.date.getTime());

                  const dailyGroupMap = new Map<string, { date: Date; amount: number }>();
                  sortedChartEvents.forEach(e => {
                    const dateKey = e.date.toDateString();
                    if (dailyGroupMap.has(dateKey)) {
                      dailyGroupMap.get(dateKey)!.amount += e.amount;
                    } else {
                      dailyGroupMap.set(dateKey, { date: e.date, amount: e.amount });
                    }
                  });

                  const sortedDailyGrouped = Array.from(dailyGroupMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

                  let rollingSum = 0;
                  const rawChartPoints = sortedDailyGrouped.map(d => {
                    rollingSum += d.amount;
                    return { date: d.date, value: rollingSum };
                  });

                  let finalChartPoints = [...rawChartPoints];
                  const hasRealData = rawChartPoints.length > 0;
                  
                  if (finalChartPoints.length === 0) {
                    const today = new Date();
                    const past = new Date();
                    past.setDate(past.getDate() - (historyDateRange === '30days' ? 30 : historyDateRange === '3months' ? 90 : 15));
                    finalChartPoints = [
                      { date: past, value: 0 },
                      { date: today, value: 0 }
                    ];
                  } else if (finalChartPoints.length === 1) {
                    const p = finalChartPoints[0];
                    const prevDate = new Date(p.date);
                    prevDate.setDate(prevDate.getDate() - 1);
                    finalChartPoints = [
                      { date: prevDate, value: 0 },
                      p
                    ];
                  }

                  const svgWidth = 340;
                  const svgHeight = 70;
                  const chartMargin = { top: 8, right: 15, bottom: 18, left: 35 };

                  const xScale = d3.scaleTime()
                    .domain(d3.extent(finalChartPoints, d => d.date) as [Date, Date])
                    .range([chartMargin.left, svgWidth - chartMargin.right]);

                  const yScale = d3.scaleLinear()
                    .domain([0, d3.max(finalChartPoints, d => d.value) || 100])
                    .range([svgHeight - chartMargin.bottom, chartMargin.top]);

                  const lineGenerator = d3.line<{ date: Date; value: number }>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

                  const pathD = lineGenerator(finalChartPoints) || '';

                  const areaGenerator = d3.area<{ date: Date; value: number }>()
                    .x(d => xScale(d.date))
                    .y0(svgHeight - chartMargin.bottom)
                    .y1(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

                  const areaD = areaGenerator(finalChartPoints) || '';

                  const yTicks = yScale.ticks(3);
                  const xTicks = xScale.ticks(3);
                  const totalVolume = hasRealData ? rollingSum : 0;

                  return (
                    <div className={`p-3 rounded-2xl border mb-3 shrink-0 ${
                      isLight 
                        ? 'bg-white border-zinc-200 shadow-sm' 
                        : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>
                          Contribution Volume Trend
                        </span>
                        <span className="font-mono text-[10px] font-bold text-orange-500">
                          {totalVolume.toLocaleString()} USDC Total
                        </span>
                      </div>
                      
                      <div className="relative h-[70px] w-full">
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="70" className="overflow-visible">
                          <defs>
                            <linearGradient id="historyChartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity={isLight ? 0.25 : 0.35} />
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines & Y axis ticks */}
                          {yTicks.map(tick => (
                            <g key={tick} transform={`translate(0, 0)`}>
                              <line 
                                x1={chartMargin.left} 
                                x2={svgWidth - chartMargin.right} 
                                y1={yScale(tick)} 
                                y2={yScale(tick)} 
                                stroke={isLight ? '#f4f4f5' : '#1f1f23'} 
                                strokeWidth={1} 
                              />
                              <text 
                                x={chartMargin.left - 6} 
                                y={yScale(tick)} 
                                textAnchor="end" 
                                alignmentBaseline="middle" 
                                className={`text-[7px] font-mono fill-current ${isLight ? 'text-zinc-400' : 'text-white/30'}`}
                              >
                                {tick}
                              </text>
                            </g>
                          ))}

                          {/* X axis ticks */}
                          {xTicks.map((tick, idx) => (
                            <g key={idx} transform={`translate(0, 0)`}>
                              <text 
                                x={xScale(tick)} 
                                y={svgHeight - chartMargin.bottom + 11} 
                                textAnchor="middle" 
                                className={`text-[7px] font-mono fill-current ${isLight ? 'text-zinc-400' : 'text-white/30'}`}
                              >
                                {tick.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </text>
                            </g>
                          ))}

                          {/* Area Under the Line */}
                          {pathD && (
                            <path 
                              d={areaD} 
                              fill="url(#historyChartGradient)" 
                            />
                          )}

                          {/* Trend Line */}
                          {pathD && (
                            <path 
                              d={pathD} 
                              fill="none" 
                              stroke="#f97316" 
                              strokeWidth={1.5} 
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Data points (dots) */}
                          {hasRealData && finalChartPoints.map((d, idx) => (
                            <circle
                              key={idx}
                              cx={xScale(d.date)}
                              cy={yScale(d.value)}
                              r={2}
                              fill={isLight ? '#ffffff' : '#121212'}
                              stroke="#f97316"
                              strokeWidth={1}
                            />
                          ))}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* Search & Filter Controls */}
                <div className="space-y-2.5 mb-4 shrink-0">
                  {/* Search Input */}
                  <div className="relative w-full">
                    <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-zinc-400' : 'text-white/30'}`} />
                    <input
                      type="text"
                      placeholder="Search ledger events..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className={`w-full font-sans text-xs pl-9 pr-8 py-2 rounded-xl outline-none transition-all border ${
                        isLight 
                          ? 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50' 
                          : 'bg-white/5 border-white/5 text-white placeholder-white/30 focus:border-orange-500/50'
                      }`}
                    />
                    {historySearchQuery && (
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10 ${
                          isLight ? 'text-zinc-400' : 'text-white/40'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex gap-2">
                    <select
                      value={historyDateRange}
                      onChange={(e) => setHistoryDateRange(e.target.value as any)}
                      className={`flex-1 font-sans text-xs px-2.5 py-2 rounded-xl outline-none border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                      style={{ colorScheme: isLight ? 'light' : 'dark' }}
                    >
                      <option value="all">All Time</option>
                      <option value="30days">Past 30 Days</option>
                      <option value="3months">Past 3 Months</option>
                    </select>

                    <select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                      className={`flex-1 font-sans text-xs px-2.5 py-2 rounded-xl outline-none border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                      style={{ colorScheme: isLight ? 'light' : 'dark' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="success">Successful</option>
                      <option value="pending">Pending</option>
                      <option value="arbitration">Under Arbitration</option>
                    </select>
                  </div>

                  {/* Filter Chips & Sort Toggle */}
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {(['all', 'contributions', 'payouts'] as const).map(f => {
                        const isActive = historyFilter === f;
                        const label = f === 'all' ? 'All' : f === 'contributions' ? 'Contributions' : 'Payouts';
                        return (
                          <button
                            key={f}
                            onClick={() => setHistoryFilter(f)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0 border ${
                              isActive
                                ? (isLight 
                                    ? 'bg-zinc-900 border-zinc-900 text-white' 
                                    : 'bg-white border-white text-zinc-950')
                                : (isLight 
                                    ? 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-500' 
                                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/50')
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setHistorySortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0 border ${
                        isLight
                          ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                      }`}
                      title={historySortOrder === 'desc' ? 'Sorting Newest to Oldest' : 'Sorting Oldest to Newest'}
                    >
                      <ArrowUpDown className="w-3 h-3 text-orange-500" />
                      <span>{historySortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                    </button>
                  </div>
                </div>

                {/* Event List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-left">
                  {(() => {
                    const filteredEvents = getHistoryEvents().filter(event => {
                      if (historyFilter === 'contributions' && event.type !== 'contribution') return false;
                      if (historyFilter === 'payouts' && event.type !== 'payout') return false;
                      
                      // Date range filter
                      if (historyDateRange === '30days') {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        if (event.date < thirtyDaysAgo) return false;
                      } else if (historyDateRange === '3months') {
                        const ninetyDaysAgo = new Date();
                        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                        if (event.date < ninetyDaysAgo) return false;
                      }

                      // Status filter
                      if (historyStatusFilter !== 'all') {
                        const isDisputed = disputedEventIds.includes(event.id);
                        if (historyStatusFilter === 'arbitration') {
                          if (!isDisputed) return false;
                        } else if (historyStatusFilter === 'success') {
                          if (isDisputed || event.status !== 'success') return false;
                        } else if (historyStatusFilter === 'pending') {
                          if (isDisputed || event.status === 'success') return false;
                        }
                      }

                      if (historySearchQuery) {
                        const q = historySearchQuery.toLowerCase();
                        const nameMatch = event.userName.toLowerCase().includes(q);
                        const amountMatch = event.amount.toString().includes(q);
                        const statusMatch = event.timestamp.toLowerCase().includes(q);
                        return nameMatch || amountMatch || statusMatch;
                      }
                      return true;
                    });

                    if (filteredEvents.length === 0) {
                      return (
                        <div className={`text-center py-10 text-[11px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                          No matching ledger history found.
                        </div>
                      );
                    }

                    return filteredEvents.map(event => {
                      const isPayout = event.type === 'payout';
                      return (
                        <div 
                          key={event.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            isLight 
                              ? 'bg-white border-zinc-200/60' 
                              : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2 rounded-xl border ${
                              isPayout 
                                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/10' 
                                : event.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'
                                  : 'bg-red-500/10 text-red-500 border-red-500/10'
                            }`}>
                              {isPayout ? (
                                <Award className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className={`text-[10px] font-bold block ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                                {isPayout ? `Disbursed Pot` : `Contribution`}
                              </span>
                              <span className={`text-[9px] block font-medium truncate ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                                {isPayout ? `Recipient: ` : `From: `}{event.userName}
                              </span>
                              {!isPayout && (
                                <button
                                  onClick={() => {
                                    setDisputingEvent(event);
                                    setDisputeReasonCategory('unauthorized');
                                    setDisputeExplanation('');
                                    setDisputeContact('');
                                    setDisputeSuccessMessage('');
                                    setShowDisputeSummary(false);
                                  }}
                                  className={`mt-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-all inline-flex items-center gap-1 ${
                                    disputedEventIds.includes(event.id)
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                      : isLight
                                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200 hover:text-red-500 hover:border-red-200'
                                        : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 hover:text-red-400 hover:border-red-900/30'
                                  }`}
                                  disabled={disputedEventIds.includes(event.id)}
                                >
                                  <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                                  {disputedEventIds.includes(event.id) ? 'Disputed' : 'Flag Dispute'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end">
                            {disputedEventIds.includes(event.id) && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/20 mb-1">
                                Under Arbitration
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-bold block ${
                              isPayout ? 'text-yellow-500' : 'text-emerald-500'
                            }`}>
                              {isPayout ? '+' : '-'}{event.amount} USDC
                            </span>
                            <span className={`text-[8px] block font-semibold ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                              {event.timestamp} • {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Dispute Submission Drawer/Modal Overlay */}
        <AnimatePresence>
          {disputingEvent && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!disputeIsSubmitting) {
                    setDisputingEvent(null);
                  }
                }}
                className="absolute inset-0 bg-black/75 z-[60] cursor-pointer"
              />

              {/* Dispute Modal/Drawer Container */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className={`absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 z-[70] border-t flex flex-col ${
                  isLight 
                    ? 'bg-white border-zinc-200 shadow-[0_-12px_30px_rgb(0,0,0,0.15)]' 
                    : 'bg-[#161616] border-white/10 shadow-[0_-12px_30px_rgb(0,0,0,0.4)]'
                }`}
              >
                {/* Drag Handle */}
                <div className="flex justify-center mb-4">
                  <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-white/10'}`} />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-left">
                    <h3 className={`font-serif italic text-sm flex items-center gap-1.5 ${isLight ? 'text-zinc-900 font-semibold' : 'text-white'}`}>
                      <AlertCircle className="w-4 h-4 text-red-500" /> Flag Ledger Dispute
                    </h3>
                    <p className={`text-[9px] ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>
                      Submit cryptographic challenge to Smart Contract Dispute Oracle
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!disputeIsSubmitting) {
                        setDisputingEvent(null);
                      }
                    }}
                    className={`p-1.5 rounded-lg border ${
                      isLight 
                        ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-400' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/40'
                    }`}
                    disabled={disputeIsSubmitting}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {disputeSuccessMessage ? (
                  /* Success View */
                  <div className="py-6 text-center space-y-3">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      <Check className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-xs font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Dispute Logged on Ledger</h4>
                      <p className={`text-[10px] max-w-[240px] mx-auto leading-relaxed ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                        {disputeSuccessMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDisputingEvent(null);
                        setDisputeSuccessMessage('');
                        setShowDisputeSummary(false);
                      }}
                      className="w-full mt-2 font-sans text-xs font-bold py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-500/10"
                    >
                      Done
                    </button>
                  </div>
                ) : showDisputeSummary ? (
                  /* Summary Review View */
                  <div className="space-y-4 text-left">
                    <div className={`p-3.5 rounded-2xl border ${
                      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <h4 className={`text-xs font-bold mb-2.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        Review Claim Details
                      </h4>
                      <div className="space-y-2.5 text-[11px]">
                        <div className="flex justify-between items-start pb-2 border-b border-dashed border-zinc-200/50 dark:border-white/5">
                          <span className={isLight ? 'text-zinc-400' : 'text-white/40'}>Ledger Item:</span>
                          <span className={`font-medium text-right max-w-[180px] ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                            Round {disputingEvent.round} Contribution by {disputingEvent.userName}
                          </span>
                        </div>
                        <div className="flex justify-between items-start pb-2 border-b border-dashed border-zinc-200/50 dark:border-white/5">
                          <span className={isLight ? 'text-zinc-400' : 'text-white/40'}>Claim Amount:</span>
                          <span className="font-mono font-bold text-red-500">
                            {disputingEvent.amount} USDC
                          </span>
                        </div>
                        <div className="flex justify-between items-start pb-2 border-b border-dashed border-zinc-200/50 dark:border-white/5">
                          <span className={isLight ? 'text-zinc-400' : 'text-white/40'}>Dispute Reason:</span>
                          <span className={`font-medium text-right max-w-[180px] ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                            {disputeReasonCategory === 'unauthorized' ? 'Unauthorized / Unsigned Contribution' :
                             disputeReasonCategory === 'incorrect_amount' ? 'Incorrect Amount Contributed' :
                             disputeReasonCategory === 'double_charged' ? 'Double Charge / Re-entrancy Issue' : 'Other / Custom Challenge'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-zinc-200/50 dark:border-white/5">
                          <span className={isLight ? 'text-zinc-400' : 'text-white/40'}>Detailed Explanation:</span>
                          <span className={`font-medium break-words leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            {disputeExplanation ? disputeExplanation : 'No additional details provided'}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className={isLight ? 'text-zinc-400' : 'text-white/40'}>Contact Info:</span>
                          <span className={`font-medium text-right ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                            {disputeContact ? disputeContact : 'Anonymous (None provided)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className={`p-3 rounded-xl border flex gap-2 items-start text-[9px] leading-relaxed ${
                      isLight 
                        ? 'bg-amber-50 border-amber-100 text-amber-800' 
                        : 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        Confirming submits this challenge to the on-chain Dispute Resolution contract. Your address signature is required.
                      </span>
                    </div>

                    {/* Summary Actions */}
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDisputeSummary(false)}
                        className={`flex-1 font-sans text-xs font-bold py-2.5 rounded-xl transition-all border ${
                          isLight
                            ? 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                        }`}
                        disabled={disputeIsSubmitting}
                      >
                        Modify Info
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDisputeIsSubmitting(true);
                          
                          // Simulate smart contract tx submission
                          setTimeout(() => {
                            const eventId = disputingEvent.id;
                            setDisputedEventIds(prev => [...prev, eventId]);
                            addLog(
                              'contract', 
                              `Dispute flagged for ${disputingEvent.userName}'s contribution in Round ${disputingEvent.round}`,
                              `Dispute Category: ${disputeReasonCategory} • Explanation: ${disputeExplanation || 'None'} • Contact: ${disputeContact || 'None'}`
                            );
                            setDisputeIsSubmitting(false);
                            setDisputeSuccessMessage(`Successfully flagged Round ${disputingEvent.round} contribution (${disputingEvent.amount} USDC) by ${disputingEvent.userName}. The pool has entered a 24-hour arbitration phase.`);
                          }, 1200);
                        }}
                        className={`flex-1 font-sans text-xs font-bold py-2.5 rounded-xl text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${
                          disputeIsSubmitting
                            ? 'bg-red-600 cursor-not-allowed opacity-80'
                            : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                        }`}
                        disabled={disputeIsSubmitting}
                      >
                        {disputeIsSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Confirm & Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form View */
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setShowDisputeSummary(true);
                    }}
                    className="space-y-3.5 text-left"
                  >
                    {/* Item Summary Card */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <div>
                        <span className={`block font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                          Round {disputingEvent.round} Contribution
                        </span>
                        <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                          From {disputingEvent.userName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-red-500">
                        -{disputingEvent.amount} USDC
                      </span>
                    </div>

                    {/* Category Dropdown */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                        Dispute Reason *
                      </label>
                      <select
                        value={disputeReasonCategory}
                        onChange={(e) => setDisputeReasonCategory(e.target.value)}
                        required
                        className={`w-full font-sans text-xs px-3 py-2 rounded-xl outline-none border transition-all cursor-pointer ${
                          isLight
                            ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 focus:border-red-500/50'
                            : 'bg-[#1a1a1a] border-white/10 text-white hover:bg-white/10 focus:border-red-500/50'
                        }`}
                        style={{ colorScheme: isLight ? 'light' : 'dark' }}
                      >
                        <option value="unauthorized">Unauthorized / Unsigned Contribution</option>
                        <option value="incorrect_amount">Incorrect Amount Contributed</option>
                        <option value="double_charged">Double Charge / Re-entrancy Issue</option>
                        <option value="other">Other / Custom Challenge</option>
                      </select>
                    </div>

                    {/* Explanation textarea */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                        Detailed Explanation
                      </label>
                      <textarea
                        value={disputeExplanation}
                        onChange={(e) => setDisputeExplanation(e.target.value)}
                        placeholder="Please provide details about this dispute..."
                        className={`w-full font-sans text-xs px-3 py-2 rounded-xl outline-none border transition-all h-16 resize-none ${
                          isLight 
                            ? 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-red-500/50' 
                            : 'bg-white/5 border-white/5 text-white placeholder-white/30 focus:border-red-500/50'
                        }`}
                      />
                    </div>

                    {/* Contact input */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                        Contact Email / Phone (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. user@example.com"
                        value={disputeContact}
                        onChange={(e) => setDisputeContact(e.target.value)}
                        className={`w-full font-sans text-xs px-3 py-2 rounded-xl outline-none border transition-all ${
                          isLight 
                            ? 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-red-500/50' 
                            : 'bg-white/5 border-white/5 text-white placeholder-white/30 focus:border-red-500/50'
                        }`}
                      />
                    </div>

                    {/* Warning note */}
                    <div className={`p-2.5 rounded-xl border flex gap-2 items-start text-[9px] leading-relaxed ${
                      isLight 
                        ? 'bg-red-50 border-red-100 text-red-800' 
                        : 'bg-red-950/20 border-red-900/30 text-red-400'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Challenging a ledger entry locks equivalent stake until verified by the oracle. False claims may incur reputation penalties.
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setDisputingEvent(null)}
                        className={`flex-1 font-sans text-xs font-bold py-2.5 rounded-xl transition-all border ${
                          isLight
                            ? 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                        }`}
                        disabled={disputeIsSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`flex-1 font-sans text-xs font-bold py-2.5 rounded-xl text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${
                          disputeIsSubmitting
                            ? 'bg-red-650 cursor-not-allowed opacity-80'
                            : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                        }`}
                        disabled={disputeIsSubmitting}
                      >
                        {disputeIsSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Flagging...
                          </>
                        ) : (
                          <>
                            Flag Dispute
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
  );
}
