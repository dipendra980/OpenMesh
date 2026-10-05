import React from 'react';
import { 
  Cpu, 
  Wallet, 
  ShieldCheck, 
  ExternalLink, 
  Radio, 
  SlidersHorizontal
} from 'lucide-react';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';
import type { AgentPolicy } from '../types';

interface HeaderProps {
  activeTab: 'console' | 'marketplace' | 'provider' | 'network' | 'schema' | 'history';
  setActiveTab: (tab: 'console' | 'marketplace' | 'provider' | 'network' | 'schema' | 'history') => void;
  walletConnected: boolean;
  walletAddress: string;
  solBalance: number;
  usdcBalance: number;
  connectWallet: () => void;
  disconnectWallet: () => void;
  agentPolicy: AgentPolicy;
  onOpenVaultSettings: () => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  walletConnected,
  walletAddress,
  solBalance,
  usdcBalance,
  connectWallet,
  disconnectWallet,
  agentPolicy,
  onOpenVaultSettings,
  isDemoMode,
  setIsDemoMode,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#08090D]/90 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => setActiveTab('console')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#14F195]/40 transition-colors">
              <Cpu className="w-4 h-4 text-[#14F195]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                OpenMesh
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                RFC-402
              </span>
            </div>
          </div>

          {/* Network Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
            <span>Solana Devnet</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">1,480 TPS</span>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="flex items-center gap-1 bg-[#0E1017] p-1 rounded-lg border border-white/[0.06] overflow-x-auto max-w-full">
          {[
            { id: 'console', label: 'Agent Console' },
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'provider', label: 'Node Operator' },
            { id: 'network', label: 'Telemetry' },
            { id: 'schema', label: 'Schema ERD' },
            { id: 'history', label: 'Solana Ledger' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Mode Switch */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] font-mono text-slate-300 transition-colors"
            title="Toggle between Live Devnet or Deterministic Simulator"
          >
            <Radio className={`w-3 h-3 ${isDemoMode ? 'text-amber-400' : 'text-[#14F195]'}`} />
            <span>{isDemoMode ? 'Demo Mode' : 'Live Devnet'}</span>
          </button>

          {/* Session Key Vault */}
          <button
            onClick={onOpenVaultSettings}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] font-mono text-slate-300 transition-colors group"
            title="Configure Agent Spending Policy Vault"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#14F195]" />
            <span>Vault:</span>
            <span className="text-white font-semibold">${agentPolicy.spentToday.toFixed(3)}</span>
            <span className="text-slate-500">/ ${agentPolicy.dailyLimit}</span>
            <SlidersHorizontal className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-0.5" />
          </button>

          {/* Wallet */}
          {walletConnected ? (
            <div className="flex items-center gap-2 bg-[#0E1017] border border-white/[0.08] rounded-md px-2.5 py-1">
              <div className="text-right font-mono text-[11px] leading-tight">
                <span className="text-white font-medium">${usdcBalance.toFixed(2)}</span>
                <span className="text-slate-500 text-[10px] ml-1">USDC</span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="text-slate-400 text-[10px]">{solBalance.toFixed(2)} SOL</span>
              </div>
              <div className="h-3 w-[1px] bg-white/10" />
              <a
                href={getSolanaExplorerUrl(walletAddress, 'address')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-white transition-colors"
                title="View Wallet on Solana Explorer"
              >
                <span>{shortenAddress(walletAddress, 4)}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
              <button
                onClick={disconnectWallet}
                className="text-slate-500 hover:text-rose-400 text-xs ml-1"
                title="Disconnect"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
