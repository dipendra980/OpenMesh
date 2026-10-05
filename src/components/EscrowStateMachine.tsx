import React from 'react';
import { 
  Check, 
  Loader2, 
  RotateCcw
} from 'lucide-react';
import type { JobStatus } from '../types';

interface EscrowStateMachineProps {
  status: JobStatus;
  escrowPda?: string;
  txSignature?: string;
  isRefunded?: boolean;
}

const STEPS = [
  { key: 'created', title: 'Job Created', subtitle: 'SHA-256 Digest' },
  { key: 'provider_selected', title: 'Provider Match', subtitle: 'Score Engine' },
  { key: 'escrow_locked', title: 'Lock Escrow', subtitle: 'Solana PDA' },
  { key: 'inference_running', title: 'Inference', subtitle: 'M2M Execution' },
  { key: 'result_received', title: 'Response', subtitle: 'Signed Payload' },
  { key: 'verifying', title: 'Verification', subtitle: '6-Pt Audit' },
  { key: 'settled', title: 'Settlement', subtitle: 'Funds Cleared' },
];

export const EscrowStateMachine: React.FC<EscrowStateMachineProps> = ({
  status,
  isRefunded = false,
}) => {
  const getStepIndex = (s: JobStatus): number => {
    switch (s) {
      case 'created':
      case 'discovering':
        return 0;
      case 'provider_selected':
      case 'awaiting_approval':
        return 1;
      case 'escrow_locked':
        return 2;
      case 'inference_running':
        return 3;
      case 'result_received':
        return 4;
      case 'verifying':
        return 5;
      case 'settled':
        return 6;
      case 'refunded':
      case 'disputed':
        return 5;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="glass-card p-8 rounded-[28px] w-full text-left space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
            <span className="tag-label">Autonomous State Protocol</span>
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
            Solana On-Chain Micro-Escrow Pipeline
          </h3>
        </div>

        <div>
          {status === 'settled' ? (
            <span className="pill-chip bg-[#14F195]/15 border-[#14F195]/30 text-[#14F195] font-semibold shadow-[0_0_12px_rgba(20,241,149,0.2)]">
              <Check className="w-3 h-3 stroke-[3]" /> Escrow Settled
            </span>
          ) : isRefunded || status === 'refunded' ? (
            <span className="pill-chip bg-rose-500/15 border-rose-500/30 text-rose-400 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.2)]">
              <RotateCcw className="w-3 h-3" /> Auto-Refunded (100%)
            </span>
          ) : status === 'awaiting_approval' ? (
            <span className="pill-chip bg-amber-500/15 border-amber-500/30 text-amber-400 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              Waiting for Master Signature
            </span>
          ) : currentIndex >= 0 ? (
            <span className="pill-chip bg-white/[0.08] border-white/20 text-white font-medium">
              <Loader2 className="w-3 h-3 text-[#14F195] animate-spin" />
              <span>Step {currentIndex + 1} of 7</span>
            </span>
          ) : (
            <span className="pill-chip bg-white/[0.04] text-white/50 border-white/[0.08]">
              Standby / Idle
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Steps Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STEPS.map((step, idx) => {
          const isPassed = currentIndex > idx || (status === 'settled' && idx === 6);
          const isCurrent = currentIndex === idx && status !== 'settled';
          const isFailed = (isRefunded || status === 'refunded') && idx === 6;

          let stepBg = 'bg-white/[0.02] border-white/[0.08] text-white/50';
          let indicatorBg = 'border-white/10 text-white/40 bg-white/[0.04]';

          if (isPassed) {
            stepBg = 'bg-[#14F195]/[0.06] border-[#14F195]/30 text-white shadow-[0_0_16px_rgba(20,241,149,0.08)]';
            indicatorBg = 'bg-[#14F195] border-[#14F195] text-black shadow-[0_0_10px_#14F195]';
          } else if (isCurrent) {
            stepBg = 'bg-white/[0.08] border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)] scale-[1.02]';
            indicatorBg = 'bg-white border-white text-black shadow-[0_0_10px_#FFF]';
          } else if (isFailed) {
            stepBg = 'bg-rose-500/[0.08] border-rose-500/30 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.1)]';
            indicatorBg = 'bg-rose-500 border-rose-500 text-white shadow-[0_0_10px_#F43F5E]';
          }

          return (
            <div
              key={step.key}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all backdrop-blur-md ${stepBg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${indicatorBg}`}>
                  {isPassed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3 h-3 animate-spin text-black" />
                  ) : isFailed ? (
                    <RotateCcw className="w-3 h-3" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-white/40">
                  0{idx + 1}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold tracking-tight text-white leading-tight">
                  {step.title}
                </div>
                <div className="text-[10px] font-mono text-white/50 mt-1 truncate">
                  {step.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
