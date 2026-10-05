import React, { useState } from 'react';
import { ShieldCheck, X, Key, Check, ExternalLink, RefreshCw } from 'lucide-react';
import type { AgentPolicy } from '../types';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';

interface AgentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: AgentPolicy;
  onUpdatePolicy: (updated: AgentPolicy) => void;
}

export const AgentVaultModal: React.FC<AgentVaultModalProps> = ({
  isOpen,
  onClose,
  policy,
  onUpdatePolicy,
}) => {
  const [dailyLimit, setDailyLimit] = useState(policy.dailyLimit);
  const [perTaskLimit, setPerTaskLimit] = useState(policy.perTaskLimit);
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(policy.autoApprovalLimit);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdatePolicy({
      ...policy,
      dailyLimit,
      perTaskLimit,
      autoApprovalLimit,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 700);
  };

  const handleResetSpent = () => {
    onUpdatePolicy({
      ...policy,
      spentToday: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="linear-card w-full max-w-md rounded-xl p-5 text-left relative shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-500 hover:text-white rounded hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#14F195]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Agent Policy Vault
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous spending thresholds & session key delegation
            </p>
          </div>
        </div>

        {/* Vault Info */}
        <div className="bg-[#0A0B10] border border-white/[0.06] rounded-lg p-3 mb-4 font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>VAULT PDA:</span>
            <a
              href={getSolanaExplorerUrl(policy.vaultPda, 'address')}
              target="_blank"
              rel="noreferrer"
              className="text-[#14F195] hover:underline flex items-center gap-1"
            >
              <span>{shortenAddress(policy.vaultPda, 6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>SPENT TODAY:</span>
            <span className="font-medium text-white">${policy.spentToday.toFixed(3)} USDC</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3.5 mb-5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Daily Spending Limit</span>
              <span className="text-white font-mono font-medium">${dailyLimit.toFixed(2)} USDC</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={dailyLimit}
              onChange={e => setDailyLimit(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Auto-Approval Threshold</span>
              <span className="text-[#14F195] font-mono font-medium">${autoApprovalLimit.toFixed(2)} USDC</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.00"
              step="0.01"
              value={autoApprovalLimit}
              onChange={e => setAutoApprovalLimit(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Tasks exceeding ${autoApprovalLimit.toFixed(2)} pause for Master Wallet approval.
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Per-Task Maximum</span>
              <span className="text-white font-mono font-medium">${perTaskLimit.toFixed(2)} USDC</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="5.00"
              step="0.10"
              value={perTaskLimit}
              onChange={e => setPerTaskLimit(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
          <button
            onClick={handleResetSpent}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Reset Spent</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5 text-black" />
                  <span>Update Policy</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
