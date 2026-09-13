/*
# Fix RLS policies for core app functionality

1. Groups SELECT: Allow any authenticated user to read groups.
   Needed for Join Group — users must look up a group by invite code before joining.
   Group names/descriptions are not sensitive; the invite code gates joining.

2. Group members INSERT: Allow group creators to add ANY user as a member.
   The old policy only allowed self-insert (auth.uid() = user_id), which blocked
   group creators from adding members and broke demo data seeding.

3. Profiles INSERT: Allow any authenticated user to insert profiles.
   Needed for demo data (creates fake member profiles) and for adding members by name.
   The FK to auth.users was already dropped in a prior migration.

4. Notifications INSERT: Allow any authenticated user to insert notifications for any user.
   Needed so group members can notify each other when expenses are added or payments are made.
*/

-- === Groups: broader SELECT ===
DROP POLICY IF EXISTS "select_group_members" ON groups;
CREATE POLICY "select_group_members" ON groups FOR SELECT
  TO authenticated USING (true);

-- === Group members: allow group creator to add any member ===
DROP POLICY IF EXISTS "insert_group_member" ON group_members;
CREATE POLICY "insert_group_member" ON group_members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
        AND g.created_by = auth.uid()
    )
  );

-- === Profiles: allow any authenticated user to insert ===
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (true);

-- === Notifications: allow inserting for any user (group expense notifications) ===
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);
