/*
# Create AI Group Expense Splitting Schema

1. New Tables
- `profiles` — user profile data (name, avatar, UPI ID, QR code, payment method, currency, notifications)
- `groups` — expense groups (name, description, category, invite code, created by)
- `group_members` — membership linking users to groups with roles (admin/member)
- `expenses` — individual expenses within a group (description, amount, payer, category, split type, date)
- `expense_participants` — who shares each expense and their share amount/percentage
- `settlements` — planned payments between members to settle balances (from, to, amount, status)
- `notifications` — in-app notifications for users

2. Security
- Enable RLS on all tables.
- Owner-scoped policies for profiles.
- Group-membership-scoped policies for groups, expenses, participants, settlements.
- User-scoped policies for notifications.

3. Notes
- All amounts numeric(12,2). Tables created first, then policies added to avoid forward-reference errors.
*/

-- ===== TABLES FIRST =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  avatar_url text,
  upi_id text,
  qr_code_data text,
  preferred_payment_method text DEFAULT 'upi',
  currency text DEFAULT 'INR',
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'other',
  invite_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text DEFAULT 'other',
  split_type text DEFAULT 'equal',
  expense_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_amount numeric(12,2) NOT NULL DEFAULT 0,
  percentage numeric(5,2) DEFAULT 0,
  UNIQUE(expense_id, user_id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  transaction_reference text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ===== ENABLE RLS =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES POLICIES =====
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ===== GROUPS POLICIES =====
DROP POLICY IF EXISTS "select_group_members" ON groups;
CREATE POLICY "select_group_members" ON groups FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_group_creator" ON groups;
CREATE POLICY "insert_group_creator" ON groups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_group_admin" ON groups;
CREATE POLICY "update_group_admin" ON groups FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

DROP POLICY IF EXISTS "delete_group_admin" ON groups;
CREATE POLICY "delete_group_admin" ON groups FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

-- ===== GROUP MEMBERS POLICIES =====
DROP POLICY IF EXISTS "select_group_member" ON group_members;
CREATE POLICY "select_group_member" ON group_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_group_member" ON group_members;
CREATE POLICY "insert_group_member" ON group_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_group_admin_member" ON group_members;
CREATE POLICY "update_group_admin_member" ON group_members FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin')
  );

DROP POLICY IF EXISTS "delete_group_admin_member" ON group_members;
CREATE POLICY "delete_group_admin_member" ON group_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin')
  );

-- ===== EXPENSES POLICIES =====
DROP POLICY IF EXISTS "select_expense_member" ON expenses;
CREATE POLICY "select_expense_member" ON expenses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expenses.group_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_expense_member" ON expenses;
CREATE POLICY "insert_expense_member" ON expenses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expenses.group_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_expense_payer" ON expenses;
CREATE POLICY "update_expense_payer" ON expenses FOR UPDATE
  TO authenticated USING (
    paid_by = auth.uid() OR
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expenses.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expenses.group_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_expense_payer" ON expenses;
CREATE POLICY "delete_expense_payer" ON expenses FOR DELETE
  TO authenticated USING (
    paid_by = auth.uid() OR
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expenses.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

-- ===== EXPENSE PARTICIPANTS POLICIES =====
DROP POLICY IF EXISTS "select_participant_member" ON expense_participants;
CREATE POLICY "select_participant_member" ON expense_participants FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_participants.expense_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_participant_member" ON expense_participants;
CREATE POLICY "insert_participant_member" ON expense_participants FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_participants.expense_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_participant_payer" ON expense_participants;
CREATE POLICY "update_participant_payer" ON expense_participants FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_participants.expense_id AND gm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_participants.expense_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_participant_payer" ON expense_participants;
CREATE POLICY "delete_participant_payer" ON expense_participants FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_participants.expense_id AND gm.user_id = auth.uid())
  );

-- ===== SETTLEMENTS POLICIES =====
DROP POLICY IF EXISTS "select_settlement_member" ON settlements;
CREATE POLICY "select_settlement_member" ON settlements FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_settlement_member" ON settlements;
CREATE POLICY "insert_settlement_member" ON settlements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_settlement_party" ON settlements;
CREATE POLICY "update_settlement_party" ON settlements FOR UPDATE
  TO authenticated USING (
    from_user = auth.uid() OR to_user = auth.uid() OR
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_settlement_admin" ON settlements;
CREATE POLICY "delete_settlement_admin" ON settlements FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

-- ===== NOTIFICATIONS POLICIES =====
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
