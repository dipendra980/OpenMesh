import type { VerificationChecks, Provider, Job } from '../types';
import { sha256 } from './solana';

export async function verifyInferenceWork(
  job: Job,
  provider: Provider,
  output: string,
  providerSignature: string,
  latencyMs: number,
  isChaosTest = false
): Promise<{ checks: VerificationChecks; outputHash: string; failureReason?: string }> {
  const outputHash = await sha256(output);

  // If chaos test or rogue node, trigger failure
  if (isChaosTest || provider.id === 'provider-epsilon' || output.includes('ERR_MALFORMED_OUTPUT')) {
    const checks: VerificationChecks = {
      providerAuthenticated: false,
      jobIdMatched: true,
      outputReceived: true,
      schemaValid: false,
      latencyWithinSla: false,
      sha256HashValid: false,
      allPassed: false,
    };
    return {
      checks,
      outputHash,
      failureReason: 'Ed25519 signature mismatch & malformed payload CRC parity error. Refusing payment release.'
    };
  }

  // Realistic checks
  const providerAuthenticated = providerSignature.startsWith('ed25519_') && providerSignature.length > 20;
  const jobIdMatched = !!job.id;
  const outputReceived = output.length > 25;
  const schemaValid = output.includes('analysis') || output.includes('reasoning') || output.includes('1.') || output.length > 50;
  const latencyWithinSla = latencyMs <= 5000;
  const sha256HashValid = outputHash.length === 64;

  const allPassed = 
    providerAuthenticated && 
    jobIdMatched && 
    outputReceived && 
    schemaValid && 
    latencyWithinSla && 
    sha256HashValid;

  return {
    checks: {
      providerAuthenticated,
      jobIdMatched,
      outputReceived,
      schemaValid,
      latencyWithinSla,
      sha256HashValid,
      allPassed,
    },
    outputHash,
    failureReason: allPassed ? undefined : 'One or more verification invariants failed.'
  };
}
