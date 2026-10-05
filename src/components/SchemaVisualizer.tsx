import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  Key, 
  RefreshCw,
  Table
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OPENMESH_PROGRAM_ID } from '../lib/solana';

export const SchemaVisualizer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<'jobs' | 'providers' | 'agents'>('jobs');
  const [activeSchemaTab, setActiveSchemaTab] = useState<'database' | 'anchor' | 'rfc402'>('database');
  const [liveData, setLiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ jobs: 0, providers: 3, agents: 1 });
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // Load live counts and table rows from Supabase
  const fetchTableData = async (table: 'jobs' | 'providers' | 'agents') => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(10);

      if (error) {
        console.warn(`[Supabase] Could not fetch ${table}:`, error.message);
      } else {
        setLiveData(data || []);
        setConnectionStatus('connected');
        if (count !== null) {
          setCounts(prev => ({ ...prev, [table]: count }));
        }
      }
    } catch {
      setConnectionStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable]);

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="linear-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#14F195]" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Schema & Architecture Visualizer
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : connectionStatus === 'checking'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-[#14F195] animate-pulse' : connectionStatus === 'checking' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <span>{connectionStatus === 'connected' ? 'Supabase Live' : connectionStatus === 'checking' ? 'Connecting...' : 'Supabase Offline'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive relational entity diagrams, on-chain Anchor PDA memory layout, and RFC-402 protocol schema
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0A0B10] p-0.5 rounded-lg border border-white/[0.08] text-xs font-mono">
          <button
            onClick={() => setActiveSchemaTab('database')}
            className={`px-3 py-1 rounded transition-colors ${
              activeSchemaTab === 'database' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Database ERD
          </button>
          <button
            onClick={() => setActiveSchemaTab('anchor')}
            className={`px-3 py-1 rounded transition-colors ${
              activeSchemaTab === 'anchor' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Anchor PDA Layout
          </button>
          <button
            onClick={() => setActiveSchemaTab('rfc402')}
            className={`px-3 py-1 rounded transition-colors ${
              activeSchemaTab === 'rfc402' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            RFC-402 Schema
          </button>
        </div>
      </div>

      {/* View 1: Relational ERD View */}
      {activeSchemaTab === 'database' && (
        <div className="space-y-5">
          
          {/* Visual ERD Diagram */}
          <div className="linear-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-medium text-white uppercase tracking-tight flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Entity Relationship Diagram (PostgreSQL)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Project: qkjdvjcfotbwzopmazta
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              
              {/* Table 1: Agents */}
              <div 
                onClick={() => setSelectedTable('agents')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTable === 'agents' 
                    ? 'bg-[#121520] border-[#14F195]/40 shadow-md ring-1 ring-[#14F195]/20' 
                    : 'bg-[#0A0B10] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                    <Table className="w-3.5 h-3.5 text-cyan-400" />
                    <span>public.agents</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {counts.agents} rows
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1">
                      <Key className="w-2.5 h-2.5 text-amber-400" /> id
                    </span>
                    <span className="text-slate-500 text-[10px]">text (PK)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>owner_wallet</span>
                    <span className="text-slate-500 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>vault_pda</span>
                    <span className="text-slate-500 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>daily_limit</span>
                    <span className="text-slate-500 text-[10px]">numeric</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>auto_approval_limit</span>
                    <span className="text-slate-500 text-[10px]">numeric</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>spent_today</span>
                    <span className="text-slate-500 text-[10px]">numeric</span>
                  </div>
                </div>
              </div>

              {/* Table 2: Jobs (Center Hub) */}
              <div 
                onClick={() => setSelectedTable('jobs')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTable === 'jobs' 
                    ? 'bg-[#121520] border-[#14F195]/40 shadow-md ring-1 ring-[#14F195]/20' 
                    : 'bg-[#0A0B10] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                    <Table className="w-3.5 h-3.5 text-[#14F195]" />
                    <span>public.jobs</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#14F195] font-semibold">
                    {counts.jobs} rows
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1">
                      <Key className="w-2.5 h-2.5 text-amber-400" /> id
                    </span>
                    <span className="text-slate-500 text-[10px]">text (PK)</span>
                  </div>
                  <div className="flex items-center justify-between text-cyan-300">
                    <span>agent_id</span>
                    <span className="text-slate-500 text-[10px]">text (FK)</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-300">
                    <span>provider_id</span>
                    <span className="text-slate-500 text-[10px]">text (FK)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>input_hash</span>
                    <span className="text-slate-500 text-[10px]">text (SHA-256)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>output_hash</span>
                    <span className="text-slate-500 text-[10px]">text (SHA-256)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14F195]">
                    <span>price</span>
                    <span className="text-slate-500 text-[10px]">numeric (USDC)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>status</span>
                    <span className="text-slate-500 text-[10px]">text (settled/refunded)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>escrow_pda</span>
                    <span className="text-slate-500 text-[10px]">text (Solana Pubkey)</span>
                  </div>
                </div>
              </div>

              {/* Table 3: Providers */}
              <div 
                onClick={() => setSelectedTable('providers')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTable === 'providers' 
                    ? 'bg-[#121520] border-[#14F195]/40 shadow-md ring-1 ring-[#14F195]/20' 
                    : 'bg-[#0A0B10] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                    <Table className="w-3.5 h-3.5 text-purple-400" />
                    <span>public.providers</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {counts.providers} rows
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1">
                      <Key className="w-2.5 h-2.5 text-amber-400" /> id
                    </span>
                    <span className="text-slate-500 text-[10px]">text (PK)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>name</span>
                    <span className="text-slate-500 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>wallet_address</span>
                    <span className="text-slate-500 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>gpu</span>
                    <span className="text-slate-500 text-[10px]">text (A100/H100)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14F195]">
                    <span>price_per_request</span>
                    <span className="text-slate-500 text-[10px]">numeric</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>stake_bond_amount</span>
                    <span className="text-slate-500 text-[10px]">numeric (Bond)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>reputation</span>
                    <span className="text-slate-500 text-[10px]">int</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-slate-500 flex items-center justify-between">
              <span>Foreign Key Relationships: jobs.agent_id → agents.id | jobs.provider_id → providers.id</span>
              <span className="text-[#14F195]">Click any table above to query live data</span>
            </div>
          </div>

          {/* Live Data Query Inspector */}
          <div className="linear-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-white">
                  Live Query Inspector: SELECT * FROM public.{selectedTable} LIMIT 10
                </span>
              </div>
              <button
                onClick={() => fetchTableData(selectedTable)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Query</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                Querying Supabase PostgreSQL instance...
              </div>
            ) : liveData.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                No rows returned in public.{selectedTable}. Dispatch a task in Agent Console to populate rows.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72">
                <pre className="p-3 bg-[#0A0B10] rounded-lg border border-white/[0.06] text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
                  {JSON.stringify(liveData, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      )}

      {/* View 2: Anchor On-Chain PDA Schema */}
      {activeSchemaTab === 'anchor' && (
        <div className="linear-card rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Solana Program Derived Address (PDA) Account Memory Layout
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact binary space layout allocated on Solana Devnet for each autonomous job escrow
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#14F195]">
              Total Allocated Space: 112 Bytes
            </span>
          </div>

          <div className="bg-[#0A0B10] border border-white/[0.06] rounded-xl p-4 font-mono text-xs space-y-3">
            <div className="text-slate-400">// PDA Derivation Seeds (Deterministic Invariant)</div>
            <div className="p-2.5 rounded bg-black/60 border border-white/10 text-[#14F195] space-y-1">
              <div>PublicKey::find_program_address(&[b"mesh_escrow", agent_pubkey.as_ref(), &job_id], &OPENMESH_PROGRAM_ID)</div>
              <div className="text-[10px] text-slate-400 font-mono">Program ID: <span className="text-slate-200">{OPENMESH_PROGRAM_ID.toBase58()}</span></div>
            </div>

            <div className="pt-2 text-slate-400">// Account Struct: JobEscrow (InitSpace = 104 bytes + 8-byte discriminator)</div>
            <div className="space-y-1.5 pl-2 text-slate-300">
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span className="text-purple-400">8-byte Anchor Discriminator</span>
                <span className="text-slate-500">Offset: 0..8 (SHA256("account:JobEscrow")[..8])</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span>agent: Pubkey</span>
                <span className="text-slate-500">32 bytes (Offset 8..40)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span>provider: Pubkey</span>
                <span className="text-slate-500">32 bytes (Offset 40..72)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span className="text-[#14F195]">amount: u64 (SPL-USDC micro-units)</span>
                <span className="text-slate-500">8 bytes (Offset 72..80)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span>job_id: [u8; 16]</span>
                <span className="text-slate-500">16 bytes (Offset 80..96)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span>timeout_slot: u64</span>
                <span className="text-slate-500">8 bytes (Offset 96..104)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1">
                <span>bump: u8</span>
                <span className="text-slate-500">1 byte (Offset 104..105)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>status: EscrowStatus (Locked=0, Settled=1, Refunded=2)</span>
                <span className="text-slate-500">1 byte (Offset 105..106)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: RFC-402 Protocol Specification */}
      {activeSchemaTab === 'rfc402' && (
        <div className="linear-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">
                RFC-402 (HTTP 402 Payment Required) Header Contract
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                The open communication handshake between client agents and inference providers
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              x402 Specification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3.5 bg-[#0A0B10] rounded-xl border border-white/[0.06] space-y-2">
              <span className="text-amber-400 font-bold block">// 1. Provider 402 Response Schema</span>
              <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`{
  "status": 402,
  "error": "Payment Required",
  "protocol": "solana-spl-usdc-escrow",
  "price_micro_usdc": 5000,
  "escrow_program": "4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz",
  "timeout_slots": 150,
  "required_seeds": ["mesh_escrow", agent, job_id]
}`}
              </pre>
            </div>

            <div className="p-3.5 bg-[#0A0B10] rounded-xl border border-white/[0.06] space-y-2">
              <span className="text-[#14F195] font-bold block">// 2. Agent Authorization Header</span>
              <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`POST /v1/inference HTTP/1.1
Authorization: Solana-Escrow-Proof <TX_SIG>
X-Job-ID: job_8392_alpha
Content-Type: application/json

{
  "prompt": "...",
  "input_sha256": "e3b0c44298fc1c149afbf4..."
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
