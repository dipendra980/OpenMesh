import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  Key, 
  RefreshCw,
  Table,
  Copy,
  Check,
  Code2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OPENMESH_PROGRAM_ID } from '../lib/solana';

const SUPABASE_MIGRATION_SQL = `-- =========================================================================
-- OPENMESH PRODUCTION SUPABASE MIGRATION: REAL-TIME WORKER/AGENT PROTOCOL
-- =========================================================================

-- 1. Create Job Status Enumerated Type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM (
      'created',
      'escrow_locked',
      'processing',
      'result_submitted',
      'settled',
      'refunded',
      'slashed'
    );
  END IF;
END $$;

-- 2. Create mesh_providers Table (Worker Registry)
CREATE TABLE IF NOT EXISTS public.mesh_providers (
  pubkey TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gpu_type TEXT NOT NULL DEFAULT 'NVIDIA H100 SXM5',
  is_online BOOLEAN NOT NULL DEFAULT true,
  stake_bond_usdc NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  reputation_score NUMERIC(5, 2) NOT NULL DEFAULT 98.50,
  total_jobs_completed INTEGER NOT NULL DEFAULT 0,
  total_slashed INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create mesh_jobs Table (Real-time Cross-Client Jobs)
CREATE TABLE IF NOT EXISTS public.mesh_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  agent_pubkey TEXT NOT NULL,
  provider_pubkey TEXT,
  escrow_pda TEXT NOT NULL,
  capability TEXT NOT NULL DEFAULT 'llm',
  prompt TEXT NOT NULL,
  groq_model TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  cost_usdc NUMERIC(10, 4) NOT NULL DEFAULT 0.0050,
  status TEXT NOT NULL DEFAULT 'created',
  output_text TEXT,
  latency_ms INTEGER,
  sha256_digest TEXT,
  ed25519_signature TEXT,
  verification_passed BOOLEAN,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.mesh_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesh_jobs ENABLE ROW LEVEL SECURITY;

-- 5. Permissive Policies for Web3 Client Direct Access
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Permissive select on mesh_providers" ON public.mesh_providers;
  CREATE POLICY "Permissive select on mesh_providers" ON public.mesh_providers FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Permissive insert on mesh_providers" ON public.mesh_providers;
  CREATE POLICY "Permissive insert on mesh_providers" ON public.mesh_providers FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Permissive update on mesh_providers" ON public.mesh_providers;
  CREATE POLICY "Permissive update on mesh_providers" ON public.mesh_providers FOR UPDATE USING (true);

  DROP POLICY IF EXISTS "Permissive select on mesh_jobs" ON public.mesh_jobs;
  CREATE POLICY "Permissive select on mesh_jobs" ON public.mesh_jobs FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Permissive insert on mesh_jobs" ON public.mesh_jobs;
  CREATE POLICY "Permissive insert on mesh_jobs" ON public.mesh_jobs FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Permissive update on mesh_jobs" ON public.mesh_jobs;
  CREATE POLICY "Permissive update on mesh_jobs" ON public.mesh_jobs FOR UPDATE USING (true);
END $$;

-- 6. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesh_providers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesh_jobs;

-- 7. Seed Initial Verified Worker Providers
INSERT INTO public.mesh_providers (pubkey, name, gpu_type, is_online, stake_bond_usdc, reputation_score)
VALUES 
  ('BetaNode7x9Qm4K2nZY4jQ8W1mN9vX2P7qL1w8T6yZ4bJ9cE', 'GPU Provider Beta (Active)', 'NVIDIA A100 SXM4 80GB', true, 100.00, 99.40),
  ('AlphaNode5x8P1w8T6yZ4bJ9cE6hZp1M8T4u4c2A5k9h7rY2', 'GPU Provider Alpha', 'NVIDIA RTX 4090 Cluster', true, 100.00, 97.80),
  ('DeltaNode9z3K7qR1vN9yT3bJ5cE6hZp1M8T4u4c2A5K4nZY4', 'GPU Provider Delta', '8x NVIDIA H100 SuperPOD', true, 100.00, 99.90)
ON CONFLICT (pubkey) DO NOTHING;`;

export const SchemaVisualizer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<'jobs' | 'providers' | 'agents'>('jobs');
  const [activeSchemaTab, setActiveSchemaTab] = useState<'database' | 'anchor' | 'rfc402' | 'sql'>('database');
  const [liveData, setLiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ jobs: 0, providers: 3, agents: 1 });
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [copiedSql, setCopiedSql] = useState(false);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-[#14F195]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Schema & Architecture Visualizer
                </h2>
                <span className={`tag-label px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  connectionStatus === 'connected' 
                    ? 'bg-[#14F195]/15 text-[#14F195] border-[#14F195]/30' 
                    : connectionStatus === 'checking'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-[#14F195] animate-ping' : connectionStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span>{connectionStatus === 'connected' ? 'Supabase Connected' : connectionStatus === 'checking' ? 'Connecting...' : 'Supabase Offline'}</span>
                </span>
              </div>
              <p className="text-sm text-white/60 mt-0.5">
                Interactive relational entity diagrams, on-chain Anchor PDA memory layout, and Supabase Realtime SQL migrations.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-white/[0.04] p-1.5 rounded-full border border-white/[0.1] text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveSchemaTab('database')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeSchemaTab === 'database' 
                ? 'bg-white text-[#0A0B10] font-semibold shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Database ERD
          </button>
          <button
            onClick={() => setActiveSchemaTab('sql')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeSchemaTab === 'sql' 
                ? 'bg-white text-[#0A0B10] font-semibold shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            SQL Migration
          </button>
          <button
            onClick={() => setActiveSchemaTab('anchor')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeSchemaTab === 'anchor' 
                ? 'bg-white text-[#0A0B10] font-semibold shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Anchor PDA Layout
          </button>
          <button
            onClick={() => setActiveSchemaTab('rfc402')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeSchemaTab === 'rfc402' 
                ? 'bg-white text-[#0A0B10] font-semibold shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            RFC-402 Schema
          </button>
        </div>
      </div>

      {/* View 1: Relational ERD View */}
      {activeSchemaTab === 'database' && (
        <div className="space-y-8">
          
          {/* Visual ERD Diagram */}
          <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white/50" />
                <span className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  Entity Relationship Diagram (PostgreSQL)
                </span>
              </div>
              <span className="text-xs font-mono text-white/40">
                Supabase Schema: public
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Table 1: Agents */}
              <div 
                onClick={() => setSelectedTable('agents')}
                className={`p-6 rounded-[24px] border transition-all cursor-pointer ${
                  selectedTable === 'agents' 
                    ? 'bg-white/[0.08] border-[#14F195] ring-2 ring-[#14F195]/20 shadow-xl' 
                    : 'bg-white/[0.03] border-white/[0.1] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                    <Table className="w-4 h-4 text-cyan-400" />
                    <span>public.agents</span>
                  </div>
                  <span className="tag-label px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70">
                    {counts.agents} rows
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-amber-400" /> id
                    </span>
                    <span className="text-white/40 text-[10px]">text (PK)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>owner_wallet</span>
                    <span className="text-white/40 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>vault_pda</span>
                    <span className="text-white/40 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>daily_limit</span>
                    <span className="text-white/40 text-[10px]">numeric</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>auto_approval_limit</span>
                    <span className="text-white/40 text-[10px]">numeric</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>spent_today</span>
                    <span className="text-white/40 text-[10px]">numeric</span>
                  </div>
                </div>
              </div>

              {/* Table 2: Jobs (Center Hub) */}
              <div 
                onClick={() => setSelectedTable('jobs')}
                className={`p-6 rounded-[24px] border transition-all cursor-pointer ${
                  selectedTable === 'jobs' 
                    ? 'bg-white/[0.08] border-[#14F195] ring-2 ring-[#14F195]/20 shadow-xl' 
                    : 'bg-white/[0.03] border-white/[0.1] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                    <Table className="w-4 h-4 text-[#14F195]" />
                    <span>public.jobs</span>
                  </div>
                  <span className="tag-label px-2 py-0.5 rounded-full bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
                    {counts.jobs} rows
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-amber-400" /> id
                    </span>
                    <span className="text-white/40 text-[10px]">text (PK)</span>
                  </div>
                  <div className="flex items-center justify-between text-cyan-300">
                    <span>agent_id</span>
                    <span className="text-white/40 text-[10px]">text (FK)</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-300">
                    <span>provider_id</span>
                    <span className="text-white/40 text-[10px]">text (FK)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>input_hash</span>
                    <span className="text-white/40 text-[10px]">text (SHA-256)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>output_hash</span>
                    <span className="text-white/40 text-[10px]">text (SHA-256)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14F195]">
                    <span>price</span>
                    <span className="text-white/40 text-[10px]">numeric (USDC)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>status</span>
                    <span className="text-white/40 text-[10px]">text (settled)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>escrow_pda</span>
                    <span className="text-white/40 text-[10px]">text (Solana)</span>
                  </div>
                </div>
              </div>

              {/* Table 3: Providers */}
              <div 
                onClick={() => setSelectedTable('providers')}
                className={`p-6 rounded-[24px] border transition-all cursor-pointer ${
                  selectedTable === 'providers' 
                    ? 'bg-white/[0.08] border-[#14F195] ring-2 ring-[#14F195]/20 shadow-xl' 
                    : 'bg-white/[0.03] border-white/[0.1] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                    <Table className="w-4 h-4 text-purple-400" />
                    <span>public.providers</span>
                  </div>
                  <span className="tag-label px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70">
                    {counts.providers} rows
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-amber-400" /> id
                    </span>
                    <span className="text-white/40 text-[10px]">text (PK)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>name</span>
                    <span className="text-white/40 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>wallet_address</span>
                    <span className="text-white/40 text-[10px]">text</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>gpu</span>
                    <span className="text-white/40 text-[10px]">text (A100/H100)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14F195]">
                    <span>price_per_request</span>
                    <span className="text-white/40 text-[10px]">numeric</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>stake_bond_amount</span>
                    <span className="text-white/40 text-[10px]">numeric (Bond)</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>reputation</span>
                    <span className="text-white/40 text-[10px]">int</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Foreign Keys: jobs.agent_id → agents.id | jobs.provider_id → providers.id</span>
              <span className="text-[#14F195] font-semibold">Click any card to inspect active dataset</span>
            </div>
          </div>

          {/* Live Data Query Inspector */}
          <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <span className="text-xs font-mono font-medium text-white/80">
                Live Query Inspector: <span className="text-[#14F195]">SELECT * FROM public.{selectedTable} LIMIT 10</span>
              </span>
              <button
                onClick={() => fetchTableData(selectedTable)}
                className="pill-ghost text-xs flex items-center gap-2 py-2 px-4 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Query</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-white/40">
                Querying Supabase PostgreSQL instance...
              </div>
            ) : liveData.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-white/40">
                No rows returned in public.{selectedTable}. Dispatch a task in Agent Console to populate rows.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72">
                <pre className="p-4 bg-black/40 rounded-[20px] border border-white/[0.08] text-xs font-mono text-white/80 leading-relaxed overflow-x-auto shadow-inner">
                  {JSON.stringify(liveData, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      )}

      {/* View 2: SQL Migration for Supabase Realtime */}
      {activeSchemaTab === 'sql' && (
        <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-[#14F195]">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Supabase Realtime Schema Migration
                </h3>
                <p className="text-xs text-white/50">
                  Ready-to-execute SQL script configuring enum types, tables, RLS policies, and realtime publications.
                </p>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="pill-cta text-xs py-2 px-4 flex items-center gap-2 cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-[#14F195]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-5 bg-black/40 rounded-[20px] border border-white/[0.08] font-mono text-xs text-white/80 leading-relaxed overflow-x-auto max-h-96 shadow-inner">
              {SUPABASE_MIGRATION_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* View 3: Anchor On-Chain PDA Schema */}
      {activeSchemaTab === 'anchor' && (
        <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-2">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Solana Program Derived Address (PDA) Account Memory Layout
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Exact binary space layout allocated on Solana Devnet for each autonomous job escrow
              </p>
            </div>
            <span className="tag-label px-3 py-1 rounded-full bg-[#14F195]/15 border border-[#14F195]/30 text-[#14F195]">
              Total Allocated Space: 112 Bytes
            </span>
          </div>

          <div className="bg-black/40 border border-white/[0.08] rounded-[20px] p-5 font-mono text-xs space-y-4 shadow-inner">
            <div className="text-white/40">// PDA Derivation Seeds (Deterministic Invariant)</div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[#14F195] space-y-1">
              <div>PublicKey::find_program_address(&[b"mesh_escrow", agent_pubkey.as_ref(), &job_id], &OPENMESH_PROGRAM_ID)</div>
              <div className="text-[11px] text-white/50">Program ID: <span className="text-white font-semibold">{OPENMESH_PROGRAM_ID.toBase58()}</span></div>
            </div>

            <div className="pt-2 text-white/40">// Account Struct: JobEscrow (InitSpace = 104 bytes + 8-byte discriminator)</div>
            <div className="space-y-2 pl-2 text-white/80">
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span className="text-purple-400 font-semibold">8-byte Anchor Discriminator</span>
                <span className="text-white/40">Offset: 0..8 (SHA256("account:JobEscrow")[..8])</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span>agent: Pubkey</span>
                <span className="text-white/40">32 bytes (Offset 8..40)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span>provider: Pubkey</span>
                <span className="text-white/40">32 bytes (Offset 40..72)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span className="text-[#14F195] font-semibold">amount: u64 (SPL-USDC micro-units)</span>
                <span className="text-white/40">8 bytes (Offset 72..80)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span>job_id: [u8; 16]</span>
                <span className="text-white/40">16 bytes (Offset 80..96)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span>timeout_slot: u64</span>
                <span className="text-white/40">8 bytes (Offset 96..104)</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] py-1.5">
                <span>bump: u8</span>
                <span className="text-white/40">1 byte (Offset 104..105)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>status: EscrowStatus (Locked=0, Settled=1, Refunded=2)</span>
                <span className="text-white/40">1 byte (Offset 105..106)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 4: RFC-402 Protocol Specification */}
      {activeSchemaTab === 'rfc402' && (
        <div className="glass-card p-6 sm:p-8 rounded-[28px] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-2">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                RFC-402 (HTTP 402 Payment Required) Header Contract
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                The open communication handshake between client agents and inference providers
              </p>
            </div>
            <span className="tag-label px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-cyan-400">
              x402 Specification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-5 bg-black/40 rounded-[20px] border border-white/[0.08] space-y-3 shadow-inner">
              <span className="text-amber-400 font-bold block">// 1. Provider 402 Response Schema</span>
              <pre className="text-white/80 text-[11px] overflow-x-auto leading-relaxed">
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

            <div className="p-5 bg-black/40 rounded-[20px] border border-white/[0.08] space-y-3 shadow-inner">
              <span className="text-[#14F195] font-bold block">// 2. Agent Authorization Header</span>
              <pre className="text-white/80 text-[11px] overflow-x-auto leading-relaxed">
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
