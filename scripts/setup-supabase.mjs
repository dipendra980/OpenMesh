import https from 'node:https';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'qkjdvjcfotbwzopmazta';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

const sql = `
-- 1. Create Jobs Table
create table if not exists public.jobs (
  id text primary key,
  agent_id text not null,
  provider_id text,
  task_type text not null,
  prompt text not null,
  image_url text,
  input_hash text not null,
  output_result text,
  output_hash text,
  price numeric not null,
  status text not null default 'created',
  verification_status text not null default 'PENDING',
  escrow_pda text,
  transaction_signature text,
  refund_signature text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 2. Create Agent Policies Table
create table if not exists public.agents (
  id text primary key,
  owner_wallet text not null,
  vault_pda text not null,
  daily_limit numeric not null default 10.0,
  auto_approval_limit numeric not null default 0.10,
  spent_today numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Providers Table
create table if not exists public.providers (
  id text primary key,
  name text not null,
  wallet_address text not null,
  gpu text not null,
  models text[] not null,
  price_per_request numeric not null,
  average_latency int not null,
  success_rate numeric not null,
  reputation int not null default 95,
  status text not null default 'ONLINE',
  stake_bond_amount numeric not null default 100,
  today_revenue numeric not null default 0
);

-- Enable RLS and public access policies
alter table public.jobs enable row level security;
alter table public.agents enable row level security;
alter table public.providers enable row level security;

create policy "Allow public all access on jobs" on public.jobs for all using (true) with check (true);
create policy "Allow public all access on agents" on public.agents for all using (true) with check (true);
create policy "Allow public all access on providers" on public.providers for all using (true) with check (true);
`;

const body = JSON.stringify({ query: sql });

const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'Node'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('SUPABASE STATUS:', res.statusCode);
    console.log('SUPABASE RESPONSE:', data);
  });
});

req.on('error', err => {
  console.error('API Error:', err);
});

req.write(body);
req.end();
