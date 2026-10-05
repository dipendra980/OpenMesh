import React from 'react';
import { ExternalLink, CheckCircle2, RotateCcw, Clock, ScrollText } from 'lucide-react';
import type { Job } from '../types';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';

interface JobHistoryProps {
  jobs: Job[];
}

export const JobHistory: React.FC<JobHistoryProps> = ({ jobs }) => {
  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-[#14F195]">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Solana Escrow & Job Ledger
                </h2>
                <span className="tag-label px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-white">
                  Immutable Records
                </span>
              </div>
              <p className="text-sm text-white/60 mt-0.5">
                Cryptographic receipts, verification signatures, and on-chain settlement transactions for all autonomous inference runs.
              </p>
            </div>
          </div>
        </div>

        <div className="tag-label px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.1] text-white/70 font-mono text-xs">
          Total Settled Records: <span className="text-[#14F195] font-bold text-sm ml-1">{jobs.length}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] overflow-hidden space-y-4">
        {jobs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-white/40">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-white/60">
              No historical records registered yet.
            </p>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Dispatch an autonomous inference job from the Agent Console to view on-chain Anchor escrow settlement logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-white/[0.08] text-white/40 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Job Identifier</th>
                  <th className="px-5 py-3.5 font-semibold">Model / Capability</th>
                  <th className="px-5 py-3.5 font-semibold">Settled Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Verification Gate</th>
                  <th className="px-5 py-3.5 font-semibold">Escrow State</th>
                  <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-white/80">
                {jobs.map(job => {
                  const isSettled = job.status === 'settled';
                  const isRefunded = job.status === 'refunded';

                  return (
                    <tr key={job.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-5 py-4 font-bold text-white">
                        <span>{job.id}</span>
                        {job.escrowPda && (
                          <div className="text-[11px] text-white/40 font-normal mt-0.5">
                            PDA: {shortenAddress(job.escrowPda, 4)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-white capitalize font-sans text-xs font-semibold">
                          {job.taskType}
                        </div>
                        <div className="text-[11px] text-white/40">
                          {job.modelId}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-[#14F195] text-sm">
                          ${job.price.toFixed(4)} <span className="text-xs text-white/40">USDC</span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {job.verificationStatus === 'PASSED' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14F195] bg-[#14F195]/10 px-2.5 py-1 rounded-full border border-[#14F195]/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : job.verificationStatus === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Slashed</span>
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">Pending</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`tag-label px-2.5 py-1 rounded-full border ${
                          isSettled
                            ? 'bg-[#14F195]/15 text-[#14F195] border-[#14F195]/30'
                            : isRefunded
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {job.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-white/50 text-xs">
                        {job.completedAt || job.createdAt}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {job.transactionSignature ? (
                          <a
                            href={getSolanaExplorerUrl(job.transactionSignature, 'tx')}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#14F195] hover:text-[#14F195]/80 font-semibold text-xs transition-colors"
                          >
                            <span>Solana TX</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
