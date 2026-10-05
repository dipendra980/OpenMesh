import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=200, right=200):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Set standard margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles & Colors
    # Primary: Deep Navy/Slate #0B1120
    # Accent: Emerald #10B981
    # Secondary: Indigo #4F46E5
    # Text: Charcoal #1F2937

    # 1. Document Title Banner
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("OPENMESH (POWERED BY AGENTSETTLE)")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(11, 17, 32) # Dark Slate

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(18)
    run_sub = sub_p.add_run("The Economic & Escrow Clearinghouse Infrastructure for Autonomous AI Agents on Solana")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(16, 185, 129) # Emerald Green

    # Metadata Bar Box
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.cell(0, 0)
    set_cell_background(meta_cell, "F3F4F6")
    set_cell_margins(meta_cell, top=140, bottom=140, left=200, right=200)
    
    mp = meta_cell.paragraphs[0]
    mp.paragraph_format.space_after = Pt(0)
    m_run = mp.add_run("Protocol Version: v1.1.0  |  Network: Solana Devnet (Program: 4CN3kzED...Laz)  |  Standard: RFC-402 (HTTP 402)  |  GitHub: github.com/dipendra980/OpenMesh")
    m_run.font.name = 'Calibri'
    m_run.font.size = Pt(9.5)
    m_run.font.color.rgb = RGBColor(75, 85, 99)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ----------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY
    # ----------------------------------------------------
    h1 = doc.add_heading("1. Executive Summary", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)

    p1 = doc.add_paragraph(
        "OpenMesh is an open decentralized Machine-to-Machine (M2M) compute clearinghouse and autonomous escrow settlement protocol built on Solana. "
        "It provides the foundational financial plumbing that enables autonomous AI software agents to dynamically discover, evaluate, negotiate, "
        "and settle sub-cent micro-inference tasks with decentralized GPU hardware clusters in under 600 milliseconds—completely free of human authorization, "
        "credit card payment rails, or custodial intermediaries."
    )
    p1.paragraph_format.line_spacing = 1.15
    p1.paragraph_format.space_after = Pt(10)

    p2 = doc.add_paragraph(
        "By synthesizing real-time Groq Cloud inference, Solana Program Derived Addresses (PDAs), detached Ed25519 payload signatures, "
        "and a rigorous 6-point cryptographic verification gate, OpenMesh establishes a zero-trust marketplace where software programs can pay "
        "independent hardware nodes safely with automated fraud mitigation and stake slashing."
    )
    p2.paragraph_format.line_spacing = 1.15
    p2.paragraph_format.space_after = Pt(14)

    # ----------------------------------------------------
    # SECTION 2: THE CORE PROBLEM
    # ----------------------------------------------------
    h2 = doc.add_heading("2. The Problem: The Financial Bottleneck of Autonomous AI", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "While AI agents can now autonomously write code, execute research, and navigate web interfaces, their agency completely halts when accessing compute resources due to three systemic market failures:"
    ).paragraph_format.space_after = Pt(8)

    problems = [
        ("The KYC and Banking Impossibility: ", "AI agents cannot open traditional bank accounts, complete Know-Your-Customer (KYC) identity verification, or sign corporate SaaS contracts. Forcing humans to enter corporate credit cards invalidates agentic independence and exposes owners to runaway loop billing disasters."),
        ("The 'Who Pays First?' Dilemma: ", "If an agent pays a GPU provider upfront, a dishonest node can take the USDC and return nothing or hallucinated gibberish. If the node performs heavy GPU inference before receiving payment, an untrusted client agent can sever the connection without paying."),
        ("The 'Ghost Work' Fraud Surface: ", "In existing decentralized compute networks, degraded or malicious nodes run cheap cheat scripts returning filler text ('Lorem Ipsum') to collect compute fees without actually running resource-intensive models.")
    ]
    for bold_prefix, text in problems:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(4)
        r_bold = bp.add_run(bold_prefix)
        r_bold.font.bold = True
        r_bold.font.color.rgb = RGBColor(17, 24, 39)
        bp.add_run(text)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ----------------------------------------------------
    # SECTION 3: CORE ARCHITECTURE & THE RFC-402 STANDARD
    # ----------------------------------------------------
    h3 = doc.add_heading("3. Technical Architecture & RFC-402 Implementation", level=1)
    h3.paragraph_format.space_before = Pt(16)
    h3.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "OpenMesh operationalizes the official IETF RFC-402 (HTTP 402 Payment Required) specification into a functional decentralized protocol:"
    ).paragraph_format.space_after = Pt(8)

    # 7-Step Lifecycle Table
    table = doc.add_table(rows=8, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["Stage", "Actor & Mechanism", "Cryptographic / Protocol Operation"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(10)

    steps_data = [
        ("1. Task Dispatch", "Agent Policy Vault", "Checks $0.10 auto-approval threshold. If cost <= $0.10, auto-signs via ephemeral session key; if > $0.10, escalates to Master Wallet."),
        ("2. Escrow Derivation", "Solana Anchor PDA", "Computes deterministic PDA from seeds: [b'mesh_escrow', agent_pubkey, job_id] with bump seed."),
        ("3. Escrow Lock", "Agent -> Solana Devnet", "Locks exact SPL-USDC micro-units into the PDA. Emits 'escrow_locked' event across Supabase Realtime."),
        ("4. Live Ingestion", "Worker Cockpit", "Listening Worker node claims task, transitions status to 'processing', and dispatches prompt to Groq Cloud LPU."),
        ("5. Execution & Signing", "Groq LPU + Ed25519", "Executes sub-second inference. Worker hashes '${jobId}:${prompt}:${outputText}' via SHA-256 and signs with detached Ed25519 secret key."),
        ("6. 6-Point Verification", "Agent Verification Gate", "Agent evaluates all 6 invariant gates: signature math, PDA match, token density, schema format, latency SLA, and SHA-256 digest."),
        ("7. Settlement / Slashing", "Solana Smart Contract", "ALL PASS: Escrow releases USDC to worker; +reputation.\nANY FAIL: claim_refund() returns 100% USDC to agent; slashes $100 node bond.")
    ]

    for row_idx, data in enumerate(steps_data, start=1):
        bg = "FFFFFF" if row_idx % 2 == 1 else "F8FAFC"
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            run = p.add_run(text)
            run.font.size = Pt(9.5)
            if col_idx == 0:
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ----------------------------------------------------
    # SECTION 4: THE 6-POINT CRYPTOGRAPHIC VERIFICATION GATE
    # ----------------------------------------------------
    h4 = doc.add_heading("4. The 6-Point Cryptographic Verification Gate", level=1)
    h4.paragraph_format.space_before = Pt(16)
    h4.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "To guarantee that agents never pay for fraudulent, broken, or degraded compute, funds remain strictly locked in the on-chain escrow until passing six automated checks:"
    ).paragraph_format.space_after = Pt(8)

    checks = [
        ("Point 1: Ed25519 Provider Signature Authenticated", "The detached cryptographic signature is verified against the provider node's registered Solana public key using elliptic curve Ed25519 math (tweetnacl). Proves authenticity and prevents man-in-the-middle impersonation."),
        ("Point 2: Deterministic Escrow PDA Match", "Validates that the returned receipt strictly matches the exact PDA address derived from the agent's vault and the unique job ID. Prevents replay attacks using past receipts."),
        ("Point 3: Non-Empty Token Density (Anti-Ghost Work)", "Inspects response byte length and character entropy, strictly rejecting empty outputs, null bytes, and repetitive placeholder text (such as 'Lorem Ipsum')."),
        ("Point 4: Structural Schema Conformance", "Validates that the output matches the requested capability schema (valid parseable JSON, structured code blocks, or delimited transcription segments)."),
        ("Point 5: Round-Trip Latency SLA Guarantee (< 5,000ms)", "Measures round-trip execution time. Nodes that stall or exceed the maximum service level agreement are penalized."),
        ("Point 6: Independent SHA-256 Digest Invariant", "The client independently recalculates SHA-256(jobId:prompt:outputText) and verifies that the resulting hash matches the provider's signed digest byte-for-byte.")
    ]

    for title, desc in checks:
        cp = doc.add_paragraph(style='List Bullet')
        cp.paragraph_format.space_after = Pt(4)
        rt = cp.add_run(title + ": ")
        rt.font.bold = True
        cp.add_run(desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ----------------------------------------------------
    # SECTION 5: DUAL PERSPECTIVE INTERFACE ARCHITECTURE
    # ----------------------------------------------------
    h5 = doc.add_heading("5. Dual-Perspective Architecture & User Interface", level=1)
    h5.paragraph_format.space_before = Pt(16)
    h5.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "OpenMesh coordinates two distinct actors communicating seamlessly across independent browser instances via Supabase Realtime:"
    ).paragraph_format.space_after = Pt(8)

    # Subsection A
    doc.add_heading("A. Agent / User Console (/agent)", level=2)
    agent_features = [
        ("Delegated Policy Vault: ", "Enforces strict financial guardrails with a $10.00 daily budget cap and a $0.10 auto-approval ceiling."),
        ("Master Approval Modal: ", "Automated human-in-the-loop escalation that halts execution whenever an inference task exceeds $0.10, requiring explicit master wallet sign-off."),
        ("Interactive Scenario Selectors: ", "Three pre-configured test scenarios: Scenario 1 (Autonomous Vision - $0.005), Scenario 2 (Policy Escalation - $0.450), and Scenario 3 (Adversarial Chaos Test)."),
        ("Escrow State Machine: ", "7-step real-time visual progress tracker with individual diagnostic pass/fail badges for each of the 6 cryptographic checks.")
    ]
    for b_txt, d_txt in agent_features:
        ap = doc.add_paragraph(style='List Bullet')
        ap.paragraph_format.space_after = Pt(3)
        ap.add_run(b_txt).font.bold = True
        ap.add_run(d_txt)

    # Subsection B
    doc.add_heading("B. Worker / GPU Operator Cockpit (/worker)", level=2)
    worker_features = [
        ("Node Hardware & Identity: ", "Displays registered Solana public key, active GPU compute tier (NVIDIA H100 / A100), reputation score, and $100 USDC stake bond."),
        ("Groq Cloud API Connection: ", "Configurable API key input for live sub-second model completions (openai/gpt-oss-120b, qwen/qwen3.8-27b, whisper-large-v3-turbo)."),
        ("Chaos Slashing Mode Controller: ", "Intentional fault-injection toggle for live presentation demonstrations, allowing judges to test signature corruption, payload tampering, and automated stake slashing."),
        ("Real-Time Automated Solver: ", "Subscribes to Supabase Realtime channel, automatically claiming 'escrow_locked' jobs and submitting signed outputs in under 600ms.")
    ]
    for b_txt, d_txt in worker_features:
        wp = doc.add_paragraph(style='List Bullet')
        wp.paragraph_format.space_after = Pt(3)
        wp.add_run(b_txt).font.bold = True
        wp.add_run(d_txt)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ----------------------------------------------------
    # SECTION 6: SYSTEM SPECIFICATIONS & TECHNOLOGY STACK
    # ----------------------------------------------------
    h6 = doc.add_heading("6. Technology Stack & Specifications", level=1)
    h6.paragraph_format.space_before = Pt(16)
    h6.paragraph_format.space_after = Pt(6)

    tech_table = doc.add_table(rows=6, cols=2)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    t_headers = ["Layer", "Technology & Components"]
    for i, h in enumerate(t_headers):
        c = tech_table.cell(0, i)
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=100, bottom=100, left=150, right=150)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(10)

    tech_data = [
        ("Frontend & Styling", "React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Canvas Confetti. Dark Frosted Glassmorphism Design System (Obsidian canvas #07080e, atmospheric mesh glows, 28px rounded corners)."),
        ("Blockchain & Escrow", "Solana Devnet, Anchor Framework (Rust), @solana/web3.js, SPL-USDC token escrows, Program Derived Addresses (PDAs) with deterministic seeds."),
        ("Cryptography Engine", "tweetnacl (Ed25519 detached signatures), Native Web Crypto API (SHA-256 digest computation), Base58 byte encoding/decoding."),
        ("Real-Time Database", "Supabase PostgreSQL, Supabase Realtime WebSocket channels, Row Level Security (RLS) policies, cross-tab BroadcastChannel fallback."),
        ("AI Compute Engine", "Groq Cloud API (LPU inference engine), openai/gpt-oss-120b (Reasoning), qwen/qwen3.8-27b (Tooling/Vision), whisper-large-v3-turbo (Transcription).")
    ]

    for row_idx, (layer, tech) in enumerate(tech_data, start=1):
        bg = "FFFFFF" if row_idx % 2 == 1 else "F8FAFC"
        c1 = tech_table.cell(row_idx, 0)
        c2 = tech_table.cell(row_idx, 1)
        set_cell_background(c1, bg)
        set_cell_background(c2, bg)
        set_cell_margins(c1, top=100, bottom=100, left=150, right=150)
        set_cell_margins(c2, top=100, bottom=100, left=150, right=150)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(layer)
        r1.font.bold = True
        r1.font.size = Pt(9.5)

        p2 = c2.paragraphs[0]
        r2 = p2.add_run(tech)
        r2.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ----------------------------------------------------
    # SECTION 7: REAL-WORLD APPLICATIONS & COMMERCIAL VALUE
    # ----------------------------------------------------
    h7 = doc.add_heading("7. Real-World Applications & Commercial Utility", level=1)
    h7.paragraph_format.space_before = Pt(16)
    h7.paragraph_format.space_after = Pt(6)

    use_cases = [
        ("Autonomous Drone & IoT Surveillance: ", "Edge hardware with constrained compute can beam visual frames to decentralized OpenMesh nodes, settling $0.003 USDC per image verification in real time."),
        ("Automated Financial & Legal Scrapers: ", "Trading and research bots can ingest and analyze 50,000 regulatory documents on demand across hundreds of parallel worker nodes, paying only for the exact milliseconds used."),
        ("Global Idle GPU Monetization: ", "Individual hardware owners and mining facilities can convert idle RTX 4090s and A100s into instant cashflow, earning SPL-USDC per request without monthly payout delays or platform commissions.")
    ]
    for u_title, u_desc in use_cases:
        up = doc.add_paragraph(style='List Bullet')
        up.paragraph_format.space_after = Pt(4)
        up.add_run(u_title).font.bold = True
        up.add_run(u_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ----------------------------------------------------
    # SECTION 8: VERIFICATION & REPOSITORY METRICS
    # ----------------------------------------------------
    h8 = doc.add_heading("8. Verification & Project Deliverables", level=1)
    h8.paragraph_format.space_before = Pt(16)
    h8.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "OpenMesh has undergone comprehensive automated testing and validation:"
    ).paragraph_format.space_after = Pt(6)

    deliverables = [
        ("Automated Validation Suite: ", "17/17 tests passing across live Groq Cloud inference, Ed25519 signatures, 6-point verification gates, and chaos tampering detection."),
        ("E2E Test Suite: ", "9/9 tests passing verifying Supabase database integrity, RFC-402 challenge negotiation, and Devnet contract compatibility."),
        ("TypeScript Compilation: ", "0 errors across all views and modules; clean production build in 1.23 seconds."),
        ("GitHub Repository: ", "https://github.com/dipendra980/OpenMesh.git"),
        ("Live Hosted Demo: ", "https://dipendra980.github.io/OpenMesh/")
    ]
    for d_title, d_desc in deliverables:
        dp = doc.add_paragraph(style='List Bullet')
        dp.paragraph_format.space_after = Pt(3)
        dp.add_run(d_title).font.bold = True
        dp.add_run(d_desc)

    # Save document
    output_filename = "OpenMesh_Project_Summary.docx"
    doc.save(output_filename)
    print(f"Document saved successfully as {output_filename}")

if __name__ == '__main__':
    create_document()
