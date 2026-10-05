import React from 'react';
import { 
  Cpu, 
  Wallet, 
  ShieldCheck, 
  ExternalLink, 
  Radio, 
  SlidersHorizontal,
  Bot,
  Server
} from 'lucide-react';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';
import type { AgentPolicy } from '../types';

export type AppTab = 'console' | 'worker' | 'marketplace' | 'network' | 'schema' | 'history';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
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
    <header className="sticky top-0 z-50 bg-[#07080e]/60 backdrop-blur-[24px] saturate-[180%] border-b border-white/[0.12] px-4 sm:px-6 lg:px-10 py-3.5 transition-colors">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => setActiveTab('console')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.16] backdrop-blur-md flex items-center justify-center group-hover:border-[#14F195]/60 group-hover:shadow-[0_0_16px_rgba(20,241,149,0.3)] transition-all">
              <Cpu className="w-4 h-4 text-[#14F195]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base tracking-tight text-white font-display">
                OpenMesh
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.14]">
                RFC-402
              </span>
            </div>
          </div>

          {/* Network Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.12] text-[11px] font-mono text-white/70 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_#14F195]" />
            <span>Solana Devnet</span>
            <span className="text-white/30">·</span>
            <span className="text-white font-medium">1,480 TPS</span>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="flex items-center gap-1 bg-white/[0.04] backdrop-blur-[20px] p-1.5 rounded-full border border-white/[0.14] shadow-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'console'
                ? 'bg-white text-[#0A0B10] font-bold shadow-md scale-[1.02]'
                : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agent Console</span>
          </button>

          <button
            onClick={() => setActiveTab('worker')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'worker'
                ? 'bg-white text-[#0A0B10] font-bold shadow-md scale-[1.02]'
                : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Worker Cockpit</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] ml-0.5 animate-pulse" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

          {[
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'network', label: 'Telemetry' },
            { id: 'schema', label: 'Schema ERD' },
            { id: 'history', label: 'Solana Ledger' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.14] text-[11px] font-mono text-white/80 transition-all cursor-pointer"
            title="Toggle between Live Devnet or Deterministic Simulator"
          >
            <Radio className={`w-3 h-3 ${isDemoMode ? 'text-amber-400' : 'text-[#14F195]'}`} />
            <span>{isDemoMode ? 'Demo Mode' : 'Live Devnet'}</span>
          </button>

          {/* Session Key Vault */}
          <button
            onClick={onOpenVaultSettings}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.14] text-[11px] font-mono text-white/80 transition-all cursor-pointer group"
            title="Configure Agent Spending Policy Vault"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#14F195]" />
            <span>Vault:</span>
            <span className="text-white font-semibold">${agentPolicy.spentToday.toFixed(3)}</span>
            <span className="text-white/40">/ ${agentPolicy.dailyLimit}</span>
            <SlidersHorizontal className="w-3 h-3 text-white/40 group-hover:text-white ml-0.5 transition-colors" />
          </button>

          {/* Wallet */}
          {walletConnected ? (
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.14] rounded-full px-3 py-1.5 shadow-sm">
              <div className="text-right font-mono text-[11px] leading-tight">
                <span className="text-white font-semibold">${usdcBalance.toFixed(2)}</span>
                <span className="text-white/50 text-[10px] ml-1">USDC</span>
                <span className="text-white/30 mx-1">·</span>
                <span className="text-white/70 text-[10px]">{solBalance.toFixed(2)} SOL</span>
              </div>
              <div className="h-3 w-[1px] bg-white/20" />
              <a
                href={getSolanaExplorerUrl(walletAddress, 'address')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[11px] text-white/70 hover:text-white transition-colors"
                title="View Wallet on Solana Explorer"
              >
                <span>{shortenAddress(walletAddress, 4)}</span>
                <ExternalLink className="w-2.5 h-2.5 text-white/50" />
              </a>
              <button
                onClick={disconnectWallet}
                className="text-white/50 hover:text-rose-400 text-xs ml-1 cursor-pointer transition-colors"
                title="Disconnect"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="pill-cta text-xs py-1.5 px-4"
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
