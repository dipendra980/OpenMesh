import React, { useState } from 'react';
import { 
  Server, 
  Power, 
  Sliders,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { Provider } from '../types';

interface ProviderDashboardProps {
  provider: Provider;
  onUpdateProvider: (updated: Provider) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  provider,
  onUpdateProvider,
}) => {
  const [isOnline, setIsOnline] = useState(provider.status === 'ONLINE');
  const [price, setPrice] = useState(provider.pricePerRequest);
  const [maxConcurrent, setMaxConcurrent] = useState(provider.maxConcurrentJobs);
  const [recentQueue] = useState([
    {
      id: 'JOB #8392',
      capability: 'Vision-Language',
      model: 'Llama-3.2-11B-Vision',
      payment: '+$0.005 USDC',
      status: 'COMPLETED',
      verification: 'PASSED',
      time: '12:42:33',
    },
    {
      id: 'JOB #8391',
      capability: 'Vision-Language',
      model: 'Llama-3.2-11B-Vision',
      payment: '+$0.005 USDC',
      status: 'COMPLETED',
      verification: 'PASSED',
      time: '12:40:18',
    },
    {
      id: 'JOB #8389',
      capability: 'Text Reasoning',
      model: 'Llama-3.2-11B-Vision',
      payment: '+$0.003 USDC',
      status: 'COMPLETED',
      verification: 'PASSED',
      time: '12:35:45',
    }
  ]);

  const toggleStatus = () => {
    const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE';
    setIsOnline(!isOnline);
    onUpdateProvider({
      ...provider,
      status: nextStatus,
    });
  };

  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    onUpdateProvider({
      ...provider,
      pricePerRequest: newPrice,
    });
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Node Operator Control Panel
                </h2>
                <span className="tag-label px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-[#14F195]">
                  {provider.gpu}
                </span>
              </div>
              <p className="text-sm text-white/60 mt-0.5">
                Manage hardware capacity, inference pricing, concurrent pipeline limits, and real-time on-chain revenue.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleStatus}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-mono text-xs font-semibold tracking-wide transition-all shadow-lg active:scale-95 ${
            isOnline
              ? 'bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/40 hover:bg-[#14F195]/30 shadow-[#14F195]/10'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-500/10'
          }`}
        >
          <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
          <span>{isOnline ? 'SYSTEM: ONLINE' : 'SYSTEM: OFFLINE'}</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col justify-between relative overflow-hidden group hover:border-white/25 transition-all">
          <div className="space-y-1">
            <span className="tag-label">Today's Settled Revenue</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="currency-sym">$</span>
              <span className="text-4xl sm:text-5xl font-extrabold text-[#14F195] font-mono tracking-tight">
                {provider.todayRevenue.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 font-mono">
            <span>Instant SPL-USDC</span>
            <span className="text-[#14F195] font-semibold">100% Finalized</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col justify-between relative overflow-hidden group hover:border-white/25 transition-all">
          <div className="space-y-1">
            <span className="tag-label">Completed Inferences</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                {provider.completedJobs.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 font-mono">
            <span>Success Rate</span>
            <span className="text-white font-semibold">{provider.successRate}%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col justify-between relative overflow-hidden group hover:border-white/25 transition-all">
          <div className="space-y-1">
            <span className="tag-label">Node Reputation</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                {provider.reputation}
              </span>
              <span className="text-lg text-white/40 font-mono">/100</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 font-mono">
            <span>Tier Classification</span>
            <span className="text-cyan-400 font-semibold">Top 2% SLA</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col justify-between relative overflow-hidden group hover:border-white/25 transition-all">
          <div className="space-y-1">
            <span className="tag-label">Stake Bond Escrow</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="currency-sym">$</span>
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                {provider.stakeBondAmount}
              </span>
              <span className="metric-unit">USDC</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 font-mono">
            <span>On-Chain Status</span>
            <span className="text-[#14F195] font-semibold">Active & Bonded</span>
          </div>
        </div>

      </div>

      {/* Controls & Queue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Node Parameters */}
        <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-cyan-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Dynamic Node Parameters
                </h3>
                <span className="text-xs text-white/50">Adjust pricing and concurrent compute quotas</span>
              </div>
            </div>
            <span className="tag-label px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-white">
              {provider.gpu}
            </span>
          </div>

          {/* Pricing Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-white/80">Price Per Inference</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xs text-white/50">$</span>
                <span className="text-lg font-bold text-[#14F195]">{price.toFixed(4)}</span>
                <span className="text-xs text-white/50">USDC</span>
              </div>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={price}
              onChange={e => handlePriceChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-white/10 appearance-none cursor-pointer accent-[#14F195]"
            />
            <div className="flex justify-between text-[11px] text-white/40 font-mono">
              <span>$0.001 (High Volume)</span>
              <span>$0.050 (Premium SLA)</span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Concurrent Pipelines */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-white/80">Concurrent Inference Threads</span>
              <span className="text-lg font-bold text-white font-mono">{maxConcurrent} Workers</span>
            </div>
            <input
              type="range"
              min="1"
              max="32"
              step="1"
              value={maxConcurrent}
              onChange={e => setMaxConcurrent(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg bg-white/10 appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[11px] text-white/40 font-mono">
              <span>1 Worker (Serial)</span>
              <span>32 Workers (Cluster Maximum)</span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Active Model Stack */}
          <div className="space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Loaded Model Checkpoints
            </span>
            <div className="flex flex-wrap gap-2">
              {provider.models.map((m, i) => (
                <span
                  key={i}
                  className="pill-chip flex items-center gap-1.5"
                >
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>{m}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Incoming Settlement Queue */}
        <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#14F195]">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Live Settlement Queue
                </h3>
                <span className="text-xs text-white/50">Autonomous RFC-402 micro-escrows</span>
              </div>
            </div>
            <span className="tag-label px-3 py-1 rounded-full bg-[#14F195]/15 border border-[#14F195]/30 text-[#14F195] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#14F195] animate-ping" />
              <span>Real-Time</span>
            </span>
          </div>

          <div className="space-y-3">
            {recentQueue.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tracking-wide">{item.id}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70">
                      {item.capability}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40">
                    {item.model} · {item.time}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-sm font-bold text-[#14F195] block">
                    {item.payment}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{item.verification}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-white/50 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14F195]" />
              <span>Zero-Chargeback Solana Anchor SLA</span>
            </span>
            <span className="text-white/40">3 items in buffer</span>
          </div>
        </div>

      </div>

    </div>
  );
};
