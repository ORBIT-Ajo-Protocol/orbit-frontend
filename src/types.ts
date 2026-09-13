export type PayoutOrderType = 'fixed' | 'random' | 'auction';

export interface Member {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'invited' | 'defaulted';
  rotationIndex: number; // Order in the rotation
  address: string;
  avatar: string;
  completedCycles: number;
  completionRate: number; // e.g. 100 for 100%
}

export interface OrbitGroup {
  id: string;
  name: string;
  contributionAmount: number; // in USDC
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  payoutOrder: PayoutOrderType;
  stakePercentage: number; // e.g. 10%
  totalRounds: number; // typically equals number of members
  currentRound: number; // 1-indexed
  status: 'pending' | 'active' | 'completed';
  members: Member[];
  daysToNextContribution: number;
  livePotBalance: number; // current round pot held in contract
  // Key represents memberId, value is array of booleans indicating contribution status for each round
  roundsHistory: { [memberId: string]: boolean[] };
  // Real deployed Soroban contract ID on testnet for this sample orbit, if any.
  // The rest of this orbit's state is still simulated locally (see README) —
  // this address is real and independently inspectable on stellar.expert.
  contractAddress?: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  type: 'ledger' | 'indexer' | 'websocket' | 'wallet' | 'sep24' | 'contract';
  message: string;
  details?: string;
}

export interface UserWallet {
  address: string;
  phone: string;
  usdcBalance: number;
  nairaBalance: number;
  hasPasskey: boolean;
  kycStatus: 'none' | 'pending' | 'completed';
}
