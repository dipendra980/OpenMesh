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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg p-8 text-left relative shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.14] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#14F195]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Agent Policy Vault Settings
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Autonomous spending guardrails & ephemeral session key delegation
            </p>
          </div>
        </div>

        {/* Vault Info */}
        <div className="bg-white/[0.03] border border-white/[0.10] rounded-2xl p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-white/60">
            <span>VAULT PDA:</span>
            <a
              href={getSolanaExplorerUrl(policy.vaultPda, 'address')}
              target="_blank"
              rel="noreferrer"
              className="text-[#14F195] hover:underline flex items-center gap-1.5"
            >
              <span>{shortenAddress(policy.vaultPda, 6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center justify-between text-white/60">
            <span>SPENT TODAY:</span>
            <span className="font-semibold text-white">${policy.spentToday.toFixed(3)} USDC</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/80 font-medium">Daily Spending Limit</span>
              <span className="text-white font-mono font-bold">${dailyLimit.toFixed(2)} USDC</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={dailyLimit}
              onChange={e => setDailyLimit(parseFloat(e.target.value))}
              className="w-full accent-[#14F195] cursor-pointer"
            />
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/80 font-medium">Auto-Approval Ceiling</span>
              <span className="text-[#14F195] font-mono font-bold">${autoApprovalLimit.toFixed(2)} USDC</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.00"
              step="0.01"
              value={autoApprovalLimit}
              onChange={e => setAutoApprovalLimit(parseFloat(e.target.value))}
              className="w-full accent-[#14F195] cursor-pointer"
            />
            <span className="text-[11px] text-white/50 block mt-1.5 leading-snug">
              Micro-tasks under ${autoApprovalLimit.toFixed(2)} settle autonomously. Queries above this ceiling pause for Phantom Master Wallet approval.
            </span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/80 font-medium">Per-Task Maximum</span>
              <span className="text-white font-mono font-bold">${perTaskLimit.toFixed(2)} USDC</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="5.00"
              step="0.10"
              value={perTaskLimit}
              onChange={e => setPerTaskLimit(parseFloat(e.target.value))}
              className="w-full accent-[#14F195] cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
          <button
            onClick={handleResetSpent}
            className="pill-ghost text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-white/60" />
            <span>Reset Spent</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="pill-ghost text-xs py-2 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="pill-cta text-xs py-2 px-5 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
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
