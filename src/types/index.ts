export type TaskCapability = 'vision' | 'llm' | 'audio' | 'embeddings' | 'code';

export interface AgentPolicy {
  dailyLimit: number;
  perTaskLimit: number;
  autoApprovalLimit: number;
  spentToday: number;
  sessionKeyActive: boolean;
  sessionExpiresAt?: string;
  vaultPda: string;
}

export interface Agent {
  id: string;
  name: string;
  ownerWallet: string;
  policy: AgentPolicy;
  reputation: number;
  status: 'IDLE' | 'ANALYZING' | 'EXECUTING' | 'WAITING_APPROVAL';
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  walletAddress: string;
  gpu: string;
  models: string[];
  capabilities: TaskCapability[];
  pricePerRequest: number; // in USDC
  averageLatency: number; // in ms
  successRate: number; // percentage (e.g. 99.8)
  reputation: number; // 0 to 100
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  completedJobs: number;
  failedJobs: number;
  todayRevenue: number;
  stakeBondAmount: number; // in USDC
  maxConcurrentJobs: number;
  currentJobs: number;
}

export type JobStatus = 
  | 'idle'
  | 'created'
  | 'discovering'
  | 'provider_selected'
  | 'awaiting_approval'
  | 'escrow_locked'
  | 'inference_running'
  | 'result_received'
  | 'verifying'
  | 'settled'
  | 'refunded'
  | 'disputed';

export interface VerificationChecks {
  providerAuthenticated: boolean;
  jobIdMatched: boolean;
  outputReceived: boolean;
  schemaValid: boolean;
  latencyWithinSla: boolean;
  sha256HashValid: boolean;
  allPassed: boolean;
}

export interface Job {
  id: string;
  agentId: string;
  providerId?: string;
  modelId: string;
  taskType: TaskCapability;
  prompt: string;
  imageUrl?: string;
  inputHash: string;
  outputResult?: string;
  outputHash?: string;
  providerSignature?: string;
  price: number;
  status: JobStatus;
  verificationStatus: 'PENDING' | 'PASSED' | 'FAILED';
  verificationChecks?: VerificationChecks;
  transactionSignature?: string;
  escrowPda?: string;
  refundSignature?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  requiresMasterApproval?: boolean;
}

export interface Transaction {
  id: string;
  jobId: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  token: 'USDC';
  network: string;
  signature: string;
  status: 'CONFIRMED' | 'SIMULATED';
  timestamp: string;
  escrowPda: string;
  action: 'LOCK_ESCROW' | 'SETTLE_PAYMENT' | 'REFUND_AGENT';
}

export interface AgentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'agent' | 'chain' | 'verify' | 'error' | 'success';
  message: string;
  detail?: string;
}

export interface Http402Detail {
  endpoint: string;
  status: 402;
  priceMicroUsdc: number;
  escrowProgramId: string;
  escrowPda: string;
  receiptHeader?: string;
}
