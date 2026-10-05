import { createClient } from '@supabase/supabase-js';
import type { Job, Provider, AgentPolicy } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qkjdvjcfotbwzopmazta.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Persist completed/refunded inference job to Supabase
 */
export async function saveJobToSupabase(job: Job): Promise<boolean> {
  try {
    const { error } = await supabase.from('jobs').upsert({
      id: job.id,
      agent_id: job.agentId,
      provider_id: job.providerId || null,
      task_type: job.taskType,
      prompt: job.prompt,
      image_url: job.imageUrl || null,
      input_hash: job.inputHash,
      output_result: job.outputResult || null,
      output_hash: job.outputHash || null,
      price: job.price,
      status: job.status,
      verification_status: job.verificationStatus,
      escrow_pda: job.escrowPda || null,
      transaction_signature: job.transactionSignature || null,
      refund_signature: job.refundSignature || null,
      created_at: new Date().toISOString(),
      completed_at: job.completedAt ? new Date().toISOString() : null,
    });

    if (error) {
      console.warn('[Supabase] Note: Job not stored (create table if needed):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Sync skipped:', err);
    return false;
  }
}

/**
 * Fetch recorded jobs from Supabase
 */
export async function fetchJobsFromSupabase(): Promise<Job[] | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((d: any) => ({
      id: d.id,
      agentId: d.agent_id,
      providerId: d.provider_id,
      modelId: 'Llama-3.2-Vision',
      taskType: d.task_type,
      prompt: d.prompt,
      imageUrl: d.image_url,
      inputHash: d.input_hash,
      outputResult: d.output_result,
      outputHash: d.output_hash,
      price: Number(d.price),
      status: d.status,
      verificationStatus: d.verification_status,
      escrowPda: d.escrow_pda,
      transactionSignature: d.transaction_signature,
      refundSignature: d.refund_signature,
      createdAt: d.created_at,
      completedAt: d.completed_at,
    }));
  } catch {
    return null;
  }
}

/**
 * Persist agent spending policy
 */
export async function saveAgentPolicyToSupabase(agentId: string, ownerWallet: string, policy: AgentPolicy) {
  try {
    await supabase.from('agents').upsert({
      id: agentId,
      owner_wallet: ownerWallet,
      vault_pda: policy.vaultPda,
      daily_limit: policy.dailyLimit,
      auto_approval_limit: policy.autoApprovalLimit,
      spent_today: policy.spentToday,
    });
  } catch (err) {
    console.warn('[Supabase] Agent policy sync skipped:', err);
  }
}

/**
 * Seed or update provider registry in Supabase
 */
export async function syncProvidersToSupabase(providers: Provider[]) {
  try {
    const payload = providers.map(p => ({
      id: p.id,
      name: p.name,
      wallet_address: p.walletAddress,
      gpu: p.gpu,
      models: p.models,
      price_per_request: p.pricePerRequest,
      average_latency: p.averageLatency,
      success_rate: p.successRate,
      reputation: p.reputation,
      status: p.status,
      stake_bond_amount: p.stakeBondAmount,
      today_revenue: p.todayRevenue,
    }));

    await supabase.from('providers').upsert(payload);
  } catch (err) {
    console.warn('[Supabase] Providers sync skipped:', err);
  }
}
