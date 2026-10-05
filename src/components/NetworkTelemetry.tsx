import React from 'react';
import { 
  Activity, 
  Cpu, 
  Server, 
  Coins, 
  Clock, 
  Share2, 
  FileCode2, 
  Zap, 
  Globe,
  ExternalLink
} from 'lucide-react';
import { getSolanaExplorerUrl, OPENMESH_PROGRAM_ID } from '../lib/solana';

export const NetworkTelemetry: React.FC = () => {
  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-[#14F195]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Protocol & Network Telemetry
                </h2>
                <span className="tag-label px-2.5 py-0.5 rounded-full bg-[#14F195]/15 border border-[#14F195]/30 text-[#14F195]">
                  Live Mainnet Alpha
                </span>
              </div>
              <p className="text-sm text-white/60 mt-0.5">
                Real-time decentralized clearing metrics across Solana Devnet and registered AI compute nodes.
              </p>
            </div>
          </div>
        </div>

        {/* Program ID Chip */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/60 bg-white/[0.04] px-4 py-2.5 rounded-full border border-white/[0.12] shadow-inner">
          <span className="text-white/40">ESCROW PROGRAM:</span>
          <a
            href={getSolanaExplorerUrl(OPENMESH_PROGRAM_ID.toBase58(), 'address')}
            target="_blank"
            rel="noreferrer"
            className="text-[#14F195] hover:text-[#14F195]/80 font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>4CN3kzED...Laz</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 6 Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {[
          { label: 'Active Providers', value: '128', sub: '+12 this week', icon: Server, color: 'text-white' },
          { label: 'Available GPUs', value: '342', sub: 'H100, A100, 4090s', icon: Cpu, color: 'text-white' },
          { label: 'Models Active', value: '76', sub: 'Vision, LLM, Audio', icon: Share2, color: 'text-white' },
          { label: 'Jobs Today', value: '12,482', sub: 'Autonomous M2M', icon: Activity, color: 'text-white' },
          { label: 'USDC Settled', value: '$8,421.50', sub: 'Zero chargebacks', icon: Coins, color: 'text-[#14F195]' },
          { label: 'Avg Latency', value: '390ms', sub: 'Sub-second finality', icon: Clock, color: 'text-cyan-400' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div 
              key={idx} 
              className="glass-card p-5 sm:p-6 rounded-[28px] flex flex-col justify-between hover:border-white/25 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="tag-label">
                  {m.label}
                </span>
                <div className="p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 group-hover:text-white transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${m.color}`}>
                  {m.value}
                </div>
                <div className="text-[11px] text-white/40 font-mono">
                  {m.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Topology Diagram */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Decentralized Agent-to-GPU Topology
              </h3>
              <p className="text-xs text-white/50">
                Autonomous discovery, micro-escrow locking, and sub-second settlement on Solana
              </p>
            </div>
          </div>
          <span className="tag-label px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-white">
            OpenMesh Router v1.0
          </span>
        </div>

        <div className="relative py-8 px-4 flex flex-col items-center">
          
          {/* Top: Client Runtime */}
          <div className="w-full max-w-xs p-4 rounded-[22px] bg-white/[0.04] border border-white/[0.15] backdrop-blur-xl text-center shadow-lg">
            <span className="tag-label block mb-1 text-white/60">
              Client Runtime
            </span>
            <span className="text-sm font-bold text-white">Autonomous AI Agent</span>
            <span className="text-xs font-mono text-[#14F195] block mt-1">
              Delegated Session Key ($5.00 Cap)
            </span>
          </div>

          {/* Vertical Connector */}
          <div className="w-px h-8 bg-gradient-to-b from-white/30 via-white/20 to-white/30 my-1" />

          {/* Middle: Router */}
          <div className="w-full max-w-sm p-4 rounded-[24px] bg-white/[0.06] border border-white/[0.2] backdrop-blur-2xl text-center shadow-xl relative">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-white mb-1">
              <Zap className="w-4 h-4 text-[#14F195]" />
              <span>OpenMesh M2M Autonomous Router</span>
            </div>
            <span className="text-xs text-white/60">
              Capability Matching · Verification Pipeline · RFC-402 Clearing
            </span>
          </div>

          {/* Branch Connectors */}
          <div className="w-full max-w-lg h-8 relative flex items-center justify-between">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-white/30" />
            <div className="absolute top-4 left-16 right-16 h-px bg-white/20" />
            <div className="w-px h-4 bg-white/20 mt-4 ml-16" />
            <div className="w-px h-4 bg-white/20 mt-4 mx-auto" />
            <div className="w-px h-4 bg-white/20 mt-4 mr-16" />
          </div>

          {/* Provider Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-1">
            <div className="p-4 rounded-[20px] bg-white/[0.03] border border-white/[0.1] text-center hover:border-white/25 transition-all">
              <span className="tag-label block mb-1">GPU Alpha</span>
              <span className="text-sm font-bold text-white">RTX 4090 Cluster</span>
              <span className="text-xs font-mono text-white/50 block mt-1">420ms · $0.003 USDC</span>
            </div>

            <div className="p-4 rounded-[20px] bg-white/[0.05] border border-[#14F195]/40 text-center shadow-lg shadow-[#14F195]/5">
              <span className="tag-label text-[#14F195] block mb-1">GPU Beta (Active)</span>
              <span className="text-sm font-bold text-white">A100 SXM4 Node</span>
              <span className="text-xs font-mono text-[#14F195] block mt-1">280ms · $0.005 USDC</span>
            </div>

            <div className="p-4 rounded-[20px] bg-white/[0.03] border border-white/[0.1] text-center hover:border-white/25 transition-all">
              <span className="tag-label block mb-1">GPU Delta</span>
              <span className="text-sm font-bold text-white">8x H100 SuperPOD</span>
              <span className="text-xs font-mono text-white/50 block mt-1">190ms · $0.012 USDC</span>
            </div>
          </div>

          {/* Bottom Connector */}
          <div className="w-px h-8 bg-gradient-to-b from-white/30 via-white/20 to-white/30 my-1" />

          {/* Bottom: Solana Settlement */}
          <div className="w-full max-w-md p-4 rounded-[22px] bg-white/[0.04] border border-white/[0.15] backdrop-blur-xl text-center shadow-lg">
            <span className="text-sm font-bold text-white block">
              Solana Blockchain Settlement Layer
            </span>
            <span className="text-xs font-mono text-[#14F195] block mt-1">
              SPL-USDC Escrow PDA · 400ms Sub-Cent Finality
            </span>
          </div>

        </div>
      </div>

      {/* RFC-402 Spec */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#14F195]">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                RFC-402 Specification (HTTP 402)
              </h3>
              <p className="text-xs text-white/50">
                Machine-to-machine payment handshake protocol using Solana Program Derived Addresses
              </p>
            </div>
          </div>
          <span className="tag-label px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-white">
            Open Standard
          </span>
        </div>

        <p className="text-sm text-white/70 leading-relaxed">
          OpenMesh implements native <strong>HTTP 402 (Payment Required)</strong> using Solana Program Derived Addresses for instant, programmatic settlement without payment intermediaries or custodial risks.
        </p>

        <div className="bg-black/40 border border-white/[0.08] rounded-[20px] p-5 font-mono text-xs text-white/80 overflow-x-auto space-y-1.5 shadow-inner">
          <div className="text-white/40">// Provider Challenge & Escrow Settlement Flow</div>
          <div>{`app.post('/v1/inference', async (req, res) => {`}</div>
          <div className="pl-4">{`const proof = req.headers['authorization'];`}</div>
          <div className="pl-4">{`if (!proof || !verifySolanaEscrow(proof, req.body)) {`}</div>
          <div className="pl-8 text-amber-400">{`return res.status(402).json({`}</div>
          <div className="pl-12 text-white/60">{`error: "Payment Required",`}</div>
          <div className="pl-12 text-white/60">{`price_micro_usdc: 5000,`}</div>
          <div className="pl-12 text-white/60">{`escrow_program: "4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz"`}</div>
          <div className="pl-8 text-amber-400">{`});`}</div>
          <div className="pl-4">{`}`}</div>
          <div className="pl-4">{`const result = await model.generate(req.body.prompt);`}</div>
          <div className="pl-4">{`return res.json({ result, signature: signOutput(result) });`}</div>
          <div>{`});`}</div>
        </div>
      </div>

    </div>
  );
};
