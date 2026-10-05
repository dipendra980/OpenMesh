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
    <div className="linear-card rounded-xl p-4 w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
          <span className="text-xs font-mono font-medium tracking-tight text-white uppercase">
            Escrow State Machine
          </span>
        </div>

        <div className="text-[11px] font-mono">
          {status === 'settled' ? (
            <span className="text-[#14F195] font-medium flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Escrow Settled
            </span>
          ) : isRefunded || status === 'refunded' ? (
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Auto-Refunded
            </span>
          ) : status === 'awaiting_approval' ? (
            <span className="text-amber-400 font-medium">
              Waiting for Master Signature
            </span>
          ) : currentIndex >= 0 ? (
            <span className="text-slate-300 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-[#14F195] animate-spin" />
              <span>Step {currentIndex + 1} of 7</span>
            </span>
          ) : (
            <span className="text-slate-500">Standby</span>
          )}
        </div>
      </div>

      {/* Horizontal Steps Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STEPS.map((step, idx) => {
          const isPassed = currentIndex > idx || (status === 'settled' && idx === 6);
          const isCurrent = currentIndex === idx && status !== 'settled';
          const isFailed = (isRefunded || status === 'refunded') && idx === 6;

          let stepBg = 'bg-[#0A0B10] border-white/[0.04] text-slate-500';
          let indicatorBg = 'border-white/10 text-slate-600 bg-white/[0.02]';

          if (isPassed) {
            stepBg = 'bg-[#14F195]/[0.03] border-[#14F195]/20 text-slate-200';
            indicatorBg = 'bg-[#14F195]/20 border-[#14F195]/40 text-[#14F195]';
          } else if (isCurrent) {
            stepBg = 'bg-white/[0.04] border-white/20 text-white';
            indicatorBg = 'bg-white border-white text-black';
          } else if (isFailed) {
            stepBg = 'bg-rose-500/[0.04] border-rose-500/20 text-rose-300';
            indicatorBg = 'bg-rose-500/20 border-rose-500/40 text-rose-400';
          }

          return (
            <div
              key={step.key}
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-colors ${stepBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${indicatorBg}`}>
                  {isPassed ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-black" />
                  ) : isFailed ? (
                    <RotateCcw className="w-2.5 h-2.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-600">
                  0{idx + 1}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-medium tracking-tight text-slate-200 leading-tight">
                  {step.title}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
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
