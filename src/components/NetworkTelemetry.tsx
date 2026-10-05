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
  Globe 
} from 'lucide-react';
import { getSolanaExplorerUrl, OPENMESH_PROGRAM_ID } from '../lib/solana';

export const NetworkTelemetry: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="linear-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#14F195]" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Protocol & Network Telemetry
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time decentralized clearing metrics across Solana Devnet and registered AI compute nodes
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-[#0A0B10] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
          <span className="text-slate-500 mr-1.5">ESCROW PROGRAM:</span>
          <a
            href={getSolanaExplorerUrl(OPENMESH_PROGRAM_ID.toBase58(), 'address')}
            target="_blank"
            rel="noreferrer"
            className="text-[#14F195] hover:underline"
          >
            4CN3kzED...Laz
          </a>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: 'Active Providers', value: '128', sub: '+12 this week', icon: Server, color: 'text-white' },
          { label: 'Available GPUs', value: '342', sub: 'H100, A100, 4090s', icon: Cpu, color: 'text-slate-200' },
          { label: 'Models Active', value: '76', sub: 'Vision, LLM, Audio', icon: Share2, color: 'text-slate-200' },
          { label: 'Jobs Today', value: '12,482', sub: 'Autonomous M2M', icon: Activity, color: 'text-white' },
          { label: 'USDC Settled', value: '$8,421.50', sub: 'Zero chargebacks', icon: Coins, color: 'text-[#14F195]' },
          { label: 'Avg Latency', value: '390ms', sub: 'Sub-second finality', icon: Clock, color: 'text-slate-200' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="linear-card rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-500">
                  {m.label}
                </span>
                <Icon className={`w-3 h-3 text-slate-400`} />
              </div>
              <div>
                <div className={`text-lg font-bold font-mono ${m.color}`}>
                  {m.value}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {m.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Topology */}
      <div className="linear-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-xs font-mono font-medium text-white uppercase tracking-tight flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Decentralized Agent-to-GPU Topology</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous discovery, micro-escrow locking, and settlement on Solana
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            OpenMesh Router v1.0
          </span>
        </div>

        <div className="relative py-6 px-4 flex flex-col items-center">
          
          <div className="w-60 p-3 rounded-xl bg-[#0A0B10] border border-white/[0.12] text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-medium block mb-0.5">
              Client Runtime
            </span>
            <span className="text-xs font-semibold text-white">Autonomous AI Agent</span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              Delegated Session Key ($5.00 Cap)
            </span>
          </div>

          <div className="w-0.5 h-6 bg-white/20" />

          <div className="w-64 p-3 rounded-xl bg-[#0E1017] border border-white/[0.15] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-medium text-white mb-0.5">
              <Zap className="w-3 h-3 text-[#14F195]" />
              <span>OpenMesh M2M Router</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Scoring Engine · Verification · SLA Clearing
            </span>
          </div>

          <div className="w-full max-w-md h-6 relative flex items-center justify-between">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white/20" />
            <div className="absolute top-3 left-12 right-12 h-0.5 bg-white/10" />
            <div className="w-0.5 h-3 bg-white/10 mt-3 ml-12" />
            <div className="w-0.5 h-3 bg-white/10 mt-3 mx-auto" />
            <div className="w-0.5 h-3 bg-white/10 mt-3 mr-12" />
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-xl mt-1">
            <div className="p-2.5 rounded-lg bg-[#0A0B10] border border-white/[0.06] text-center">
              <span className="text-[10px] font-mono text-slate-400 block font-medium">GPU Alpha</span>
              <span className="text-xs text-white">RTX 4090</span>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">420ms · $0.003</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0A0B10] border border-white/20 text-center">
              <span className="text-[10px] font-mono text-[#14F195] block font-medium">GPU Beta</span>
              <span className="text-xs text-white">A100 SXM4</span>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">280ms · $0.005</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0A0B10] border border-white/[0.06] text-center">
              <span className="text-[10px] font-mono text-slate-400 block font-medium">GPU Delta</span>
              <span className="text-xs text-white">8x H100</span>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">190ms · $0.012</span>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-white/20 mt-3" />

          <div className="w-72 p-2.5 rounded-xl bg-[#0A0B10] border border-white/[0.12] text-center font-mono">
            <span className="text-xs font-medium text-white block">
              Solana Settlement Layer
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              SPL-USDC Escrow PDA · 400ms Sub-Cent Finality
            </span>
          </div>

        </div>
      </div>

      {/* RFC-402 Spec */}
      <div className="linear-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-slate-300" />
            <h3 className="text-xs font-mono font-medium text-white uppercase tracking-tight">
              RFC-402 Specification (HTTP 402)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            Open Standard
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          OpenMesh implements native <strong>HTTP 402 (Payment Required)</strong> using Solana Program Derived Addresses for instant, programmatic settlement.
        </p>

        <div className="bg-[#0A0B10] border border-white/[0.06] rounded-lg p-3.5 font-mono text-xs text-slate-300 overflow-x-auto space-y-1.5">
          <div className="text-slate-500">// Provider Challenge & Escrow Settlement Flow</div>
          <div>{`app.post('/v1/inference', async (req, res) => {`}</div>
          <div className="pl-4">{`const proof = req.headers['authorization'];`}</div>
          <div className="pl-4">{`if (!proof || !verifySolanaEscrow(proof, req.body)) {`}</div>
          <div className="pl-8 text-amber-400">{`return res.status(402).json({`}</div>
          <div className="pl-12 text-slate-400">{`error: "Payment Required",`}</div>
          <div className="pl-12 text-slate-400">{`price_micro_usdc: 5000,`}</div>
          <div className="pl-12 text-slate-400">{`escrow_program: "4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz"`}</div>
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
