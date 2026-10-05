import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Code } from 'lucide-react';
import type { AgentLog, Http402Detail } from '../types';

interface AgentActivityTerminalProps {
  logs: AgentLog[];
  http402Detail?: Http402Detail | null;
  onClearLogs?: () => void;
}

export const AgentActivityTerminal: React.FC<AgentActivityTerminalProps> = ({
  logs,
  http402Detail,
  onClearLogs: _onClearLogs,
}) => {
  const [activeView, setActiveView] = useState<'stream' | 'x402'>('stream');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message} ${l.detail || ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const getBadgeStyle = (level: AgentLog['level']) => {
    switch (level) {
      case 'agent':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'chain':
        return 'text-[#14F195] bg-[#14F195]/10 border-[#14F195]/20';
      case 'verify':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'success':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'error':
        return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default:
        return 'text-slate-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="glass-card rounded-[28px] flex flex-col h-[420px] overflow-hidden shadow-2xl text-left">
      
      {/* Terminal Title Bar */}
      <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-3.5 h-3.5 text-[#14F195]" />
          <span className="text-xs font-mono font-semibold text-white">
            Autonomous Stream Console
          </span>
          <span className="text-[10px] font-mono text-white/40">
            ({logs.length} telemetry events)
          </span>
        </div>

        {/* Tab & Copy */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/[0.04] p-1 rounded-full border border-white/[0.10] text-[10px] font-mono">
            <button
              onClick={() => setActiveView('stream')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeView === 'stream' ? 'bg-white text-[#0A0B10] font-bold shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Stream
            </button>
            <button
              onClick={() => setActiveView('x402')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'x402' ? 'bg-[#14F195] text-black font-bold shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>x402 Raw</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#14F195]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main View */}
      {activeView === 'stream' ? (
        <div
          ref={scrollRef}
          className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-2 bg-black/20 select-text"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#14F195] animate-ping mb-2" />
              <span>Awaiting autonomous task dispatch...</span>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed py-0.5 group">
                <span className="text-[10px] text-white/40 select-none pt-0.5 font-mono">
                  {log.timestamp}
                </span>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-mono select-none ${getBadgeStyle(log.level)}`}>
                  {log.level}
                </span>
                <div className="flex-1 text-white/80 text-[11px]">
                  <span>{log.message}</span>
                  {log.detail && (
                    <div className="text-[10px] text-white/60 font-mono mt-1 bg-white/[0.03] p-2 rounded-xl border border-white/[0.06] break-all">
                      {log.detail}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* x402 Header View */
        <div className="flex-1 p-5 font-mono text-xs overflow-y-auto bg-black/20 text-white/80 space-y-3">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
              1. Outgoing Agent Request
            </div>
            <pre className="p-2 rounded bg-[#0E1017] border border-white/[0.06] text-[10px] text-slate-300 overflow-x-auto">
{`GET /v1/inference?model=llama-3.2-vision HTTP/1.1
Host: api.provider-beta.openmesh.net
User-Agent: OpenMesh-Agent/1.0.4`}
            </pre>
          </div>

          <div>
            <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">
              2. Provider Challenge (HTTP 402 Payment Required)
            </div>
            <pre className="p-2 rounded bg-[#0E1017] border border-white/[0.06] text-[10px] text-amber-300/90 overflow-x-auto">
{`HTTP/1.1 402 Payment Required
X-Payment-Protocol: solana-spl-usdc-escrow
X-Price-Micro-USDC: ${http402Detail ? http402Detail.priceMicroUsdc : 5000} ($0.005 USDC)
X-Escrow-Program: 4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz
X-Required-PDA-Seeds: ["mesh_escrow", agent_pubkey, job_id]`}
            </pre>
          </div>

          <div>
            <div className="text-[10px] text-[#14F195] uppercase font-bold mb-1">
              3. Retry with Solana Escrow Receipt
            </div>
            <pre className="p-2 rounded bg-[#0E1017] border border-white/[0.06] text-[10px] text-cyan-300/90 overflow-x-auto">
{`POST /v1/inference HTTP/1.1
Host: api.provider-beta.openmesh.net
Authorization: Solana-Escrow-Proof ${http402Detail?.receiptHeader || '5K4nZ...settled'}
X-Job-ID: ${http402Detail?.escrowPda ? http402Detail.escrowPda.slice(0, 16) : 'job_8392_alpha'}`}
            </pre>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3.5 py-1.5 bg-[#0A0B10] border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Channel: Devnet Websocket</span>
        <span>Escrow Finality: &lt;400ms</span>
      </div>

    </div>
  );
};
