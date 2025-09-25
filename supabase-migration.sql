-- Migration to update wire_instructions table to match application structure
-- Run this in your Supabase SQL Editor

-- Drop the existing wire_instructions table if it exists
DROP TABLE IF EXISTS wire_instructions CASCADE;

-- Create the new wire_instructions table with the correct structure
CREATE TABLE wire_instructions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  created_by uuid references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'approved', 'rejected')),

  -- Beneficiary Information
  beneficiary_name text not null,
  beneficiary_address text not null,
  beneficiary_city text not null,
  beneficiary_state text not null,
  beneficiary_zip text not null,
  beneficiary_phone text,
  beneficiary_email text,

  -- Bank Information
  bank_name text not null,
  bank_address text not null,
  bank_city text not null,
  bank_state text not null,
  bank_zip text not null,
  routing_number text not null,
  account_number text not null,
  swift_code text,

  -- Wire Transfer Details
  wire_amount numeric(15,2) not null check (wire_amount > 0),
  purpose_of_wire text not null,
  special_instructions text,
  verification_method text not null check (verification_method in ('phone', 'email', 'in_person')),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE wire_instructions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "wire_instructions_select_own" ON wire_instructions
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "wire_instructions_insert_own" ON wire_instructions
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "wire_instructions_update_own" ON wire_instructions
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "wire_instructions_delete_own" ON wire_instructions
  FOR DELETE USING (created_by = auth.uid());

-- Admin policies (if users table has is_admin column)
CREATE POLICY "wire_instructions_admin_all" ON wire_instructions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS wire_instructions_created_by_idx ON wire_instructions(created_by);
CREATE INDEX IF NOT EXISTS wire_instructions_transaction_id_idx ON wire_instructions(transaction_id);
CREATE INDEX IF NOT EXISTS wire_instructions_status_idx ON wire_instructions(status);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_wire_instructions_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_wire_instructions_updated_at
  BEFORE UPDATE ON wire_instructions
  FOR EACH ROW
  EXECUTE PROCEDURE update_wire_instructions_updated_at();