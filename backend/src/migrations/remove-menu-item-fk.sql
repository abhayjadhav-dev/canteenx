-- ============================================
-- CanteenX – Allow deleting menu items
-- that are referenced in historical orders
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the foreign key from order_items.menu_item_id → menu_items.id
-- so historical orders keep their own name/price snapshot
-- without blocking menu item deletion.

alter table order_items
  drop constraint if exists order_items_menu_item_id_fkey;

-- Make sure menu_item_id is nullable so past rows remain valid.
alter table order_items
  alter column menu_item_id drop not null;

