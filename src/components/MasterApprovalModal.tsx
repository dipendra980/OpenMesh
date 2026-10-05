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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg p-8 text-left relative shadow-2xl space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="pill-chip bg-amber-500/15 border-amber-500/30 text-amber-400 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              Approval Escalation Triggered
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Autonomous Policy Threshold Exceeded
          </h3>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">
            This job exceeds the configured auto-approval limit and requires your Master Wallet signature authorization.
          </p>
        </div>

        {/* Task description preview */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.10] text-xs text-white/90 font-mono truncate">
          <span className="text-white/40 mr-2">TASK:</span>
          <span>{taskTitle}</span>
        </div>

        {/* Cost Comparison */}
        <div className="bg-white/[0.03] border border-white/[0.10] rounded-2xl p-5 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60">ESTIMATED COST:</span>
            <span className="text-lg font-bold text-amber-400">
              ${jobCost.toFixed(4)} USDC
            </span>
          </div>

          <div className="flex items-center justify-between text-white/60 border-t border-white/[0.06] pt-2">
            <span>AUTO CEILING:</span>
            <span className="text-white font-medium">${autoLimit.toFixed(2)} USDC</span>
          </div>

          <div className="flex items-center justify-between text-white/60 border-t border-white/[0.06] pt-2">
            <span>TARGET NODE:</span>
            <span className="text-white font-medium">{provider.name}</span>
          </div>

          <div className="flex items-center justify-between text-white/60 border-t border-white/[0.06] pt-2">
            <span>WALLET:</span>
            <a
              href={getSolanaExplorerUrl(provider.walletAddress, 'address')}
              target="_blank"
              rel="noreferrer"
              className="text-[#14F195] hover:underline flex items-center gap-1.5"
            >
              <span>{shortenAddress(provider.walletAddress, 4)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <span>
            Signing authorizes creating a Solana Devnet Escrow PDA for ${jobCost.toFixed(4)} USDC. Funds release only upon successful cryptographic verification.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <button
            onClick={onReject}
            className="pill-ghost text-xs py-2.5 px-5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject Task</span>
          </button>
          
          <button
            onClick={onApprove}
            className="pill-cta text-xs py-3 px-6 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Approve & Lock Escrow</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
};
