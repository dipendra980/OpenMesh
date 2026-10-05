import React from 'react';
import { ExternalLink, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Job } from '../types';
import { shortenAddress, getSolanaExplorerUrl } from '../lib/solana';

interface JobHistoryProps {
  jobs: Job[];
}

export const JobHistory: React.FC<JobHistoryProps> = ({ jobs }) => {
  return (
    <div className="space-y-5 text-left">
      
      {/* Header */}
      <div className="linear-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Solana Escrow & Job Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic receipts and on-chain settlement records for all autonomous inference jobs
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Settled Records: <span className="text-white font-medium">{jobs.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="linear-card rounded-xl overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-mono text-xs">
            No historical records registered yet. Dispatch a task from the Agent Console.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#0A0B10] border-b border-white/[0.06] text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Job Identifier</th>
                  <th className="px-4 py-3 font-medium">Model / Capability</th>
                  <th className="px-4 py-3 font-medium">Settled Amount</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {jobs.map(job => {
                  const isSettled = job.status === 'settled';
                  const isRefunded = job.status === 'refunded';

                  return (
                    <tr key={job.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <span>{job.id}</span>
                        {job.escrowPda && (
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                            PDA: {shortenAddress(job.escrowPda, 4)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-200 capitalize font-sans text-xs">
                          {job.taskType}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {job.modelId}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#14F195]">
                          ${job.price.toFixed(4)} USDC
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {job.verificationStatus === 'PASSED' ? (
                          <span className="flex items-center gap-1 text-[11px] text-[#14F195]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Passed</span>
                          </span>
                        ) : job.verificationStatus === 'FAILED' ? (
                          <span className="flex items-center gap-1 text-[11px] text-rose-400">
                            <RotateCcw className="w-3 h-3" />
                            <span>Slashed</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-medium border ${
                          isSettled
                            ? 'bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20'
                            : isRefunded
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          {job.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {job.completedAt || job.createdAt}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {job.transactionSignature ? (
                          <a
                            href={getSolanaExplorerUrl(job.transactionSignature, 'tx')}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#14F195] hover:underline text-[11px]"
                          >
                            <span>View TX</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
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
