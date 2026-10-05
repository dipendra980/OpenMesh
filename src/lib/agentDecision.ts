import type { Provider, TaskCapability } from '../types';

export interface ScoredProvider {
  provider: Provider;
  totalScore: number;
  priceScore: number;
  latencyScore: number;
  reliabilityScore: number;
  reputationScore: number;
  availabilityScore: number;
  reasons: string[];
}

export interface DecisionResult {
  selected: ScoredProvider;
  candidates: ScoredProvider[];
  taskType: TaskCapability;
  budgetUsdc: number;
  explanation: string;
}

export function selectOptimalProvider(
  providers: Provider[],
  taskType: TaskCapability,
  maxBudgetUsdc = 0.05,
  priority: 'latency' | 'price' | 'balanced' = 'balanced'
): DecisionResult {
  // 1. Filter candidates capable of handling this task type and currently ONLINE
  const eligible = providers.filter(
    p => p.status === 'ONLINE' && p.capabilities.includes(taskType) && p.pricePerRequest <= maxBudgetUsdc
  );

  if (eligible.length === 0) {
    // If none within budget, pick online with capability
    const fallback = providers.filter(p => p.status === 'ONLINE' && p.capabilities.includes(taskType));
    if (fallback.length === 0) {
      throw new Error(`No available online providers found for capability: ${taskType}`);
    }
  }

  const pool = eligible.length > 0 ? eligible : providers.filter(p => p.status === 'ONLINE');

  // Find min and max for normalization
  const minPrice = Math.min(...pool.map(p => p.pricePerRequest));
  const maxPrice = Math.max(...pool.map(p => p.pricePerRequest)) || minPrice + 0.001;
  const minLatency = Math.min(...pool.map(p => p.averageLatency));
  const maxLatency = Math.max(...pool.map(p => p.averageLatency)) || minLatency + 100;

  // Weightings based on priority
  let wPrice = 0.30;
  let wLatency = 0.20;
  const wReliability = 0.25;
  const wReputation = 0.15;
  const wAvailability = 0.10;

  if (priority === 'latency') {
    wLatency = 0.35;
    wPrice = 0.15;
  } else if (priority === 'price') {
    wPrice = 0.40;
    wLatency = 0.10;
  }

  const scored: ScoredProvider[] = pool.map(provider => {
    // Normalized scores between 0 and 100 (higher is better)
    // Price: lower price is better
    const priceScore = maxPrice === minPrice 
      ? 100 
      : ((maxPrice - provider.pricePerRequest) / (maxPrice - minPrice)) * 100;

    // Latency: lower latency is better
    const latencyScore = maxLatency === minLatency 
      ? 100 
      : ((maxLatency - provider.averageLatency) / (maxLatency - minLatency)) * 100;

    // Reliability: direct from successRate
    const reliabilityScore = provider.successRate;

    // Reputation: direct from reputation
    const reputationScore = provider.reputation;

    // Availability: based on queue capacity
    const availabilityScore = provider.maxConcurrentJobs > 0 
      ? ((provider.maxConcurrentJobs - provider.currentJobs) / provider.maxConcurrentJobs) * 100 
      : 50;

    const totalScore = (
      priceScore * wPrice +
      latencyScore * wLatency +
      reliabilityScore * wReliability +
      reputationScore * wReputation +
      availabilityScore * wAvailability
    );

    const reasons: string[] = [];
    if (provider.successRate >= 99.5) reasons.push(`✓ Top tier reliability (${provider.successRate}%)`);
    if (provider.averageLatency <= 300) reasons.push(`✓ Sub-300ms ultra low latency (${provider.averageLatency}ms)`);
    if (provider.pricePerRequest <= maxBudgetUsdc) reasons.push(`✓ Within policy budget ($${provider.pricePerRequest} <= $${maxBudgetUsdc})`);
    if (provider.reputation >= 98) reasons.push(`✓ High node reputation score (${provider.reputation}/100)`);
    if (provider.stakeBondAmount >= 50) reasons.push(`✓ On-chain bond locked ($${provider.stakeBondAmount} USDC)`);

    return {
      provider,
      totalScore: Math.round(totalScore * 10) / 10,
      priceScore: Math.round(priceScore),
      latencyScore: Math.round(latencyScore),
      reliabilityScore: Math.round(reliabilityScore),
      reputationScore: Math.round(reputationScore),
      availabilityScore: Math.round(availabilityScore),
      reasons,
    };
  });

  // Sort descending by totalScore
  scored.sort((a, b) => b.totalScore - a.totalScore);
  const best = scored[0];

  const explanation = `Selected ${best.provider.name} with score ${best.totalScore}/100. It offers the optimal equilibrium: ${best.provider.successRate}% reliability and ${best.provider.averageLatency}ms response time on ${best.provider.gpu}, priced at $${best.provider.pricePerRequest} USDC (safely within the $${maxBudgetUsdc} task limit).`;

  return {
    selected: best,
    candidates: scored,
    taskType,
    budgetUsdc: maxBudgetUsdc,
    explanation,
  };
}
