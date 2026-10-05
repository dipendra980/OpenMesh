import { useState, useEffect } from 'react';
import { Header, type AppTab } from './components/Header';
import { AgentConsole } from './components/AgentConsole';
import { WorkerCockpit } from './components/WorkerCockpit';
import { ProviderMarketplace } from './components/ProviderMarketplace';
import { NetworkTelemetry } from './components/NetworkTelemetry';
import { JobHistory } from './components/JobHistory';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { AgentVaultModal } from './components/AgentVaultModal';
import { INITIAL_PROVIDERS } from './lib/providers';
import type { Provider, Job, AgentPolicy } from './types';
import { deriveEscrowPda } from './lib/solana';
import { 
  saveJobToSupabase, 
  fetchJobsFromSupabase, 
  saveAgentPolicyToSupabase 
} from './lib/supabase';

const DEFAULT_MASTER_WALLET = '7rtTNBNqQ4N6NH5d5AdRFQYRsr5gz2q3ZVpgesGaZxpo';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('console');
  
  // Wallet states
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState(DEFAULT_MASTER_WALLET);
  const [solBalance] = useState(0.42);
  const [usdcBalance, setUsdcBalance] = useState(48.25);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Providers list
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);

  // Agent Policy Vault
  const [agentPolicy, setAgentPolicy] = useState<AgentPolicy>({
    dailyLimit: 10.0,
    perTaskLimit: 1.0,
    autoApprovalLimit: 0.10,
    spentToday: 0.015,
    sessionKeyActive: true,
    sessionExpiresAt: '23h 48m remaining',
    vaultPda: deriveEscrowPda(DEFAULT_MASTER_WALLET, 'vault_primary'),
  });

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Completed jobs history
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 'job_8392_alpha',
      agentId: 'agent_primary_01',
      providerId: 'provider-beta',
      modelId: 'Llama-3.2-11B-Vision',
      taskType: 'vision',
      prompt: 'Analyze high-resolution urban street camera feed for obstacle identification.',
      inputHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      price: 0.005,
      status: 'settled',
      verificationStatus: 'PASSED',
      transactionSignature: '5K4nZY4jQ8W1mN9vX2P7qL1w8T6yZ4bJ9cE6hZp1M8T4u4c2A5k9h7rY2mK7qR1vN9yT3bJ5cE6hZp1M8T4u4c2A',
      escrowPda: '7h4MSPwpZV3tk76ZpFHs2LZPKeLw3Uaja6oF6vQfkiJo',
      createdAt: '12:42:31',
      completedAt: '12:42:32',
    },
    {
      id: 'job_8391_beta',
      agentId: 'agent_primary_01',
      providerId: 'provider-beta',
      modelId: 'Llama-3.2-11B-Vision',
      taskType: 'vision',
      prompt: 'Detect structural degradation along suspension bridge cables.',
      inputHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      price: 0.005,
      status: 'settled',
      verificationStatus: 'PASSED',
      transactionSignature: '3xP7qL1w8T6yZ4bJ9cE6hZp1M8T4u4c2A5k9h7rY2mK7qR1vN9yT3bJ5cE6hZp1M8T4u4c2A5K4nZY4jQ8W1mN9vX2',
      escrowPda: '7h4MSPwpZV3tk76ZpFHs2LZPKeLw3Uaja6oF6vQfkiJo',
      createdAt: '12:40:15',
      completedAt: '12:40:18',
    }
  ]);

  // Sync with Supabase on mount
  useEffect(() => {
    fetchJobsFromSupabase().then(dbJobs => {
      if (dbJobs && dbJobs.length > 0) {
        setJobs(prev => {
          const ids = new Set(prev.map(j => j.id));
          const newUnique = dbJobs.filter(j => !ids.has(j.id));
          return [...prev, ...newUnique];
        });
      }
    });
  }, []);

  const handleJobCompleted = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    if (newJob.status === 'settled') {
      setUsdcBalance(prev => Math.max(0, prev - newJob.price));
    }
    // Async persist to Supabase
    saveJobToSupabase(newJob);
  };

  const handleUpdatePolicy = (newPolicy: AgentPolicy) => {
    setAgentPolicy(newPolicy);
    saveAgentPolicyToSupabase('agent_primary_01', walletAddress, newPolicy);
  };

  const handleConnectWallet = () => {
    setWalletConnected(true);
    setWalletAddress(DEFAULT_MASTER_WALLET);
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-[#EDEDED] flex flex-col selection:bg-[#14F195]/20 selection:text-[#14F195] relative overflow-x-hidden">
      
      {/* Atmospheric Gradient Mesh (Underlay) */}
      <div className="ambient-mesh" aria-hidden="true">
        <div className="glow-cyan" />
        <div className="glow-violet" />
        <div className="glow-rose" />
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        solBalance={solBalance}
        usdcBalance={usdcBalance}
        connectWallet={handleConnectWallet}
        disconnectWallet={handleDisconnectWallet}
        agentPolicy={agentPolicy}
        onOpenVaultSettings={() => setIsVaultModalOpen(true)}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 relative z-10">
        
        {/* Tab 1: Agent / User Console */}
        {activeTab === 'console' && (
          <AgentConsole
            providers={providers}
            setProviders={setProviders}
            agentPolicy={agentPolicy}
            setAgentPolicy={setAgentPolicy}
            onJobCompleted={handleJobCompleted}
            walletAddress={walletAddress}
            isDemoMode={isDemoMode}
          />
        )}

        {/* Tab 2: Worker / GPU Operator Cockpit */}
        {activeTab === 'worker' && (
          <WorkerCockpit
            provider={providers[0]}
            onUpdateProvider={(updated) => {
              setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
            }}
          />
        )}

        {/* Ecosystem Sub-Tabs */}
        {activeTab === 'marketplace' && (
          <ProviderMarketplace
            providers={providers}
            onSelectProvider={() => {
              setActiveTab('console');
            }}
          />
        )}

        {activeTab === 'network' && (
          <NetworkTelemetry />
        )}

        {activeTab === 'schema' && (
          <SchemaVisualizer />
        )}

        {activeTab === 'history' && (
          <JobHistory jobs={jobs} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 sm:px-6 lg:px-10 text-xs font-mono text-slate-400">
        <div className="hairline-divider mb-6 max-w-[1200px] mx-auto" />
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
            <span className="text-white/80 font-medium font-display">OpenMesh Protocol v1.1.0 · Solana Devnet</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Groq Cloud Sub-Second</span>
            <span>·</span>
            <span>Ed25519 Signatures</span>
            <span>·</span>
            <span>Supabase Realtime</span>
            <span>·</span>
            <span>Session Key Vault</span>
          </div>
        </div>
      </footer>

      {/* Vault Modal */}
      <AgentVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        policy={agentPolicy}
        onUpdatePolicy={handleUpdatePolicy}
      />

    </div>
  );
}

export default App;
