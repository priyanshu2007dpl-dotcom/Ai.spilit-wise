/*
# Fix profiles SELECT policy — group members need to see each other's profiles

The old policy only let you see your own profile (auth.uid() = id).
But the app joins group_members with profiles to show member names/avatars.
With the old policy, other members' profiles came back as null, breaking
the group detail page and groups list.

New policy: you can see your own profile OR any profile that is a member
of a group you're also a member of.
*/

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = profiles.id
    )
  );
