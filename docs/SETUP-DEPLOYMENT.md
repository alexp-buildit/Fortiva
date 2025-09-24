# Fortiva Platform — Setup, Integration, and Deployment Guide

This checklist guides Claude Code in VS Code to take the boilerplate to a fully functional, production-ready app using Supabase + Netlify/Vercel.

---

## 0) Prerequisites
- Accounts: Supabase, Twilio (or other SMS), SendGrid/Resend (email), Netlify or Vercel, UptimeRobot, Sentry (optional).
- Tools: pnpm ≥ 8, Node ≥ 18, OpenSSL (or native crypto), Git.

## 1) Install dependencies
```bash
pnpm add @supabase/supabase-js jose zod
pnpm add express-rate-limit helmet cors nanoid
pnpm add -D @supabase/ssr
```

## 2) Supabase project
1. Create a new project. Copy the Project URL and anon/service keys.
2. Enable Email + SMS; set up Twilio for SMS MFA; configure DKIM for email provider.
3. In Authentication → Policies, enable MFA (TOTP/SMS) and password policy: min 12 chars, mixed case, numbers, symbols.

## 3) Database schema (SQL)
Run the following in the Supabase SQL editor (adjust schemas if needed):
```sql
-- enable extensions
create extension if not exists pgcrypto;
create extension if not exists pg_net;

-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text not null,
  first_name text not null,
  last_name text not null,
  username text unique not null,
  business_address jsonb,
  is_admin boolean default false,
  admin_approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique not null,
  property_address jsonb not null,
  admin_user_id uuid references users(id),
  status text not null default 'not_started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PARTICIPANTS
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

-- WIRE INSTRUCTIONS (encrypted values)
create table if not exists wire_instructions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  transaction_id uuid references transactions(id) on delete cascade,
  bank_name text not null,
  routing_number text not null,
  account_number_enc bytea not null,   -- AES-256-GCM ciphertext
  account_iv bytea not null,           -- IV for AES-GCM
  account_tag bytea not null,          -- Auth tag for AES-GCM
  account_holder_name text,
  account_holder_phone text,
  account_holder_address jsonb,
  is_template boolean default false,
  integrity_checksum text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SECURE LINKS
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

-- DOCUMENTS
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

-- MESSAGES
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  recipient_id uuid references users(id) on delete set null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- SUPPORT TICKETS
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

-- LOGGING
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
create table if not exists backup_logs (
  id uuid primary key default gen_random_uuid(),
  backup_id text unique not null,
  checksum text not null,
  backup_type text not null,
  tables_included text[],
  file_size bigint,
  created_at timestamptz default now()
);
create table if not exists system_health_logs (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  details jsonb,
  checked_at timestamptz default now()
);
```

## 4) RLS and policies
Enable RLS on all tables, then add policies:
```sql
alter table users enable row level security;
alter table transactions enable row level security;
alter table transaction_participants enable row level security;
alter table wire_instructions enable row level security;
alter table secure_links enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;
alter table support_tickets enable row level security;
-- activity/backups/health: service role only (no anon)
alter table activity_logs enable row level security;
alter table backup_logs enable row level security;
alter table system_health_logs enable row level security;
```
Policies (examples — adjust to your org):
```sql
-- users: self access
create policy "users_select_self" on users for select using (auth.uid() = id);
create policy "users_update_self" on users for update using (auth.uid() = id);

-- transactions: admin or participant
create policy "txn_read_participant" on transactions for select using (
  exists(select 1 from transaction_participants tp where tp.transaction_id = id and tp.user_id = auth.uid())
);
create policy "txn_admin_manage" on transactions for all using (admin_user_id = auth.uid());

-- transaction_participants: self rows
create policy "tp_self" on transaction_participants for select using (user_id = auth.uid());

-- wire_instructions: owner or admin of the transaction
create policy "wi_read_role" on wire_instructions for select using (
  user_id = auth.uid() or exists(
    select 1 from transactions t where t.id = transaction_id and t.admin_user_id = auth.uid()
  )
);
create policy "wi_insert_owner" on wire_instructions for insert with check (user_id = auth.uid());

-- secure_links: only service role writes/reads
revoke all on secure_links from anon, authenticated;

-- documents: participants with recipient access
create policy "docs_read_recipient" on documents for select using (
  exists(select 1 from transaction_participants tp where tp.transaction_id = documents.transaction_id and tp.user_id = auth.uid())
  and auth.uid() = any(recipients)
);
create policy "docs_insert_participant" on documents for insert with check (
  exists(select 1 from transaction_participants tp where tp.transaction_id = documents.transaction_id and tp.user_id = auth.uid())
);

-- messages: sender or recipient
create policy "msg_read_self" on messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "msg_insert_sender" on messages for insert with check (sender_id = auth.uid());
```

## 5) Storage
- Create private bucket `documents` with versioning.
- Use signed URLs for downloads; enforce recipient membership check before issuing URLs.

## 6) Edge Functions (Deno)
Create functions in Supabase:
- `secure-link-create`: input {transaction_id, link_type, recipient_email}; generate token (nanoid), set `expires_at = now() + interval '7 days'`, insert into `secure_links`, send email/SMS with URL.
- `secure-link-validate`: input {token, transaction_id}; verify expiration and that `transaction_id` matches; return minimal context.
- `backup-snapshot`: run `pg_dump` (via scheduled job) to storage; write checksum to `backup_logs`.

Minimal skeleton (TypeScript):
```ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { nanoid } from "https://esm.sh/nanoid";
serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // implement handler per route here
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
});
```

## 7) Secrets and environment
Create `.env` (local) and set in hosting provider:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ENCRYPTION_KEY=32-byte-random-base64  # for AES-256-GCM
EMAIL_FROM=noreply@yourdomain
SMTP_KEY=...
TWILIO_SID=...
TWILIO_TOKEN=...
TWILIO_FROM=...
```
Generate 32-byte key: `openssl rand -base64 32`.

## 8) Server implementation (Express)
1. Create `server/lib/crypto.ts` with AES-256-GCM helpers (`encrypt(text): {ciphertext, iv, tag}`, `decrypt(...)`, and `sha256(data)` for integrity checksums).
2. Add Supabase service client in `server/index.ts`.
3. Endpoints:
   - `POST /api/transactions` (admin only) — create transaction and add admin participant.
   - `POST /api/wire` — upsert wire instructions; encrypt account number; save checksum = sha256(all fields excluding checksum).
   - `POST /api/secure-links` — call Edge function `secure-link-create`.
   - `GET /api/secure-links/:token` — validate via Edge function and return minimal payload.
   - `POST /api/wire/downloaded` — log download and notify provider.
4. Middleware: `helmet`, `cors`, `express-rate-limit` (per-IP login + link validate), session timeout headers.

## 9) Frontend implementation
1. Create Supabase client `client/lib/supabase.ts` using `VITE_*` vars.
2. Auth pages: Register → MFA verify (email + SMS/TOTP), Login, Password reset.
3. Role selection: Admin/Sender/Receiver; write to `users` table. Admin requests require `admin_approved=true` by owner UI.
4. Dashboard (`/app`):
   - List transactions grouped by role.
   - Forms: create transaction, submit wire instructions (with client-side validation), document upload (to Storage → then insert metadata row), messaging.
   - Realtime subscriptions for `transactions`, `messages`, `documents`.
5. Secure link pages: routes to display wire instructions or request-entry; require token + transaction id verification and MFA when opening sensitive views.
6. Notifications: email/SMS via Edge functions; in-app toasts for actions.
7. Accessibility: WCAG 2.1 AA — labels, roles, focus ring, tab order, min contrast.

## 10) Compliance & security hardening
- TLS end-to-end (host enforces HTTPS).
- CSP headers, Referrer-Policy, HSTS via hosting config.
- Progressive account lockouts on auth forms (track attempts server-side).
- Audit trail writes on: login, role change, transaction create/update, wire CRUD, secure link create/access, document upload/download, message send/read.
- Session timeout: Admin 8h, others 4h; refresh on activity.

## 11) Monitoring & backups
- UptimeRobot monitor public site and API ping.
- Sentry (optional) for FE/BE error tracking.
- Nightly backup via `backup-snapshot`; verify checksums; write `backup_logs`.

## 12) Deployment
### Netlify (recommended with this repo)
1. Connect repo → set build command `pnpm build` and publish directory `dist/spa`.
2. Environment: set all vars from section 7. Add functions env too.
3. Ensure `netlify/functions/` functions are built (adapt server endpoints or proxy to Supabase Edge Functions).
4. Add redirects if needed (SPA):
   - `_redirects`: `/*    /index.html   200`.

### Vercel
1. Create project → Framework: Vite + Node SSR functions.
2. Add `api/*` serverless functions for endpoints or proxy to Supabase Edge Functions.
3. Set env vars; build command `pnpm build`; output `dist`.

## 13) Go-live checklist
- [ ] All tests pass; typecheck clean.
- [ ] RLS enabled on all tables; service-role only tables locked down.
- [ ] MFA enforced for auth and sensitive actions.
- [ ] Secure links expire in 7 days and are validated.
- [ ] AES-256-GCM encryption working with checksums verified.
- [ ] Storage bucket private; downloads require recipient membership.
- [ ] Audit logs populated for critical actions.
- [ ] Accessibility audit (axe) passes.
- [ ] Monitoring and backups running.

---

Give this file to Claude Code and implement step-by-step. Ask for help wiring specific endpoints, Edge Functions, and RLS policies based on your org’s needs.
