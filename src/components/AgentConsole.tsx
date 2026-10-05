import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck, 
  ExternalLink, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { 
  Provider, 
  Job, 
  AgentLog, 
  AgentPolicy, 
  TaskCapability, 
  Http402Detail 
} from '../types';
import { selectOptimalProvider } from '../lib/agentDecision';
import type { ScoredProvider } from '../lib/agentDecision';
import { executeInference } from '../lib/providers';
import { verifyInferenceWork } from '../lib/verification';
import { 
  sha256, 
  deriveEscrowPda, 
  generateSolanaSignature, 
  getSolanaExplorerUrl, 
  shortenAddress 
} from '../lib/solana';
import { EscrowStateMachine } from './EscrowStateMachine';
import { AgentActivityTerminal } from './AgentActivityTerminal';
import { MasterApprovalModal } from './MasterApprovalModal';

interface AgentConsoleProps {
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  agentPolicy: AgentPolicy;
  setAgentPolicy: React.Dispatch<React.SetStateAction<AgentPolicy>>;
  onJobCompleted: (job: Job) => void;
  walletAddress: string;
  isDemoMode: boolean;
}

const SAMPLE_IMAGE_URL = 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=800&auto=format&fit=crop';

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  providers,
  setProviders,
  agentPolicy,
  setAgentPolicy,
  onJobCompleted,
  walletAddress: _walletAddress,
  isDemoMode: _isDemoMode,
}) => {
  const [prompt, setPrompt] = useState('Analyze this image and identify the objects, scene, and important details.');
  const [imageUrl, setImageUrl] = useState<string | undefined>(SAMPLE_IMAGE_URL);
  const [taskType, setTaskType] = useState<TaskCapability>('vision');
  const [priority, setPriority] = useState<'balanced' | 'latency' | 'price'>('latency');

  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [scoredDecision, setScoredDecision] = useState<{ selected: ScoredProvider; explanation: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [http402Detail, setHttp402Detail] = useState<Http402Detail | null>(null);

  const [pendingApprovalJob, setPendingApprovalJob] = useState<{ job: Job; provider: Provider; cost: number } | null>(null);
  const [showVerificationDetails, setShowVerificationDetails] = useState(true);

  const addLog = (level: AgentLog['level'], message: string, detail?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: AgentLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: timeStr,
      level,
      message,
      detail,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const runAutonomousWorkflow = async (
    customPrompt?: string, 
    customTaskType?: TaskCapability, 
    forcedCost?: number, 
    isChaosTest = false
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLogs([]);
    setHttp402Detail(null);

    const activePrompt = customPrompt || prompt;
    const activeTask = customTaskType || taskType;
    const jobId = `job_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    addLog('agent', 'Received autonomous task request', activePrompt);
    addLog('agent', `Identified compute capability: ${activeTask.toUpperCase()}`);

    const inputHash = await sha256(activePrompt + (imageUrl || ''));
    addLog('agent', `Payload SHA-256 digest: ${shortenAddress(inputHash, 6)}`);

    const initialJob: Job = {
      id: jobId,
      agentId: 'agent_primary_01',
      modelId: 'Llama-3.2-Vision',
      taskType: activeTask,
      prompt: activePrompt,
      imageUrl,
      inputHash,
      price: forcedCost || 0.005,
      status: 'created',
      verificationStatus: 'PENDING',
      createdAt: new Date().toLocaleTimeString(),
    };
    setCurrentJob(initialJob);

    await new Promise(r => setTimeout(r, 350));

    addLog('agent', 'Scoring registered network nodes...');
    const decision = selectOptimalProvider(providers, activeTask, 1.0, priority);
    setScoredDecision({
      selected: decision.selected,
      explanation: decision.explanation,
    });

    const chosenProvider = isChaosTest 
      ? providers.find(p => p.id === 'provider-epsilon') || decision.selected.provider
      : decision.selected.provider;

    const finalPrice = forcedCost !== undefined ? forcedCost : chosenProvider.pricePerRequest;
    
    addLog('agent', `Selected: ${chosenProvider.name} (Score: ${decision.selected.totalScore}/100)`);
    addLog('agent', `Estimated price: $${finalPrice.toFixed(4)} USDC`);

    const escrowPda = deriveEscrowPda(agentPolicy.vaultPda, jobId);

    const updatedJob: Job = {
      ...initialJob,
      providerId: chosenProvider.id,
      modelId: chosenProvider.models[0],
      price: finalPrice,
      status: 'provider_selected',
      escrowPda,
    };
    setCurrentJob(updatedJob);

    if (finalPrice > agentPolicy.autoApprovalLimit) {
      addLog('agent', `⚠️ Cost ($${finalPrice}) exceeds auto-approval ceiling ($${agentPolicy.autoApprovalLimit})`);
      addLog('agent', 'Requesting Master Wallet signature authorization...');
      
      setCurrentJob({
        ...updatedJob,
        status: 'awaiting_approval',
        requiresMasterApproval: true,
      });

      setPendingApprovalJob({
        job: updatedJob,
        provider: chosenProvider,
        cost: finalPrice,
      });
      setIsProcessing(false);
      return;
    }

    addLog('chain', `✓ Cost ($${finalPrice}) is within auto-approval threshold ($${agentPolicy.autoApprovalLimit})`);
    await proceedWithExecution(updatedJob, chosenProvider, isChaosTest);
  };

  const proceedWithExecution = async (job: Job, provider: Provider, isChaosTest = false) => {
    setIsProcessing(true);

    addLog('chain', `Initializing Escrow PDA: ${shortenAddress(job.escrowPda || '', 6)}`);
    addLog('chain', `Locking $${job.price.toFixed(4)} USDC from Agent Vault...`);
    
    await new Promise(r => setTimeout(r, 600));
    const txSig = generateSolanaSignature();
    
    setCurrentJob(prev => prev ? {
      ...prev,
      status: 'escrow_locked',
      transactionSignature: txSig,
    } : null);

    addLog('chain', `Escrow locked on Devnet. Signature: ${shortenAddress(txSig, 6)}`);

    setHttp402Detail({
      endpoint: `https://${provider.id}.openmesh.net/v1/inference`,
      status: 402,
      priceMicroUsdc: Math.round(job.price * 1_000_000),
      escrowProgramId: '4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz',
      escrowPda: job.escrowPda || '',
      receiptHeader: txSig,
    });

    addLog('agent', `Provider ${provider.name} accepted job. Running inference...`);
    setCurrentJob(prev => prev ? { ...prev, status: 'inference_running' } : null);

    const inferenceResult = await executeInference(provider, job.prompt, job.imageUrl, isChaosTest);

    setCurrentJob(prev => prev ? {
      ...prev,
      status: 'result_received',
      outputResult: inferenceResult.output,
      providerSignature: inferenceResult.providerSignature,
    } : null);

    addLog('agent', `Inference finished in ${inferenceResult.latencyMs}ms`);
    addLog('verify', `Validating Ed25519 payload signature...`);

    setCurrentJob(prev => prev ? { ...prev, status: 'verifying' } : null);
    await new Promise(r => setTimeout(r, 550));

    const verification = await verifyInferenceWork(
      job, 
      provider, 
      inferenceResult.output, 
      inferenceResult.providerSignature, 
      inferenceResult.latencyMs, 
      isChaosTest
    );

    if (!verification.checks.allPassed) {
      const refundSig = generateSolanaSignature();
      addLog('error', `VERIFICATION FAILED: ${verification.failureReason}`);
      addLog('chain', `Executing claim_refund() on Escrow PDA: ${shortenAddress(job.escrowPda || '', 6)}`);
      addLog('chain', `100% of funds refunded to Agent Vault. Signature: ${shortenAddress(refundSig, 6)}`);
      addLog('agent', `Provider reputation docked -5 points.`);

      const failedJob: Job = {
        ...job,
        status: 'refunded',
        verificationStatus: 'FAILED',
        verificationChecks: verification.checks,
        outputResult: inferenceResult.output,
        outputHash: verification.outputHash,
        failureReason: verification.failureReason,
        refundSignature: refundSig,
        completedAt: new Date().toLocaleTimeString(),
      };

      setCurrentJob(failedJob);
      onJobCompleted(failedJob);

      setProviders(prev => prev.map(p => {
        if (p.id === provider.id) {
          return {
            ...p,
            reputation: Math.max(0, p.reputation - 5),
            failedJobs: p.failedJobs + 1,
          };
        }
        return p;
      }));

      setIsProcessing(false);
      return;
    }

    addLog('verify', '✓ Provider signature authenticated');
    addLog('verify', '✓ SHA-256 output hash verified');
    addLog('verify', '✓ Schema valid & latency within SLA');
    addLog('chain', `Executing settle_job() on Solana Devnet...`);
    addLog('chain', `Transferred $${job.price.toFixed(4)} USDC from PDA to Provider wallet`);
    
    const completedJob: Job = {
      ...job,
      status: 'settled',
      verificationStatus: 'PASSED',
      verificationChecks: verification.checks,
      outputResult: inferenceResult.output,
      outputHash: verification.outputHash,
      providerSignature: inferenceResult.providerSignature,
      completedAt: new Date().toLocaleTimeString(),
    };

    setCurrentJob(completedJob);
    onJobCompleted(completedJob);

    setAgentPolicy(prev => ({
      ...prev,
      spentToday: prev.spentToday + job.price,
    }));

    setProviders(prev => prev.map(p => {
      if (p.id === provider.id) {
        return {
          ...p,
          completedJobs: p.completedJobs + 1,
          todayRevenue: p.todayRevenue + job.price,
          reputation: Math.min(100, p.reputation + 0.1),
        };
      }
      return p;
    }));

    addLog('success', `✓ Job complete. $${job.price.toFixed(4)} USDC settled.`);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.75 },
        colors: ['#14F195', '#EDEDED'],
      });
    } catch {
      // safe fallback
    }

    setIsProcessing(false);
  };

  const handleMasterApprove = async () => {
    if (!pendingApprovalJob) return;
    const { job, provider } = pendingApprovalJob;
    setPendingApprovalJob(null);
    addLog('chain', '✓ Master Wallet signature verified.');
    await proceedWithExecution(job, provider, false);
  };

  const handleMasterReject = () => {
    if (!pendingApprovalJob) return;
    addLog('agent', 'Job rejected by human operator.');
    setCurrentJob(prev => prev ? { ...prev, status: 'idle' } : null);
    setPendingApprovalJob(null);
    setIsProcessing(false);
  };

  const isPromptEmpty = prompt.trim().length === 0;

  return (
    <div className="space-y-8">
      
      {/* High-End Frosted Glass Demo Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Scenario 1: Autonomous Vision */}
        <button
          disabled={isProcessing}
          onClick={() => {
            setPrompt('Analyze this high-resolution urban camera feed for obstacle identification.');
            setImageUrl(SAMPLE_IMAGE_URL);
            setTaskType('vision');
            runAutonomousWorkflow('Analyze this high-resolution urban camera feed for obstacle identification.', 'vision', 0.005);
          }}
          className="glass-card-interactive p-7 text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="tag-label">Scenario 01 · Autonomous</span>
              <span className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
            </div>
            
            <div className="flex items-baseline gap-1 my-3">
              <span className="currency-sym">$</span>
              <span className="metric-val text-4xl lg:text-5xl">0.005</span>
              <span className="metric-unit">USDC</span>
            </div>

            <h3 className="font-semibold text-sm text-white tracking-tight">
              Autonomous Vision-Language
            </h3>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              Auto-approved under the $0.10 limit. Zero Phantom popups, instant on-chain escrow lock and settlement.
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.08] mt-4 flex items-center justify-between">
            <span className="pill-ghost text-[11px] py-1.5 px-3.5 group-hover:bg-white group-hover:text-[#0A0B10] transition-all">
              <span>Execute Scenario</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-[10px] font-mono text-[#14F195] bg-[#14F195]/10 px-2 py-0.5 rounded-full border border-[#14F195]/20">
              100% Autonomous
            </span>
          </div>
        </button>

        {/* Scenario 2: Policy Escalation */}
        <button
          disabled={isProcessing}
          onClick={() => {
            const textPrompt = 'Perform deep multi-modal reasoning and synthesis across proprietary architectural data.';
            setPrompt(textPrompt);
            setTaskType('llm');
            runAutonomousWorkflow(textPrompt, 'llm', 0.45);
          }}
          className="glass-card-interactive p-7 text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="tag-label text-amber-300/80">Scenario 02 · Escalation</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
            </div>
            
            <div className="flex items-baseline gap-1 my-3">
              <span className="currency-sym text-amber-400">$</span>
              <span className="metric-val text-amber-400 text-4xl lg:text-5xl">0.450</span>
              <span className="metric-unit text-amber-300/60">USDC</span>
            </div>

            <h3 className="font-semibold text-sm text-white tracking-tight">
              Spending Ceiling Escalation
            </h3>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              Cost exceeds the $0.10 session limit. Pauses execution and requests Master Wallet cryptographic authorization.
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.08] mt-4 flex items-center justify-between">
            <span className="pill-ghost text-[11px] py-1.5 px-3.5 group-hover:bg-amber-400 group-hover:text-black transition-all">
              <span>Trigger Escalation</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Human In The Loop
            </span>
          </div>
        </button>

        {/* Scenario 3: Chaos Monkey Slashing */}
        <button
          disabled={isProcessing}
          onClick={() => {
            const textPrompt = 'Test edge inference on untrusted rogue GPU node.';
            setPrompt(textPrompt);
            setTaskType('vision');
            runAutonomousWorkflow(textPrompt, 'vision', 0.001, true);
          }}
          className="glass-card-interactive p-7 text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="tag-label text-rose-300/80">Scenario 03 · Adversarial</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#F43F5E]" />
            </div>
            
            <div className="flex items-baseline gap-1 my-3">
              <span className="metric-val text-rose-400 text-3xl lg:text-4xl">REFUND</span>
              <span className="metric-unit text-rose-300/60">/ 100%</span>
            </div>

            <h3 className="font-semibold text-sm text-white tracking-tight">
              Chaos Slashing & Anti-Fraud
            </h3>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              Rogue node submits corrupted digest. Escrow cancels payout, triggers 100% refund, and slashes node stake.
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.08] mt-4 flex items-center justify-between">
            <span className="pill-ghost text-[11px] py-1.5 px-3.5 group-hover:bg-rose-500 group-hover:text-white transition-all">
              <span>Test Anti-Fraud</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              Stake Slashed
            </span>
          </div>
        </button>
      </div>

      {/* Main Console Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (5 cols): Task Dispatch Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 text-left space-y-5">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="tag-label">Task Dispatch Control</span>
                <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                  Autonomous Inference Dispatch
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.12]">
                Agent: Primary-01
              </span>
            </div>

            {/* Prompt input with Validation States */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white/90">
                  Instruction / Prompt
                </label>
                {!isPromptEmpty && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Valid</span>
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Enter prompt instruction for autonomous compute node..."
                className={`glass-input w-full rounded-2xl p-4 text-xs text-white placeholder-white/30 font-sans resize-none transition-all ${
                  isPromptEmpty ? 'glass-input-error' : 'glass-input-success'
                }`}
              />
              {isPromptEmpty && (
                <div className="flex items-center gap-1.5 text-xs text-[#FF758F] mt-2 font-medium animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Prompt is required. Enter instructions to dispatch task.</span>
                </div>
              )}
            </div>

            {/* Media input attachment */}
            <div>
              <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-white/50" />
                  <span>Media Context</span>
                </span>
                <button
                  type="button"
                  onClick={() => setImageUrl(imageUrl ? undefined : SAMPLE_IMAGE_URL)}
                  className="text-[11px] font-medium text-[#14F195] hover:underline cursor-pointer"
                >
                  {imageUrl ? 'Remove image' : 'Attach sample image'}
                </button>
              </div>

              {imageUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.12] h-32 shadow-inner">
                  <img
                    src={imageUrl}
                    alt="Target scene"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10">
                    City-Street-4K.jpg
                  </div>
                </div>
              )}
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] text-white/60 mb-1.5 font-mono">Capability</label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value as any)}
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs text-white font-mono cursor-pointer"
                >
                  <option value="vision" className="bg-[#0A0B10]">Vision-Language</option>
                  <option value="llm" className="bg-[#0A0B10]">Deep Reasoning</option>
                  <option value="code" className="bg-[#0A0B10]">Coding Analysis</option>
                  <option value="audio" className="bg-[#0A0B10]">Audio / Whisper</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1.5 font-mono">Routing Priority</label>
                <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.10] text-[11px]">
                  {(['latency', 'balanced', 'price'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg capitalize font-mono text-[10px] transition-all cursor-pointer ${
                        priority === p ? 'bg-white text-[#0A0B10] font-bold shadow-sm' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Launch CTA */}
            <button
              disabled={isProcessing || isPromptEmpty}
              onClick={() => runAutonomousWorkflow()}
              className="pill-cta w-full py-4 text-sm font-semibold rounded-full mt-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A0B10] border-t-transparent rounded-full animate-spin" />
                  <span>Clearing Micro-Escrow on Solana...</span>
                </>
              ) : (
                <span>Dispatch Autonomous Job</span>
              )}
            </button>
          </div>

          {/* Decision Scoring Summary */}
          {scoredDecision && (
            <div className="glass-card p-6 text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">Optimal Provider Selected</span>
                <span className="text-[#14F195] font-bold px-2 py-0.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/20">
                  Score: {scoredDecision.selected.totalScore}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {scoredDecision.selected.provider.name}
                </span>
                <span className="text-xs font-mono text-white/80 font-medium">
                  ${scoredDecision.selected.provider.pricePerRequest.toFixed(4)} USDC
                </span>
              </div>
              <div className="hairline-divider my-2" />
              <p className="text-[11px] text-white/70 leading-relaxed font-mono">
                {scoredDecision.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): State Machine & Output */}
        <div className="lg:col-span-7 space-y-6">
          
          <EscrowStateMachine
            status={currentJob ? currentJob.status : 'idle'}
            escrowPda={currentJob?.escrowPda}
            txSignature={currentJob?.transactionSignature}
            isRefunded={currentJob?.status === 'refunded'}
          />

          {/* Results Card */}
          {currentJob && currentJob.outputResult && (
            <div className="glass-card p-8 text-left space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    currentJob.status === 'settled' 
                      ? 'bg-[#14F195] shadow-[0_0_10px_#14F195]' 
                      : 'bg-rose-400 shadow-[0_0_10px_#F43F5E]'
                  }`} />
                  <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                    {currentJob.status === 'settled' ? 'Verified Inference Receipt' : 'Cryptographic Verification Exception'}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-3 py-1 rounded-full border uppercase font-bold tracking-wide ${
                  currentJob.status === 'settled'
                    ? 'bg-[#14F195]/15 text-[#14F195] border-[#14F195]/30 shadow-[0_0_12px_rgba(20,241,149,0.2)]'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                }`}>
                  {currentJob.status === 'settled' ? 'Settled on Solana' : 'Auto-Refunded (100%)'}
                </span>
              </div>

              {/* Output text */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.10] text-xs font-mono text-white/90 whitespace-pre-wrap leading-relaxed shadow-inner">
                {currentJob.outputResult}
              </div>

              {/* Verification checks */}
              {currentJob.verificationChecks && (
                <div className="bg-white/[0.03] border border-white/[0.10] rounded-2xl p-4 text-[11px] font-mono">
                  <button
                    onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                    className="w-full flex items-center justify-between text-white/70 hover:text-white cursor-pointer transition-colors mb-2"
                  >
                    <span className="flex items-center gap-2 text-white font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#14F195]" />
                      <span>6-Point Cryptographic Invariant Gates</span>
                    </span>
                    {showVerificationDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showVerificationDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.06] text-white/80">
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${currentJob.verificationChecks.providerAuthenticated ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Ed25519 Provider Signature</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${currentJob.verificationChecks.jobIdMatched ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Anchor Escrow PDA Match</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${currentJob.verificationChecks.outputReceived ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Non-Empty Payload Verified</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${currentJob.verificationChecks.schemaValid ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>RFC-402 JSON Schema Match</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${currentJob.verificationChecks.latencyWithinSla ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Latency SLA Bound Satisfied</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${currentJob.verificationChecks.sha256HashValid ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>SHA-256 Digest Invariant</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Solana Explorer link */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono pt-1 text-white/60">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.10]">
                  PDA: <span className="text-white font-medium">{shortenAddress(currentJob.escrowPda || '', 4)}</span>
                </span>
                {currentJob.transactionSignature && (
                  <a
                    href={getSolanaExplorerUrl(currentJob.transactionSignature, 'tx')}
                    target="_blank"
                    rel="noreferrer"
                    className="pill-ghost text-xs py-1.5 px-3.5 flex items-center gap-1.5 hover:bg-white hover:text-black transition-all"
                  >
                    <span>View on Solana Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Activity Terminal */}
          <AgentActivityTerminal
            logs={logs}
            http402Detail={http402Detail}
            onClearLogs={() => setLogs([])}
          />

        </div>

      </div>

      {/* Master Approval Modal */}
      {pendingApprovalJob && (
        <MasterApprovalModal
          isOpen={true}
          jobCost={pendingApprovalJob.cost}
          autoLimit={agentPolicy.autoApprovalLimit}
          provider={pendingApprovalJob.provider}
          taskTitle={pendingApprovalJob.job.prompt}
          onApprove={handleMasterApprove}
          onReject={handleMasterReject}
        />
      )}

    </div>
  );
};
