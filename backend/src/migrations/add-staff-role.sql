-- ============================================
-- CanteenX – Add 'staff' to profiles role
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing check constraint (name may vary; try common variants)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated constraint including staff
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin', 'staff'));
