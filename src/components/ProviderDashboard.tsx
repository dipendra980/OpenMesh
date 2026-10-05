import React, { useState } from 'react';
import { 
  Server, 
  Power, 
  Sliders
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
    <div className="space-y-5 text-left">
      
      {/* Header */}
      <div className="linear-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-300" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Node Operator Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your hardware node, inference pricing, concurrent pipeline capacity, and live settlements
          </p>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleStatus}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-colors ${
            isOnline
              ? 'bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 hover:bg-[#14F195]/20'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isOnline ? 'Node: ONLINE' : 'Node: OFFLINE'}</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="linear-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Today's Settled Revenue
          </span>
          <div className="text-xl font-bold text-[#14F195] font-mono">
            ${provider.todayRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Instant SPL-USDC
          </span>
        </div>

        <div className="linear-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Completed Inferences
          </span>
          <div className="text-xl font-bold text-white font-mono">
            {provider.completedJobs.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {provider.successRate}% Success Rate
          </span>
        </div>

        <div className="linear-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Node Reputation
          </span>
          <div className="text-xl font-bold text-slate-200 font-mono">
            {provider.reputation}/100
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Top 2% provider tier
          </span>
        </div>

        <div className="linear-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Stake Bond
          </span>
          <div className="text-xl font-bold text-slate-200 font-mono">
            ${provider.stakeBondAmount} USDC
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            On-chain escrow bond
          </span>
        </div>
      </div>

      {/* Controls & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        <div className="linear-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <span className="text-xs font-mono font-medium text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Node Parameters</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {provider.gpu}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Price Per Inference</span>
              <span className="text-[#14F195] font-mono font-semibold">${price.toFixed(4)} USDC</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={price}
              onChange={e => handlePriceChange(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Concurrent Pipelines</span>
              <span className="text-white font-mono font-semibold">{maxConcurrent}</span>
            </div>
            <input
              type="range"
              min="1"
              max="32"
              step="1"
              value={maxConcurrent}
              onChange={e => setMaxConcurrent(parseInt(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-white/[0.04]">
            <span className="block text-xs font-medium text-slate-300 mb-1.5">Active Models</span>
            <div className="flex flex-wrap gap-1">
              {provider.models.map((m, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-slate-300"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Incoming queue */}
        <div className="linear-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <span className="text-xs font-mono font-medium text-white">
              Settlement Queue
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
              <span>Listening</span>
            </span>
          </div>

          <div className="space-y-2">
            {recentQueue.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0A0B10] border border-white/[0.04] rounded-lg p-2.5 flex items-center justify-between gap-3 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{item.id}</span>
                    <span className="text-[10px] text-slate-500">{item.capability}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {item.model} · {item.time}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-medium text-[#14F195] block">
                    {item.payment}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300">
                    {item.verification}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
