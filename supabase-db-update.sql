-- Update transactions table to add missing columns
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS property_value numeric,
ADD COLUMN IF NOT EXISTS escrow_amount numeric,
ADD COLUMN IF NOT EXISTS closing_date date,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

-- Update property_address from jsonb to text for simplicity
ALTER TABLE transactions
ALTER COLUMN property_address TYPE text USING (property_address->>'address');

-- Update the transactions table status check constraint to include all statuses
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_status_check
CHECK (status IN ('pending', 'in_progress', 'escrow', 'released', 'completed', 'cancelled'));

-- Ensure RLS policies exist for the transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Admin users can see all transactions
CREATE POLICY IF NOT EXISTS "admin_transactions_all" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Users can see transactions they participate in
CREATE POLICY IF NOT EXISTS "users_own_transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transaction_participants
      WHERE transaction_participants.transaction_id = transactions.id
      AND transaction_participants.user_id = auth.uid()
    )
  );

-- Users can create transactions (will be added as participant)
CREATE POLICY IF NOT EXISTS "users_create_transactions" ON transactions
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update transactions they participate in (or admins)
CREATE POLICY IF NOT EXISTS "users_update_transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM transaction_participants
      WHERE transaction_participants.transaction_id = transactions.id
      AND transaction_participants.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );