-- ============================================
-- CanteenX – Add notification_prefs to profiles
-- Run this in Supabase SQL Editor
-- ============================================

alter table profiles
  add column if not exists notification_prefs jsonb
  default jsonb_build_object(
    'orderReady', true,
    'orderCancelled', true,
    'adminNewOrder', true,
    'adminLowInventory', true
  );

