-- Fortiva Platform Database Setup
-- Run this in your Supabase SQL Editor

-- Enable extensions
create extension if not exists pgcrypto;
create extension if not exists pg_net;

-- USERS table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text,
  first_name text not null,
  last_name text not null,
  username text unique not null,
  business_address jsonb,
  is_admin boolean default false,
  admin_approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRANSACTIONS table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique not null,
  property_address jsonb not null,
  admin_user_id uuid references users(id),
  status text not null default 'not_started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRANSACTION PARTICIPANTS table
create table if not exists transaction_participants (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('admin','sender','receiver')),
  status text not null default 'invited',
  invited_at timestamptz default now(),
  joined_at timestamptz,
  updated_at timestamptz default now()
);

-- WIRE INSTRUCTIONS table (encrypted values)
create table if not exists wire_instructions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  transaction_id uuid references transactions(id) on delete cascade,
  bank_name text not null,
  routing_number text not null,
  account_number_enc text not null,   -- Base64 encoded ciphertext
  account_iv text not null,           -- Base64 encoded IV for AES-GCM
  account_tag text not null,          -- Base64 encoded auth tag for AES-GCM
  account_holder_name text,
  account_holder_phone text,
  account_holder_address jsonb,
  is_template boolean default false,
  integrity_checksum text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SECURE LINKS table
create table if not exists secure_links (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  sender_id uuid references users(id),
  recipient_email text not null,
  link_type text not null check (link_type in ('wire_instructions','request_instructions')),
  token text unique not null,
  expires_at timestamptz not null,
  accessed_at timestamptz,
  created_at timestamptz default now()
);

-- DOCUMENTS table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  uploader_id uuid references users(id) on delete set null,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  storage_path text not null,
  recipients uuid[] not null,
  version_number integer default 1,
  uploaded_at timestamptz default now()
);

-- MESSAGES table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  recipient_id uuid references users(id) on delete set null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- SUPPORT TICKETS table
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  transaction_id text,
  user_id uuid references users(id),
  title text not null,
  description text not null,
  priority text default 'medium',
  status text default 'open',
  created_by text not null,
  assigned_to uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ACTIVITY LOGS table
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id),
  user_id uuid references users(id),
  action text not null,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- BACKUP LOGS table
create table if not exists backup_logs (
  id uuid primary key default gen_random_uuid(),
  backup_id text unique not null,
  checksum text not null,
  backup_type text not null,
  tables_included text[],
  file_size bigint,
  created_at timestamptz default now()
);

-- SYSTEM HEALTH LOGS table
create table if not exists system_health_logs (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  details jsonb,
  checked_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table users enable row level security;
alter table transactions enable row level security;
alter table transaction_participants enable row level security;
alter table wire_instructions enable row level security;
alter table secure_links enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;
alter table support_tickets enable row level security;
alter table activity_logs enable row level security;
alter table backup_logs enable row level security;
alter table system_health_logs enable row level security;

-- RLS Policies

-- Users: users can only see their own profile
create policy "users_select_self" on users for select using (auth.uid() = id);
create policy "users_update_self" on users for update using (auth.uid() = id);

-- Transactions: admin or participant can access
create policy "txn_read_participant" on transactions for select using (
  exists(select 1 from transaction_participants tp where tp.transaction_id = id and tp.user_id = auth.uid())
);
create policy "txn_admin_manage" on transactions for all using (admin_user_id = auth.uid());

-- Transaction participants: users can see their own participation
create policy "tp_self" on transaction_participants for select using (user_id = auth.uid());

-- Wire instructions: owner or admin of the transaction can access
create policy "wi_read_role" on wire_instructions for select using (
  user_id = auth.uid() or exists(
    select 1 from transactions t where t.id = transaction_id and t.admin_user_id = auth.uid()
  )
);
create policy "wi_insert_owner" on wire_instructions for insert with check (user_id = auth.uid());
create policy "wi_update_owner" on wire_instructions for update using (user_id = auth.uid());

-- Secure links: only service role can manage (no anon access)
revoke all on secure_links from anon, authenticated;

-- Documents: participants with recipient access
create policy "docs_read_recipient" on documents for select using (
  exists(select 1 from transaction_participants tp where tp.transaction_id = documents.transaction_id and tp.user_id = auth.uid())
  and auth.uid() = any(recipients)
);
create policy "docs_insert_participant" on documents for insert with check (
  exists(select 1 from transaction_participants tp where tp.transaction_id = documents.transaction_id and tp.user_id = auth.uid())
);

-- Messages: sender or recipient can access
create policy "msg_read_self" on messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "msg_insert_sender" on messages for insert with check (sender_id = auth.uid());

-- Support tickets: users can see their own tickets
create policy "support_self" on support_tickets for select using (user_id = auth.uid());
create policy "support_insert_self" on support_tickets for insert with check (user_id = auth.uid());

-- Activity logs, backup logs, health logs: service role only
revoke all on activity_logs from anon, authenticated;
revoke all on backup_logs from anon, authenticated;
revoke all on system_health_logs from anon, authenticated;

-- Create indexes for performance
create index if not exists users_email_idx on users(email);
create index if not exists users_username_idx on users(username);
create index if not exists transactions_admin_idx on transactions(admin_user_id);
create index if not exists transaction_participants_user_idx on transaction_participants(user_id);
create index if not exists transaction_participants_txn_idx on transaction_participants(transaction_id);
create index if not exists wire_instructions_user_idx on wire_instructions(user_id);
create index if not exists wire_instructions_txn_idx on wire_instructions(transaction_id);
create index if not exists activity_logs_user_idx on activity_logs(user_id);
create index if not exists activity_logs_txn_idx on activity_logs(transaction_id);

-- Function to handle user creation from auth.users
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, first_name, last_name, phone, username, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role') = 'admin', false)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create user profile on auth signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to relevant tables
drop trigger if exists update_users_updated_at on users;
create trigger update_users_updated_at before update on users for each row execute procedure update_updated_at_column();

drop trigger if exists update_transactions_updated_at on transactions;
create trigger update_transactions_updated_at before update on transactions for each row execute procedure update_updated_at_column();

drop trigger if exists update_wire_instructions_updated_at on wire_instructions;
create trigger update_wire_instructions_updated_at before update on wire_instructions for each row execute procedure update_updated_at_column();