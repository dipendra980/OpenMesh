# OpenMesh — Colosseum Hackathon Submission Pack

## 1. Submission Form Fields
*Copy and paste directly into the hackathon submission portal:*

| Field | Content |
| :--- | :--- |
| **Project Name** | **OpenMesh** (powered by AgentSettle) |
| **Tagline / One-Line Pitch** | The economic infrastructure and RFC-402 escrow settlement layer for autonomous AI agents on Solana. |
| **Track** | AI Agents / Infrastructure / Payments |
| **Solana Program ID / PDA** | `4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz` *(Seeds: `[b"mesh_escrow", agentPubkey, jobId]`)* |
| **GitHub Repository** | https://github.com/dipendra980/OpenMesh |
| **Live App URL** | https://dipendra980.github.io/OpenMesh/ |

---

### Detailed Problem Statement
Current AI agents lack native economic autonomy. When software agents interact with computational resources (GPUs, private fine-tuned weights, proprietary tool APIs), they face three critical barriers:
1. **Inability to access legacy banking:** Agents cannot pass KYC, enter commercial banking relationships, or manage credit card authorization mandates.
2. **Human-approval fatigue:** Requiring browser wallet confirmations for sub-cent API calls defeats true machine autonomy.
3. **Execution & Fraud Risk:** Pre-paying for compute allows nodes to exit scam; post-paying allows agents to default. Furthermore, rogue nodes can return empty tokens or hallucinated garbage ("Lorem Ipsum" fraud) and steal micro-escrows. Traditional Web2 API keys cannot coordinate trustless, programmatic settlement between two unvetted machines.

---

### The Solution: Why Solana is Mandatory
OpenMesh solves this by combining the **RFC-402 (HTTP 402 Payment Required)** standard with Solana’s sub-second finality and sub-cent transaction fees.
* **Delegated Policy Vaults:** Ephemeral Ed25519 session keys allow agents to sign micro-transactions (<$0.10) autonomously within strict, human-defined daily guardrails ($10.00). High-value queries automatically escalate to human Master Wallet approval.
* **Deterministic PDA Escrows:** Program Derived Addresses hold USDC deposits in escrow until inference delivery is cryptographically proven.
* **6-Point Cryptographic Verification:** Nodes must submit Ed25519-signed inference receipts and SHA-256 content digests matching response schemas within latency SLAs. If a node fails, 100% of escrowed funds automatically revert to the agent vault, and the node's stake bond ($100 USDC) is slashed.

High transaction fees and multi-second block times on other blockchains make micro-escrows impossible. Solana is the only production network capable of clearing M2M micro-commerce at scale.

---

## 2. Timed 2-Minute 45-Second Demo Script

*Center screen recording on `http://localhost:5174` with Solana Explorer open in an adjacent tab.*

### [0:00 - 0:40] The Problem & The Thesis
* **Visual:** Browser on `AgentConsole.tsx`. Mouse highlights top status chips (`Solana Devnet · 1,480 TPS`, `Vault: $0.015 / $10.00`).
* **Speaker:**
  > *"Judges, autonomous AI agents are rapidly becoming independent economic actors. But there’s a fundamental blocker: agents cannot open bank accounts, pass KYC, or sign credit card agreements.*
  > 
  > *Current Web3 agent apps make a fatal design mistake: they ask a human to click 'Approve' in Phantom for every fraction-of-a-cent inference. That completely breaks autonomy.*
  > 
  > *We built OpenMesh, an autonomous M2M compute clearinghouse powered by AgentSettle on Solana. We’ve implemented the HTTP 402 Payment Required standard, using delegated session key policy vaults and on-chain Program Derived Addresses to settle micro-inference safely and autonomously."*

### [0:40 - 1:25] Scenario 1: The Autonomous Vision Settlement
* **Visual:** Click button **Autonomous Vision ($0.005)**. Prompt populates with visual inference parameters, Task Dispatcher activates, and the 7-step state machine transitions smoothly to green.
* **Speaker:**
  > *"Let's run our first scenario. The agent needs an NVIDIA A100 node to run Llama 3.2 Vision.*
  > 
  > *Notice what happens: because the job cost of $0.005 is well beneath our vault's $0.10 auto-approval threshold, the session key signs locally without any manual popups.*
  > 
  > *Down in the Escrow State Machine, funds are instantly locked into a deterministic PDA derived from the agent’s address and job ID. The node executes the vision pipeline and returns the output payload along with an Ed25519 receipt.*
  > 
  > *OpenMesh verifies all 6 cryptographic invariants: Ed25519 payload signatures, deterministic PDA matching, token density, SLA response time, and the SHA-256 output digest. All 6 pass, payment settles in USDC, and the provider's reputation updates on-chain."*

### [1:25 - 2:05] Scenario 2: Policy Vault Escalation
* **Visual:** Click button **Policy Escalation ($0.450)**. The Master Approval Modal pops up over the console. Click **Approve & Lock Escrow**.
* **Speaker:**
  > *"Now, what happens when an autonomous agent encounters an expensive or unexpected job?*
  > 
  > *Here, a batch reasoning task costs $0.45. This breaches the $0.10 auto-approval threshold configured in our Agent Vault.*
  > 
  > *Rather than failing blindly or draining the agent's balance, OpenMesh halts and elevates the execution to our Human-in-the-Loop Master Wallet. The operator reviews the deterministic parameters, signs authorization, and releases the escrow."*

### [2:05 - 2:45] Scenario 3: Slashing the Rogue Node
* **Visual:** Click button **Chaos Slashing Test**. State Machine step 6 flags a cryptographic mismatch, followed by an immediate auto-refund banner and docked reputation.
* **Speaker:**
  > *"Finally, we must protect agents against compute fraud. If an adversarial GPU node returns empty garbage tokens or an invalid cryptographic signature, a naive payment protocol would still pay them.*
  > 
  > *In this chaos test, the node returns an altered digest. Watch the state machine: check number 6 fails. OpenMesh halts settlement, executes claim_refund(), returns 100% of the USDC back to the agent's policy vault, and docks the provider's stake bond.*
  > 
  > *OpenMesh turns Solana into the sub-second financial settlement layer for autonomous AI. Thank you."*
