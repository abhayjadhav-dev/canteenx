-- ============================================
-- CanteenX – Remove auth.users FK constraint
-- Needed for custom JWT auth (no Supabase Auth dependency)
-- Run in Supabase SQL Editor
-- ============================================

-- Drop the foreign key constraint on profiles.id → auth.users
alter table profiles drop constraint if exists profiles_id_fkey;

-- The profiles.id is now just a UUID primary key (not linked to auth.users)
-- Our backend generates UUIDs directly when creating profiles.
