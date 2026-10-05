import type { Provider } from '../types';

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'provider-beta',
    name: 'GPU Provider Beta',
    walletAddress: 'BetnQreC62drrMkaF7urZT53bbDdqSx4uk42CPzbL2aN',
    gpu: 'NVIDIA A100 (80GB SXM4)',
    models: ['Llama-3.2-11B-Vision', 'Qwen2-VL-72B', 'Whisper-Large-v3'],
    capabilities: ['vision', 'llm', 'audio'],
    pricePerRequest: 0.005,
    averageLatency: 280, // ms
    successRate: 99.8,
    reputation: 99,
    status: 'ONLINE',
    completedJobs: 4892,
    failedJobs: 6,
    todayRevenue: 24.46,
    stakeBondAmount: 100, // 100 USDC bonded
    maxConcurrentJobs: 16,
    currentJobs: 2,
  },
  {
    id: 'provider-alpha',
    name: 'GPU Provider Alpha',
    walletAddress: '6ZkHCYPNJhK4uH1UJPdPpFZyEZf7xxMGxLrLeAjGMN8N',
    gpu: 'NVIDIA RTX 4090 (24GB)',
    models: ['Llama-3.2-11B-Vision', 'DeepSeek-Coder-V2'],
    capabilities: ['vision', 'llm', 'code'],
    pricePerRequest: 0.003,
    averageLatency: 420, // ms
    successRate: 99.2,
    reputation: 97,
    status: 'ONLINE',
    completedJobs: 1842,
    failedJobs: 14,
    todayRevenue: 18.42,
    stakeBondAmount: 50,
    maxConcurrentJobs: 8,
    currentJobs: 1,
  },
  {
    id: 'provider-gamma',
    name: 'GPU Provider Gamma',
    walletAddress: 'ByNjm2PVLbgzKWvik7FQKMMveQUYJmZZkjmpjR4919Dg',
    gpu: 'NVIDIA RTX 3090 (24GB)',
    models: ['Vision-Model-X', 'Mistral-7B-Instruct'],
    capabilities: ['vision', 'llm'],
    pricePerRequest: 0.002,
    averageLatency: 610, // ms
    successRate: 97.8,
    reputation: 91,
    status: 'ONLINE',
    completedJobs: 924,
    failedJobs: 21,
    todayRevenue: 7.15,
    stakeBondAmount: 25,
    maxConcurrentJobs: 4,
    currentJobs: 0,
  },
  {
    id: 'provider-delta',
    name: 'GPU Provider Delta (Enterprise)',
    walletAddress: '5vs9ZiqoJr14Rntqk63EG4Qg5Q5Xjz8oocScfUjc2ciW',
    gpu: '8x NVIDIA H100 SXM5',
    models: ['DeepSeek-R1-Reasoning', 'Llama-3.3-70B', 'BGE-Large-Embeddings'],
    capabilities: ['llm', 'embeddings', 'code'],
    pricePerRequest: 0.012,
    averageLatency: 190,
    successRate: 99.9,
    reputation: 100,
    status: 'ONLINE',
    completedJobs: 12840,
    failedJobs: 2,
    todayRevenue: 89.20,
    stakeBondAmount: 500,
    maxConcurrentJobs: 64,
    currentJobs: 7,
  },
  {
    id: 'provider-epsilon',
    name: 'Rogue Node Epsilon (Chaos Monkey)',
    walletAddress: '2ZCCjapyJQ7n7vo772U1aC6QQbS2sheGPqPqFuBGuRGV',
    gpu: 'GTX 1080 Ti (Unstable Overclock)',
    models: ['Faulty-Vision-0.1'],
    capabilities: ['vision'],
    pricePerRequest: 0.001,
    averageLatency: 1450,
    successRate: 64.2,
    reputation: 45,
    status: 'ONLINE',
    completedJobs: 312,
    failedJobs: 174,
    todayRevenue: 1.12,
    stakeBondAmount: 10,
    maxConcurrentJobs: 2,
    currentJobs: 0,
  }
];

export interface InferenceResult {
  output: string;
  latencyMs: number;
  providerSignature: string;
  isSimulatedFailure?: boolean;
}

/**
 * Execute simulated inference from the selected provider
 */
export async function executeInference(
  provider: Provider,
  prompt: string,
  imageUrl?: string,
  isChaosTest = false
): Promise<InferenceResult> {
  // If chaos test or rogue node, return a deliberate failure
  if (isChaosTest || provider.id === 'provider-epsilon') {
    await new Promise(r => setTimeout(r, 800));
    return {
      output: 'ERR_MALFORMED_OUTPUT: Hardware CRC parity mismatch on CUDA stream 0. Garbage tokens generated.',
      latencyMs: 1450,
      providerSignature: 'INVALID_SIGNATURE_0x000000000000000000000000000000',
      isSimulatedFailure: true
    };
  }

  // Realistic latency simulation based on provider's benchmark
  const jitter = Math.floor((Math.random() - 0.5) * 60);
  const actualLatency = Math.max(120, provider.averageLatency + jitter);
  await new Promise(r => setTimeout(r, Math.min(actualLatency * 2, 1200)));

  let outputText = '';
  if (imageUrl || prompt.toLowerCase().includes('image') || prompt.toLowerCase().includes('analyze')) {
    outputText = `Visual scene analysis completed with ${provider.models[0]}:
1. Environment: Urban downtown street corner, late afternoon daylight, dry asphalt conditions.
2. Detected Objects:
   • 3 Pedestrians (bounding boxes: [y:0.42, x:0.18, w:0.08, h:0.24] - confidence 98.4%)
   • 2 Autonomous EV shuttles (bounding boxes: [y:0.51, x:0.35, w:0.28, h:0.31] - confidence 99.1%)
   • Active traffic signal (Status: GREEN, confidence 99.8%)
   • Architectural facade: Modern commercial steel & glass structure.
3. Optical Safety Metrics: Zero occlusion hazards detected on forward corridor path.`;
  } else {
    outputText = `Deep reasoning inference completed with ${provider.models[0]}:
• Autonomous task breakdown verified against OpenMesh RFC-402 protocol specification.
• Execution pipeline latency: ${actualLatency}ms on ${provider.gpu}.
• Mathematical confidence: 99.85%. Verification signature generated using Provider Ed25519 node keypair.`;
  }

  // Generate synthetic provider Ed25519 signature
  const providerSignature = `ed25519_${provider.walletAddress.slice(0, 10)}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

  return {
    output: outputText,
    latencyMs: actualLatency,
    providerSignature,
  };
}
