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
    <div className="space-y-8 text-left">
      
      {/* Header bar */}
      <div className="glass-card p-8 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#14F195]" />
            <span className="tag-label">DePIN Compute Nodes</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Inference Provider Marketplace
          </h2>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">
            Registered GPU nodes with on-chain stake bonds available for autonomous RFC-402 micro-routing
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Search GPU or model..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="glass-input rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-white/40 w-full"
            />
          </div>

          <div className="flex items-center gap-2 glass-input rounded-full px-4 py-2.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none font-mono text-xs cursor-pointer"
            >
              <option value="value" className="bg-[#0A0B10]">Sort: Best Value</option>
              <option value="price" className="bg-[#0A0B10]">Sort: Lowest Price</option>
              <option value="latency" className="bg-[#0A0B10]">Sort: Lowest Latency</option>
              <option value="reputation" className="bg-[#0A0B10]">Sort: Highest Reputation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
            className={`px-4 py-2 rounded-full text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
              filterCapability === cat.id
                ? 'bg-white text-[#0A0B10] font-bold shadow-md scale-[1.02]'
                : 'pill-chip text-white/70 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(provider => {
          const isRogue = provider.id === 'provider-epsilon';

          return (
            <div
              key={provider.id}
              className={`glass-card-interactive p-7 rounded-[28px] flex flex-col justify-between ${
                isRogue ? 'border-rose-500/30' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="font-bold text-base text-white block tracking-tight">
                      {provider.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        provider.status === 'ONLINE' ? 'bg-[#14F195] shadow-[0_0_8px_#14F195]' : 'bg-slate-500'
                      }`} />
                      <span className="text-[11px] font-mono text-white/70">
                        {provider.status}
                      </span>
                      <span className="text-white/20">·</span>
                      <a
                        href={getSolanaExplorerUrl(provider.walletAddress, 'address')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-white/60 hover:text-white flex items-center gap-1"
                      >
                        <span>{shortenAddress(provider.walletAddress, 4)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <span className="pill-chip font-bold text-white text-xs">
                    {provider.reputation}/100
                  </span>
                </div>

                {/* Specs */}
                <div className="bg-white/[0.03] border border-white/[0.10] rounded-2xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-white/90">
                    <Cpu className="w-4 h-4 text-[#14F195] flex-shrink-0" />
                    <span className="truncate font-semibold">{provider.gpu}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {provider.models.map((m, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70"
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
