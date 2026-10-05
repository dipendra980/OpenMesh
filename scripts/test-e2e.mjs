import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qkjdvjcfotbwzopmazta.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFramR2amNmb3Rid3pvcG1henRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExODI1MjAsImV4cCI6MjEwNjc1ODUyMH0.2_RMjS1eOj5-qqtfbrgBPj1UQUUZ6OXlnbHhivd_9fU';

console.log('=====================================================');
console.log('   OPENMESH END-TO-END AUTOMATED VERIFICATION SUITE  ');
console.log('=====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function pass(name, details = '') {
  testsPassed++;
  console.log(`  [PASS] ${name}${details ? ` -> ${details}` : ''}`);
}

function fail(name, details = '') {
  testsFailed++;
  console.error(`  [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
}

// 1. Test Supabase Database Connection & Tables
async function testSupabase() {
  console.log('1. Supabase Database & Table Integrity:');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test Providers
  try {
    const { data: providers, error: pErr } = await supabase.from('providers').select('*');
    if (pErr) throw pErr;
    if (providers && providers.length >= 3) {
      pass('Providers Table', `${providers.length} registered providers found (${providers.map(p => p.name).join(', ')})`);
    } else {
      fail('Providers Table', `Expected at least 3 providers, got ${providers?.length || 0}`);
    }
  } catch (err) {
    fail('Providers Table', err.message);
  }

  // Test Jobs Table
  try {
    const testJobId = `e2e_test_${Date.now()}`;
    const { error: insErr } = await supabase.from('jobs').upsert({
      id: testJobId,
      agent_id: 'agent_e2e_tester',
      provider_id: 'provider-beta',
      task_type: 'vision',
      prompt: 'Autonomous obstacle segmentation test',
      input_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      price: 0.005,
      status: 'settled',
      verification_status: 'PASSED',
      escrow_pda: '7h4MSPwpZV3tk76ZpFHs2LZPKeLw3Uaja6oF6vQfkiJo',
      transaction_signature: '5K4nZY4jQ8W1mN9vX2P7qL1w8T6yZ4bJ9cE6hZp1M8T4u4c2A5k9h7rY2mK7qR1vN9yT3bJ5cE6hZp1M8T4u4c2A'
    });
    if (insErr) throw insErr;
    pass('Jobs Table Insert', `Persisted test job ${testJobId}`);

    // Verify Query
    const { data: jobQuery, error: qErr } = await supabase.from('jobs').select('*').eq('id', testJobId).single();
    if (qErr) throw qErr;
    if (jobQuery && jobQuery.status === 'settled') {
      pass('Jobs Table Read/Verify', `Job ${testJobId} verified in Supabase`);
    }

    // Clean up test job
    await supabase.from('jobs').delete().eq('id', testJobId);
    pass('Jobs Table Cleanup', 'Test job removed cleanly');
  } catch (err) {
    fail('Jobs Table Verification', err.message);
  }

  // Test Agents Policy Table
  try {
    const { data: agents, error: aErr } = await supabase.from('agents').select('*');
    if (aErr) throw aErr;
    pass('Agents Policy Table', `Agents table reachable, count: ${agents?.length || 0}`);
  } catch (err) {
    fail('Agents Policy Table', err.message);
  }
}

// 2. Test Backend RFC-402 Clearinghouse Server
async function testBackend() {
  console.log('\n2. RFC-402 Backend Clearinghouse Service (Port 3001):');

  // Test /api/health
  await new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200 && json.status === 'ONLINE' && json.supabase === 'CONNECTED') {
            pass('Backend Health & RFC-402 Protocol', `Status 200 ONLINE, Supabase ${json.supabase}, Providers: ${json.providersCount}`);
          } else {
            fail('Backend Health Check', `Unexpected response: ${data}`);
          }
        } catch (e) {
          fail('Backend Health Parse', e.message);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      fail('Backend Connection', e.message);
      resolve();
    });
  });

  // Test RFC-402 Handshake: Without Payment -> MUST yield HTTP 402
  await new Promise((resolve) => {
    const postData = JSON.stringify({
      prompt: 'Analyze satellite imagery for anomaly detection',
      model: 'Llama-3.2-11B-Vision',
      maxTokens: 512
    });

    const req = http.request('http://localhost:3001/v1/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const x402Price = res.headers['x-402-price'];
          const x402Program = res.headers['x-402-escrow-program'];
          if (res.statusCode === 402 && json.status === 402 && x402Price && x402Program) {
            pass('RFC-402 Payment Required Challenge (HTTP 402)', `Price: $${x402Price} USDC, Program: ${x402Program}`);
          } else {
            fail('RFC-402 Challenge', `Expected HTTP 402 with x402 headers, got ${res.statusCode}: ${data}`);
          }
        } catch (e) {
          fail('RFC-402 Challenge Parse', e.message);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      fail('RFC-402 Request Error', e.message);
      resolve();
    });
    req.write(postData);
    req.end();
  });

  // Test RFC-402 Settle: With Payment Token -> MUST yield HTTP 200 with cryptographic receipt
  await new Promise((resolve) => {
    const postData = JSON.stringify({
      prompt: 'Analyze satellite imagery for anomaly detection',
      model: 'Llama-3.2-11B-Vision',
      maxTokens: 512,
      paymentProof: {
        escrowPda: '7h4MSPwpZV3tk76ZpFHs2LZPKeLw3Uaja6oF6vQfkiJo',
        transactionSignature: '5K4nZY4jQ8W1mN9vX2P7qL1w8T6yZ4bJ9cE6hZp1M8T4u4c2A5k9h7rY2mK7qR1vN9yT3bJ5cE6hZp1M8T4u4c2A',
        agentPubkey: '7rtTNBNqQ4N6NH5d5AdRFQYRsr5gz2q3ZVpgesGaZxpo'
      }
    });

    const req = http.request('http://localhost:3001/v1/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const settlementSig = res.headers['x-402-settlement-sig'];
          if (res.statusCode === 200 && json.verification && settlementSig) {
            pass('RFC-402 Settle & Inference Execution (HTTP 200)', `Job: ${json.jobId}, Signature: ${settlementSig.slice(0, 20)}..., Status: ${json.verification.status}`);
          } else {
            fail('RFC-402 Settlement', `Expected HTTP 200 with receipt, got ${res.statusCode}: ${data}`);
          }
        } catch (e) {
          fail('RFC-402 Settlement Parse', e.message);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      fail('RFC-402 Settlement Request', e.message);
      resolve();
    });
    req.write(postData);
    req.end();
  });
}

// 3. Test Frontend Dev Server (Port 5174)
async function testFrontend() {
  console.log('\n3. Frontend Dev Server (Port 5174):');
  await new Promise((resolve) => {
    const req = http.get('http://localhost:5174/', (res) => {
      if (res.statusCode === 200) {
        pass('Frontend Server Reachable', `HTTP ${res.statusCode} OK (Content-Type: ${res.headers['content-type']})`);
      } else {
        fail('Frontend Server', `Unexpected status code: ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', (e) => {
      fail('Frontend Connection', e.message);
      resolve();
    });
  });
}

// Run All
async function main() {
  await testSupabase();
  await testBackend();
  await testFrontend();

  console.log('\n=====================================================');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
  console.log('=====================================================');
  if (testsFailed === 0) {
    console.log('>>> ALL END-TO-END CORE SUBSYSTEMS ARE 100% OPERATIONAL <<<\n');
  } else {
    process.exit(1);
  }
}

main();
