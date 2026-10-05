import React from 'react';
import { AlertCircle, Check, X, ExternalLink, ArrowRight } from 'lucide-react';
import type { Provider } from '../types';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';

interface MasterApprovalModalProps {
  isOpen: boolean;
  jobCost: number;
  autoLimit: number;
  provider: Provider;
  taskTitle: string;
  onApprove: () => void;
  onReject: () => void;
}

export const MasterApprovalModal: React.FC<MasterApprovalModalProps> = ({
  isOpen,
  jobCost,
  autoLimit,
  provider,
  taskTitle,
  onApprove,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="linear-card w-full max-w-md rounded-xl p-5 text-left relative shadow-2xl space-y-4">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Approval Required
            </span>
          </div>
          <h3 className="text-base font-semibold text-white">
            Autonomous Policy Threshold Exceeded
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            This job exceeds the configured auto-approval limit and requires your signature.
          </p>
        </div>

        {/* Task description preview */}
        <div className="p-2.5 rounded-lg bg-[#0A0B10] border border-white/[0.04] text-[11px] text-slate-300 font-mono truncate">
          <span className="text-slate-500 mr-1.5">TASK:</span>
          <span>{taskTitle}</span>
        </div>

        {/* Cost Comparison */}
        <div className="bg-[#0A0B10] border border-white/[0.06] rounded-lg p-3 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ESTIMATED COST:</span>
            <span className="text-base font-bold text-amber-400">
              ${jobCost.toFixed(4)} USDC
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 border-t border-white/[0.04] pt-1.5">
            <span>AUTO CEILING:</span>
            <span className="text-slate-300 font-medium">${autoLimit.toFixed(2)} USDC</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 border-t border-white/[0.04] pt-1.5">
            <span>TARGET NODE:</span>
            <span className="text-white font-medium">{provider.name}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 border-t border-white/[0.04] pt-1.5">
            <span>WALLET:</span>
            <a
              href={getSolanaExplorerUrl(provider.walletAddress, 'address')}
              target="_blank"
              rel="noreferrer"
              className="text-[#14F195] hover:underline flex items-center gap-1"
            >
              <span>{shortenAddress(provider.walletAddress, 4)}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <span>
            Signing authorizes creating a Solana Devnet Escrow PDA for ${jobCost.toFixed(4)} USDC. Funds release only upon successful verification.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
          
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Approve & Lock Escrow</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};
