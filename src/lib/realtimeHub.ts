import { supabase } from './supabase';
import type { Job, Provider } from '../types';

export type RealtimeMeshEvent = 
  | { type: 'JOB_LOCKED'; job: Job }
  | { type: 'JOB_PROCESSING'; jobId: string; workerPubkey: string }
  | { type: 'JOB_RESULT_SUBMITTED'; job: Job }
  | { type: 'JOB_SETTLED'; jobId: string; signature: string }
  | { type: 'JOB_SLASHED'; jobId: string; reason: string; refundSignature: string }
  | { type: 'WORKER_HEARTBEAT'; provider: Partial<Provider> };

type EventListener = (event: RealtimeMeshEvent) => void;

class RealtimeHub {
  private listeners: Set<EventListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('openmesh_realtime_bus');
      this.broadcastChannel.onmessage = (msgEvent) => {
        if (msgEvent.data && msgEvent.data.type) {
          this.notifyListeners(msgEvent.data);
        }
      };
    }
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    if (!this.isListening) {
      this.startListening();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeMeshEvent) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('[RealtimeHub] Listener error:', err);
      }
    });
  }

  public emit(event: RealtimeMeshEvent) {
    // 1. Local window listeners
    this.notifyListeners(event);

    // 2. Cross-tab BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch {
        // ignore
      }
    }

    // 3. Supabase Realtime broadcast or DB upsert
    if (supabase) {
      try {
        if (this.supabaseChannel) {
          this.supabaseChannel.send({
            type: 'broadcast',
            event: event.type,
            payload: event,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  private startListening() {
    this.isListening = true;

    try {
      // Connect to Supabase Realtime channel
      this.supabaseChannel = supabase
        .channel('openmesh_realtime_room')
        .on('broadcast', { event: '*' }, (payload: any) => {
          if (payload && payload.payload) {
            this.notifyListeners(payload.payload);
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mesh_jobs' },
          (payload: any) => {
            this.handlePostgresJobChange(payload);
          }
        )
        .subscribe((status: string) => {
          console.log('[RealtimeHub] Supabase subscription status:', status);
        });
    } catch (err) {
      console.warn('[RealtimeHub] Supabase realtime connection notice:', err);
    }
  }

  private handlePostgresJobChange(payload: any) {
    const row = payload.new;
    if (!row) return;

    const mappedJob: Partial<Job> = {
      id: row.job_id,
      prompt: row.prompt,
      taskType: row.capability,
      modelId: row.groq_model,
      price: Number(row.cost_usdc),
      status: row.status,
      escrowPda: row.escrow_pda,
      outputResult: row.output_text,
      outputHash: row.sha256_digest,
      providerSignature: row.ed25519_signature,
      verificationStatus: row.verification_passed === true ? 'PASSED' : row.verification_passed === false ? 'FAILED' : 'PENDING',
      failureReason: row.failure_reason,
    };

    if (row.status === 'escrow_locked') {
      this.notifyListeners({ type: 'JOB_LOCKED', job: mappedJob as Job });
    } else if (row.status === 'result_submitted') {
      this.notifyListeners({ type: 'JOB_RESULT_SUBMITTED', job: mappedJob as Job });
    } else if (row.status === 'settled') {
      this.notifyListeners({ type: 'JOB_SETTLED', jobId: row.job_id, signature: row.transaction_signature || '' });
    } else if (row.status === 'slashed') {
      this.notifyListeners({ type: 'JOB_SLASHED', jobId: row.job_id, reason: row.failure_reason || '', refundSignature: '' });
    }
  }
}

export const realtimeHub = new RealtimeHub();
