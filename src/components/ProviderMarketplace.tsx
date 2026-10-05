import React, { useState } from 'react';
import { 
  Server, 
  Search, 
  ArrowUpDown, 
  Cpu, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import type { Provider, TaskCapability } from '../types';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';

interface ProviderMarketplaceProps {
  providers: Provider[];
  onSelectProvider?: (provider: Provider) => void;
}

export const ProviderMarketplace: React.FC<ProviderMarketplaceProps> = ({
  providers,
  onSelectProvider: _onSelectProvider,
}) => {
  const [filterCapability, setFilterCapability] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'price' | 'latency' | 'reputation'>('value');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.gpu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.models.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterCapability === 'all') return true;
    return p.capabilities.includes(filterCapability as TaskCapability);
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.pricePerRequest - b.pricePerRequest;
      case 'latency':
        return a.averageLatency - b.averageLatency;
      case 'reputation':
        return b.reputation - a.reputation;
      case 'value':
      default:
        const scoreA = (a.successRate / 100) * 50 + (1000 / a.averageLatency) * 30 + (0.01 / a.pricePerRequest) * 20;
        const scoreB = (b.successRate / 100) * 50 + (1000 / b.averageLatency) * 30 + (0.01 / b.pricePerRequest) * 20;
        return scoreB - scoreA;
    }
  });

  return (
    <div className="space-y-5 text-left">
      
      {/* Header bar */}
      <div className="linear-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-300" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Inference Provider Directory
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered GPU nodes with on-chain stake bonds available for autonomous M2M routing
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search GPU or model..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="linear-input rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-sans w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 linear-input rounded-md px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none font-mono text-xs cursor-pointer"
            >
              <option value="value" className="bg-[#0E1017]">Sort: Best Value</option>
              <option value="price" className="bg-[#0E1017]">Sort: Lowest Price</option>
              <option value="latency" className="bg-[#0E1017]">Sort: Lowest Latency</option>
              <option value="reputation" className="bg-[#0E1017]">Sort: Highest Reputation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Models' },
          { id: 'vision', label: 'Vision-Language' },
          { id: 'llm', label: 'Deep Reasoning' },
          { id: 'code', label: 'Code & Syntax' },
          { id: 'audio', label: 'Audio / Whisper' },
          { id: 'embeddings', label: 'Embeddings' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCapability(cat.id)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              filterCapability === cat.id
                ? 'bg-white/10 text-white font-medium border border-white/20'
                : 'bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map(provider => {
          const isRogue = provider.id === 'provider-epsilon';

          return (
            <div
              key={provider.id}
              className={`linear-card rounded-xl p-4.5 flex flex-col justify-between transition-colors ${
                isRogue ? 'border-rose-500/20' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-semibold text-sm text-white block">
                      {provider.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        provider.status === 'ONLINE' ? 'bg-[#14F195]' : 'bg-slate-500'
                      }`} />
                      <span className="text-[11px] font-mono text-slate-400">
                        {provider.status}
                      </span>
                      <span className="text-slate-600">·</span>
                      <a
                        href={getSolanaExplorerUrl(provider.walletAddress, 'address')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                      >
                        <span>{shortenAddress(provider.walletAddress, 4)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-300">
                    {provider.reputation}/100
                  </span>
                </div>

                {/* Specs */}
                <div className="bg-[#0A0B10] border border-white/[0.04] rounded-lg p-2.5 mb-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{provider.gpu}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {provider.models.map((m, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] text-slate-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.04] mb-3 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">PRICE</span>
                    <span className="text-xs font-semibold text-[#14F195]">
                      ${provider.pricePerRequest.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">LATENCY</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {provider.averageLatency}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SUCCESS</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {provider.successRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#14F195]" />
                  <span>Bond: ${provider.stakeBondAmount} USDC</span>
                </span>
                <span>{provider.completedJobs.toLocaleString()} jobs</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
