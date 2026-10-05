import React, { useState } from 'react';
import { 
  CheckCircle2, 
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

  return (
    <div className="space-y-5">
      
      {/* Sleek One-Click Demo Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <button
          disabled={isProcessing}
          onClick={() => {
            setPrompt('Analyze this image and identify the objects, scene, and important details.');
            setImageUrl(SAMPLE_IMAGE_URL);
            setTaskType('vision');
            runAutonomousWorkflow('Analyze this image and identify the objects, scene, and important details.', 'vision', 0.005);
          }}
          className="linear-card-interactive rounded-xl p-3.5 text-left flex items-start justify-between gap-3 group"
        >
          <div>
            <div className="flex items-center gap-1.5 font-medium text-xs text-white">
              <span>Autonomous Vision</span>
              <span className="text-[10px] font-mono text-[#14F195] bg-[#14F195]/10 px-1.5 py-0.2 rounded border border-[#14F195]/20">
                $0.005
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Auto-approved under $0.10 limit. Locks escrow, executes & settles.
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors mt-0.5 flex-shrink-0" />
        </button>

        <button
          disabled={isProcessing}
          onClick={() => {
            const textPrompt = 'Perform deep multi-modal reasoning and synthesis across architectural data.';
            setPrompt(textPrompt);
            setTaskType('llm');
            runAutonomousWorkflow(textPrompt, 'llm', 0.45);
          }}
          className="linear-card-interactive rounded-xl p-3.5 text-left flex items-start justify-between gap-3 group"
        >
          <div>
            <div className="flex items-center gap-1.5 font-medium text-xs text-white">
              <span>Policy Escalation</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                $0.450
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Exceeds ceiling. Pauses for human Master Wallet authorization.
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors mt-0.5 flex-shrink-0" />
        </button>

        <button
          disabled={isProcessing}
          onClick={() => {
            const textPrompt = 'Test edge inference on untrusted rogue GPU node.';
            setPrompt(textPrompt);
            setTaskType('vision');
            runAutonomousWorkflow(textPrompt, 'vision', 0.001, true);
          }}
          className="linear-card-interactive rounded-xl p-3.5 text-left flex items-start justify-between gap-3 group"
        >
          <div>
            <div className="flex items-center gap-1.5 font-medium text-xs text-white">
              <span>Chaos Slashing Test</span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                Auto-Refund
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Rogue node fails check. Escrow halts payment & slashes reputation.
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors mt-0.5 flex-shrink-0" />
        </button>
      </div>

      {/* Main Console Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (5 cols): Task Dispatch */}
        <div className="lg:col-span-5 space-y-4">
          <div className="linear-card rounded-xl p-5 text-left space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-medium text-white uppercase tracking-tight">
                Task Dispatch
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Agent: Research-01
              </span>
            </div>

            {/* Prompt input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Instruction / Prompt
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="linear-input w-full rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 font-sans resize-none"
              />
            </div>

            {/* Media preview */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Media Input</span>
                </span>
                <button
                  type="button"
                  onClick={() => setImageUrl(imageUrl ? undefined : SAMPLE_IMAGE_URL)}
                  className="text-[11px] text-[#14F195] hover:underline"
                >
                  {imageUrl ? 'Remove image' : 'Attach sample image'}
                </button>
              </div>

              {imageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-white/[0.08] h-28">
                  <img
                    src={imageUrl}
                    alt="Target scene"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
                    City-Street-4K.jpg
                  </div>
                </div>
              )}
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">Capability</label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value as any)}
                  className="linear-input w-full rounded-md px-2 py-1.5 text-xs text-white font-mono"
                >
                  <option value="vision">Vision-Language</option>
                  <option value="llm">Deep Reasoning</option>
                  <option value="code">Coding Analysis</option>
                  <option value="audio">Audio / Whisper</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">Priority</label>
                <div className="flex bg-[#0A0B10] p-0.5 rounded-md border border-white/[0.08] text-[11px]">
                  {(['latency', 'balanced', 'price'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1 rounded capitalize font-mono text-[10px] transition-colors ${
                        priority === p ? 'bg-white/10 text-white font-medium' : 'text-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              disabled={isProcessing}
              onClick={() => runAutonomousWorkflow()}
              className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Executing M2M Escrow...</span>
                </>
              ) : (
                <span>Dispatch Autonomous Job</span>
              )}
            </button>
          </div>

          {/* Decision Summary */}
          {scoredDecision && (
            <div className="linear-card rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Selected Provider</span>
                <span className="text-[#14F195] font-semibold">{scoredDecision.selected.totalScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {scoredDecision.selected.provider.name}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  ${scoredDecision.selected.provider.pricePerRequest.toFixed(4)} USDC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono pt-1 border-t border-white/[0.04]">
                {scoredDecision.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): State Machine & Output */}
        <div className="lg:col-span-7 space-y-4">
          
          <EscrowStateMachine
            status={currentJob ? currentJob.status : 'idle'}
            escrowPda={currentJob?.escrowPda}
            txSignature={currentJob?.transactionSignature}
            isRefunded={currentJob?.status === 'refunded'}
          />

          {/* Results Card */}
          {currentJob && currentJob.outputResult && (
            <div className="linear-card rounded-xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${currentJob.status === 'settled' ? 'bg-[#14F195]' : 'bg-rose-400'}`} />
                  <span className="text-xs font-mono font-medium text-white uppercase">
                    {currentJob.status === 'settled' ? 'Verified Inference Result' : 'Verification Exception'}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
                  currentJob.status === 'settled'
                    ? 'bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {currentJob.status === 'settled' ? 'Settled' : 'Refunded'}
                </span>
              </div>

              {/* Output text */}
              <div className="p-3 rounded-lg bg-[#0A0B10] border border-white/[0.06] text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {currentJob.outputResult}
              </div>

              {/* Verification checks */}
              {currentJob.verificationChecks && (
                <div className="bg-[#0A0B10] border border-white/[0.04] rounded-lg p-2.5 text-[11px] font-mono">
                  <button
                    onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                    className="w-full flex items-center justify-between text-slate-400 mb-1.5"
                  >
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#14F195]" />
                      <span>Cryptographic Invariants</span>
                    </span>
                    {showVerificationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showVerificationDetails && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${currentJob.verificationChecks.providerAuthenticated ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Provider Authenticated</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${currentJob.verificationChecks.jobIdMatched ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Job ID & PDA Matched</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${currentJob.verificationChecks.outputReceived ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Non-Empty Payload</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${currentJob.verificationChecks.schemaValid ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Schema Validation</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${currentJob.verificationChecks.latencyWithinSla ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>Latency SLA Met</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${currentJob.verificationChecks.sha256HashValid ? 'text-[#14F195]' : 'text-rose-400'}`} />
                        <span>SHA-256 Digest Match</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Solana Explorer link */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400">
                <span>PDA: {shortenAddress(currentJob.escrowPda || '', 4)}</span>
                {currentJob.transactionSignature && (
                  <a
                    href={getSolanaExplorerUrl(currentJob.transactionSignature, 'tx')}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#14F195] hover:underline"
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
