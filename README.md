# OpenMesh (powered by AgentSettle)

> **The Economic Infrastructure for Autonomous AI Agents on Solana.**

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana&logoColor=black)](https://solana.com)
[![RFC-402 Compliant](https://img.shields.io/badge/Standard-RFC--402%20%2F%20x402-blue)](https://www.rfc-editor.org/rfc/rfc9110#section-15.5.3)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Styles-Tailwind%20v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## 💡 Executive Summary & Thesis

Autonomous AI agents cannot pass KYC, enter corporate banking relationships, or sign credit card authorization forms. Traditional payment rails fail because:
1. **The Human-in-the-Loop Bottleneck:** Requiring a human signature for every $0.005 micro-inference completely invalidates agent autonomy.
2. **The Naive Transfer Trap:** Standard wallet-to-wallet transfers after execution lack escrow enforcement, leading to non-delivery or token fraud.
3. **The Fraud Surface:** Rogue or degraded nodes can return hallucinated junk tokens ("Lorem Ipsum" fraud) and steal inference payments.

**OpenMesh** fixes this with a Solana-native, autonomous Machine-to-Machine (M2M) compute clearinghouse built on the **RFC-402 (`402 Payment Required`)** protocol standard.

---

## ⚙️ Core Architecture & Innovations

```
[ Autonomous Agent Runtime ]
             │
      (1) Task Request
             ▼
[ Policy Vault Engine ] ──(Exceeds $0.10)──► [ Human Master Wallet Escalation ]
             │ (Under $0.10 Auto-Sign)
             ▼
[ Multi-Factor Node Routing ] (Scores Latency, Price, Reputation, GPU Specs)
             │
             ├──(2) Lock SPL-USDC──► [ Solana Program Derived Address (PDA) ]
             ▼                          [ Seed: b"mesh_escrow", agent, jobId ]
[ Selected GPU Provider Node ]
             │ (Returns Output + Ed25519 Signature + Token Digest)
             ▼
[ 6-Point Cryptographic Verification ]
      ├── 1. Ed25519 Payload Signature Authenticated
      ├── 2. Job ID & Deterministic PDA Matching
      ├── 3. Non-Empty Token Density Verification
      ├── 4. Schema & Format Structural Conformance
      ├── 5. Latency SLA Verification (< 5,000ms)
      └── 6. SHA-256 Digest Verification Against Receipt
             │
     ┌───────┴───────┐
  [PASS]          [FAIL]
     │               │
     ▼               ▼
Release USDC     Slash Stake Bond ($100 USDC)
to Provider      & 100% Refund to Agent Vault
```

### 1. Delegated Session Key Policy Vault
* Ephemeral Ed25519 session keys operate with fixed deterministic bounds: **$10.00 Daily Budget Cap**, **$0.10 Auto-Approval Ceiling**, and contract-level program whitelisting.
* Sub-$0.10 micro-inference tasks sign in <400ms with zero human prompts. Any high-ticket compute ($0.45+) escalates to human-in-the-loop review.

### 2. Deterministic Escrow State Machine
* Escrows derive deterministically using Solana PDA seeds: `[b"mesh_escrow", agentPubkey, jobId]`.
* Funds are strictly non-custodial: only programmatic verification or timeout invariants can release or refund escrow balances.

### 3. Slashing & Fraud Mitigation
* Nodes back their compute with a **$100 USDC on-chain stake bond**.
* Failing any of the 6 cryptographic checks immediately triggers `claim_refund()` back to the agent vault and slashes node reputation.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite 8
* **Styles:** Tailwind CSS v4 (Obsidian Linear/Stripe design tokens)
* **Solana Primitives:** `@solana/web3.js` (PDA derivation, Ed25519 signatures, Web Crypto SHA-256 digest checks, Explorer deep-linking)
* **Polyfills:** `vite-plugin-node-polyfills` (Zero-crash browser Buffer/Crypto bindings)
* **UI Controls:** Lucide React, Canvas Confetti

---

## 🚀 Quickstart & Local Installation

### Prerequisites
* Node.js v18.0.0 or higher
* npm or pnpm

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/openmesh.git
cd openmesh

# Install dependencies
npm install

# Start the development server
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 🧪 Demo Scenarios

The Agent Console comes preloaded with three one-click scenarios:
1. **Autonomous Vision ($0.005):** Runs under the $0.10 policy ceiling. Autonomous session key signs, locks PDA escrow, completes Llama 3.2 Vision on NVIDIA A100, passes 6-point verification, and settles USDC.
2. **Policy Escalation ($0.450):** Triggers the Human-in-the-Loop escalation modal. Requires manual Master Wallet authorization before funds are committed.
3. **Chaos Slashing Test:** Dispatches a request to a degraded node that returns an invalid Ed25519 signature and empty payload. Escrow halts settlement, restores 100% USDC to the agent vault, and penalizes the node.
