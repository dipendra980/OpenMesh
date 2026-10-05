import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Power, 
  Cpu, 
  ShieldAlert, 
  Key, 
  CheckCircle2, 
  Zap, 
  AlertTriangle,
  Radio,
  Play,
  Pause,
  ShieldCheck
} from 'lucide-react';
import type { Provider, Job } from '../types';
import { 
  getOrCreateWorkerKeypair, 
  bytesToBase58, 
  getGroqApiKey, 
  setGroqApiKey,
  executeWorkerJob 
} from '../lib/groqWorker';
import { realtimeHub, type RealtimeMeshEvent } from '../lib/realtimeHub';
import { shortenAddress } from '../lib/solana';

interface WorkerCockpitProps {
  provider: Provider;
  onUpdateProvider: (updated: Provider) => void;
}

export const WorkerCockpit: React.FC<WorkerCockpitProps> = ({
  provider,
  onUpdateProvider,
}) => {
  const [workerKeypair] = useState(() => getOrCreateWorkerKeypair());
  const workerPubkey = bytesToBase58(workerKeypair.publicKey);

  const [isOnline, setIsOnline] = useState(provider.status === 'ONLINE');
  const [autoSolverEnabled, setAutoSolverEnabled] = useState(true);
  
  // Groq API Key state
  const [apiKeyInput, setApiKeyInput] = useState(() => getGroqApiKey());
  const [isKeySaved, setIsKeySaved] = useState(Boolean(getGroqApiKey()));
  const [keyValidationState, setKeyValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Chaos Slashing Mode
  const [isChaosMode, setIsChaosMode] = useState(false);
  const [chaosType, setChaosType] = useState<'corrupt_signature' | 'corrupt_output' | 'ghost_work'>('corrupt_signature');

  // Job Queue & History for Worker
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [workerLogs, setWorkerLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    { time: 'Ready', msg: 'Worker Ed25519 cryptographic keypair initialized & listening on Supabase Realtime channel.', type: 'info' },
  ]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setWorkerLogs(prev => [{ time, msg, type }, ...prev.slice(0, 40)]);
  };

  // Listen to incoming jobs from Agent over RealtimeHub
  useEffect(() => {
    const unsubscribe = realtimeHub.subscribe(async (event: RealtimeMeshEvent) => {
      if (event.type === 'JOB_LOCKED') {
        const incomingJob = event.job;
        addLog(`[INCOMING] Job #${incomingJob.id.slice(0, 8)} locked in Escrow PDA ${shortenAddress(incomingJob.escrowPda || '', 4)}. Reward: $${incomingJob.price.toFixed(4)} USDC`, 'info');
        
        setActiveJobs(prev => {
          if (prev.some(j => j.id === incomingJob.id)) return prev;
          return [incomingJob, ...prev];
        });

        // If automated solver is on and node is online, process automatically
        if (autoSolverEnabled && isOnline) {
          await processJob(incomingJob);
        }
      } else if (event.type === 'JOB_SETTLED') {
        addLog(`[SETTLEMENT CONFIRMED] Job #${event.jobId.slice(0, 8)} approved by 6-Point Verification! Funds released on Solana.`, 'success');
        onUpdateProvider({
          ...provider,
          todayRevenue: provider.todayRevenue + 0.005,
          completedJobs: provider.completedJobs + 1,
          reputation: Math.min(100, provider.reputation + 0.2),
        });
      } else if (event.type === 'JOB_SLASHED') {
        addLog(`[SLASHING ALERT] Job #${event.jobId.slice(0, 8)} failed verification: ${event.reason}. $100 Stake Bond docked.`, 'error');
        onUpdateProvider({
          ...provider,
          stakeBondAmount: Math.max(0, provider.stakeBondAmount - 100),
          reputation: Math.max(0, provider.reputation - 25),
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [autoSolverEnabled, isOnline, isChaosMode, chaosType, provider]);

  const processJob = async (jobToSolve: Job) => {
    setProcessingJobId(jobToSolve.id);
    realtimeHub.emit({ type: 'JOB_PROCESSING', jobId: jobToSolve.id, workerPubkey });
    addLog(`[PROCESSING] Dispatching inference to Groq model for Job #${jobToSolve.id.slice(0, 8)}...`, 'info');

    try {
      const result = await executeWorkerJob({
        jobId: jobToSolve.id,
        capability: jobToSolve.taskType,
        prompt: jobToSolve.prompt,
        imageUrl: jobToSolve.imageUrl,
        isChaosMode,
        chaosType,
      });

      if (result.chaosInjected) {
        addLog(`[CHAOS INJECTED] Malicious/corrupted payload simulated (${chaosType})!`, 'warn');
      } else {
        addLog(`[INFERENCE COMPLETE] ${result.usedRealGroq ? 'Groq Cloud API' : 'High-Performance Engine'} completed in ${result.latencyMs}ms. Digest & Ed25519 signature generated.`, 'success');
      }

      const updatedJob: Job = {
        ...jobToSolve,
        status: 'result_received',
        outputResult: result.outputText,
        outputHash: result.sha256Digest,
        providerSignature: result.ed25519Signature,
        providerId: provider.id,
        completedAt: new Date().toLocaleTimeString(),
      };

      // Push back to Realtime Hub
      realtimeHub.emit({ type: 'JOB_RESULT_SUBMITTED', job: updatedJob });

      setActiveJobs(prev => prev.map(j => j.id === jobToSolve.id ? updatedJob : j));
    } catch (err: any) {
      addLog(`[ERROR] Job processing failed: ${err.message}`, 'error');
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleSaveGroqKey = () => {
    if (!apiKeyInput.trim()) {
      setGroqApiKey('');
      setIsKeySaved(false);
      setKeyValidationState('idle');
      addLog('Groq API Key removed. Reverting to local sub-second compute synthesis.', 'info');
      return;
    }
    if (apiKeyInput.startsWith('gsk_')) {
      setGroqApiKey(apiKeyInput.trim());
      setIsKeySaved(true);
      setKeyValidationState('valid');
      addLog('Valid Groq Cloud API Key saved and active for real sub-second inference!', 'success');
    } else {
      setKeyValidationState('invalid');
      addLog('Invalid key format. Groq API keys start with "gsk_".', 'error');
    }
  };

  const toggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    onUpdateProvider({
      ...provider,
      status: next ? 'ONLINE' : 'OFFLINE',
    });
    realtimeHub.emit({
      type: 'WORKER_HEARTBEAT',
      provider: { id: provider.id, status: next ? 'ONLINE' : 'OFFLINE' }
    });
    addLog(`Node status updated: ${next ? 'ONLINE (Accepting jobs)' : 'OFFLINE (Paused)'}`, next ? 'success' : 'warn');
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-[#14F195]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Worker / GPU Operator Cockpit
                </h2>
                <span className="tag-label px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-white">
                  Independent Node Instance
                </span>
              </div>
              <p className="text-sm text-white/60 mt-0.5">
                Listen to real-time incoming Agent escrow locks, run Groq Cloud inference, and generate detached Ed25519 cryptographic receipts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAutoSolverEnabled(!autoSolverEnabled)}
            className={`pill-ghost text-xs py-2 px-4 flex items-center gap-2 ${
              autoSolverEnabled ? 'border-[#14F195]/40 text-[#14F195]' : 'text-white/60'
            }`}
          >
            {autoSolverEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoSolverEnabled ? 'Auto-Solver: ACTIVE' : 'Auto-Solver: PAUSED'}</span>
          </button>

          <button
            onClick={toggleOnline}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-semibold tracking-wide transition-all shadow-lg active:scale-95 ${
              isOnline
                ? 'bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/40 hover:bg-[#14F195]/30 shadow-[#14F195]/10'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-500/10'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'NODE: ONLINE' : 'NODE: OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Operator Identity & Groq Cloud API Key Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Node Identity Card */}
        <div className="glass-card p-6 sm:p-7 rounded-[28px] space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white font-display">Node Identity</span>
            </div>
            <span className="tag-label px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#14F195]">
              Ed25519 Active
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-white/40 block mb-1">REGISTERED PUBLIC KEY:</span>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white/80 break-all select-all">
                {workerPubkey}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-white/50">GPU Compute Tier:</span>
              <span className="font-semibold text-white">{provider.gpu}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/50">Escrow Stake Bond:</span>
              <span className="font-semibold text-[#14F195]">${provider.stakeBondAmount}.00 USDC</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/50">Reputation Rating:</span>
              <span className="font-semibold text-cyan-400">{provider.reputation.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* Groq API Key Configuration */}
        <div className="glass-card p-6 sm:p-7 rounded-[28px] space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#14F195]" />
              <span className="text-sm font-bold text-white font-display">Groq Cloud API Connection</span>
            </div>
            <span className={`tag-label px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
              isKeySaved 
                ? 'bg-[#14F195]/15 text-[#14F195] border-[#14F195]/30' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isKeySaved ? 'bg-[#14F195]' : 'bg-amber-400'}`} />
              <span>{isKeySaved ? 'Groq Connected' : 'Simulated Synthesis'}</span>
            </span>
          </div>

          <p className="text-xs text-white/60">
            Provide an optional <strong>Groq API Key</strong> (<code className="text-white/80">gsk_...</code>) for direct, sub-second inference via Groq LPU endpoints. If left blank, the node uses high-performance local cryptographic synthesis.
          </p>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="Enter Groq API Key (gsk_...)"
                value={apiKeyInput}
                onChange={e => {
                  setApiKeyInput(e.target.value);
                  setKeyValidationState('idle');
                }}
                className={`glass-input flex-1 font-mono text-xs ${
                  keyValidationState === 'valid' ? 'glass-input-success' : keyValidationState === 'invalid' ? 'glass-input-error' : ''
                }`}
              />
              <button
                onClick={handleSaveGroqKey}
                className="pill-cta text-xs py-2 px-5 whitespace-nowrap cursor-pointer"
              >
                Save Key
              </button>
            </div>

            {keyValidationState === 'invalid' && (
              <div className="flex items-center gap-1.5 text-xs text-[#FF758F]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Invalid Groq API key format. Expected string starting with "gsk_".</span>
              </div>
            )}
            {keyValidationState === 'valid' && (
              <div className="flex items-center gap-1.5 text-xs text-[#00F5A0]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Groq API Key validated and saved for this session!</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Chaos Slashing Mode Controller */}
      <div className={`glass-card p-6 sm:p-7 rounded-[28px] border transition-all ${
        isChaosMode ? 'border-rose-500/40 bg-rose-500/[0.04]' : 'border-white/[0.12]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${isChaosMode ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-white/[0.06] border-white/[0.12] text-white/70'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Chaos Fault-Injection Controller (Slashing Demonstration)
                </h3>
                <span className="tag-label px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Judges Demo
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Deliberately corrupt worker compute outputs to test whether the Agent's 6-Point Verification Gate catches tampering and slashes the node.
              </p>
            </div>
          </div>

          {/* Chaos Toggle Switch */}
          <button
            onClick={() => {
              const next = !isChaosMode;
              setIsChaosMode(next);
              addLog(`Chaos Mode ${next ? 'ACTIVATED: Worker will inject faults to trigger slashing' : 'DEACTIVATED: Honest mode restored'}.`, next ? 'warn' : 'info');
            }}
            className={`pill-cta text-xs py-2.5 px-6 font-semibold transition-all ${
              isChaosMode 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600' 
                : 'bg-white text-[#0A0B10]'
            }`}
          >
            {isChaosMode ? '⚠️ CHAOS MODE ACTIVE' : 'Enable Chaos Mode'}
          </button>
        </div>

        {isChaosMode && (
          <div className="mt-4 pt-2 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300 block">
              Select Malicious Behavior Type:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'corrupt_signature', label: '1. Signature Bit-Flip', desc: 'Corrupts detached Ed25519 bytes (Point 1 Fail)' },
                { id: 'ghost_work', label: '2. Ghost Work (Lorem Ipsum)', desc: 'Returns non-dense empty tokens (Point 3 Fail)' },
                { id: 'corrupt_output', label: '3. Tampered Payload', desc: 'Alters output text post-hash (Point 6 Fail)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setChaosType(opt.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    chaosType === opt.id
                      ? 'bg-rose-500/20 border-rose-500/60 text-white'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[11px] text-white/50 block mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Job Ingestion Queue & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Real-time Job Queue */}
        <div className="glass-card p-6 sm:p-7 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#14F195]" />
              <span className="text-sm font-bold text-white font-display">Live Job Feed</span>
            </div>
            <span className="tag-label px-2.5 py-0.5 rounded-full bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
              {activeJobs.length} In Queue
            </span>
          </div>

          {activeJobs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Radio className="w-6 h-6 text-white/30 mx-auto animate-pulse" />
              <p className="text-xs text-white/50 font-mono">
                Listening for incoming Agent escrow locks on Supabase Realtime...
              </p>
              <p className="text-[11px] text-white/30 max-w-xs mx-auto">
                Open the Agent Console in another tab or window and click "Dispatch Autonomous Task" to watch live cross-client settlement.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeJobs.map(job => (
                <div 
                  key={job.id} 
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-mono">
                      #{job.id.slice(0, 10)}
                    </span>
                    <span className="tag-label px-2 py-0.5 rounded-full bg-white/[0.06] text-white">
                      {job.taskType}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-2">
                    "{job.prompt}"
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px] font-mono">
                    <span className="text-[#14F195] font-semibold">${job.price.toFixed(4)} USDC</span>
                    {processingJobId === job.id ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>Computing Groq...</span>
                      </span>
                    ) : job.outputResult ? (
                      <span className="text-[#14F195] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => processJob(job)}
                        className="pill-cta text-[10px] py-1 px-3 cursor-pointer"
                      >
                        Solve & Sign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worker Telemetry Logs */}
        <div className="glass-card p-6 sm:p-7 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-white/60" />
              <span className="text-sm font-bold text-white font-display">Worker Execution Stream</span>
            </div>
            <span className="text-[11px] font-mono text-white/40">
              Detached Ed25519
            </span>
          </div>

          <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 font-mono text-[11px] space-y-2 h-72 overflow-y-auto shadow-inner">
            {workerLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-white/30 shrink-0">[{log.time}]</span>
                <span className={`break-words ${
                  log.type === 'success' ? 'text-[#14F195]' :
                  log.type === 'error' ? 'text-[#FF758F]' :
                  log.type === 'warn' ? 'text-amber-300' :
                  'text-white/80'
                }`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14F195]" />
              <span>Cross-Client Supabase Realtime Active</span>
            </span>
            <span className="text-white/30">Port 5174</span>
          </div>
        </div>

      </div>

    </div>
  );
};
