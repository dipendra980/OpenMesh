-- =========================================================================
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
ON CONFLICT (pubkey) DO NOTHING;
