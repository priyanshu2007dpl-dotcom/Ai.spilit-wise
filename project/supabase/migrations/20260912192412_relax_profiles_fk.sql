/*
# Relax profiles FK constraint

1. Changes
- Drop the foreign key constraint from profiles.id to auth.users(id)
- This allows demo member profiles to exist without an auth account
- The constraint was: profiles.id REFERENCES auth.users(id) ON DELETE CASCADE
- Now profiles.id is just a uuid PK with no FK

2. Security
- No RLS changes — existing policies still use auth.uid() = id for ownership checks
- Demo member profiles won't have auth sessions so they can't access anything directly

3. Notes
- This is needed so the "Try Demo Data" feature can create sample member profiles
- Real users still get their profile created with their auth.uid as the id
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
