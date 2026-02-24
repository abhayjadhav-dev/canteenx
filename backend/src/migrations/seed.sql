-- ══════════════════════════════════════════════
-- CanteenX – Supabase Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ══════════════════════════════════════════════

-- ── Categories ──
INSERT INTO categories (id, name, icon, color, sort_order, item_count) VALUES
  ('ca000001-0000-0000-0000-000000000001', 'Snacks',     'cookie',      '#f97316', 1, 3),
  ('ca000001-0000-0000-0000-000000000002', 'Beverages',  'coffee',      '#3b82f6', 2, 3),
  ('ca000001-0000-0000-0000-000000000003', 'Meals',      'utensils',    '#10b981', 3, 3),
  ('ca000001-0000-0000-0000-000000000004', 'Desserts',   'cake-slice',  '#ec4899', 4, 2),
  ('ca000001-0000-0000-0000-000000000005', 'South Indian','flame',      '#8b5cf6', 5, 2);

-- ── Menu Items ──
INSERT INTO menu_items (id, name, description, price, category_id, category_name, image_url, available, stock_qty, min_stock_qty, prep_time, calories, rating, rating_count, is_veg, is_popular, is_todays_special, special_label, addons, tags) VALUES
-- Snacks
('ae000001-0000-0000-0000-000000000001',
 'Samosa', 'Crispy fried pastry with spiced potato filling', 15.00,
 'ca000001-0000-0000-0000-000000000001', 'Snacks', '', true, 80, 10, 5, 180,
 4.5, 120, true, true, true, 'Best Seller',
 '[{"name":"Extra Chutney","price":5},{"name":"Cheese Dip","price":10}]'::jsonb,
 '{"crispy","popular","indian"}'),

('ae000001-0000-0000-0000-000000000002',
 'Vada Pav', 'Mumbai-style spicy potato fritter in a bun', 20.00,
 'ca000001-0000-0000-0000-000000000001', 'Snacks', '', true, 60, 10, 5, 250,
 4.3, 85, true, true, false, '',
 '[{"name":"Extra Garlic Chutney","price":5}]'::jsonb,
 '{"street-food","popular"}'),

('ae000001-0000-0000-0000-000000000003',
 'Paneer Puff', 'Puff pastry filled with spiced paneer', 25.00,
 'ca000001-0000-0000-0000-000000000001', 'Snacks', '', true, 40, 8, 8, 220,
 4.1, 50, true, false, false, '',
 '[]'::jsonb, '{"baked","vegetarian"}'),

-- Beverages
('ae000001-0000-0000-0000-000000000004',
 'Masala Chai', 'Traditional Indian spiced tea', 15.00,
 'ca000001-0000-0000-0000-000000000002', 'Beverages', '', true, 100, 15, 5, 80,
 4.6, 200, true, true, true, 'Campus Fav',
 '[{"name":"Extra Sugar","price":0},{"name":"Ginger Shot","price":5}]'::jsonb,
 '{"hot","tea","popular"}'),

('ae000001-0000-0000-0000-000000000005',
 'Cold Coffee', 'Creamy blended iced coffee', 40.00,
 'ca000001-0000-0000-0000-000000000002', 'Beverages', '', true, 50, 10, 7, 180,
 4.4, 95, true, true, false, '',
 '[{"name":"Chocolate Syrup","price":10},{"name":"Whipped Cream","price":15}]'::jsonb,
 '{"cold","coffee","popular"}'),

('ae000001-0000-0000-0000-000000000006',
 'Fresh Lime Soda', 'Refreshing lime soda – sweet or salted', 25.00,
 'ca000001-0000-0000-0000-000000000002', 'Beverages', '', true, 70, 10, 3, 60,
 4.2, 60, true, false, false, '',
 '[{"name":"Mint","price":5}]'::jsonb,
 '{"cold","refreshing"}'),

-- Meals
('ae000001-0000-0000-0000-000000000007',
 'Veg Thali', 'Complete meal: roti, dal, sabzi, rice, salad', 70.00,
 'ca000001-0000-0000-0000-000000000003', 'Meals', '', true, 30, 5, 15, 550,
 4.7, 150, true, true, true, 'Lunch Special',
 '[{"name":"Extra Roti","price":10},{"name":"Sweet Dish","price":20}]'::jsonb,
 '{"meal","thali","popular"}'),

('ae000001-0000-0000-0000-000000000008',
 'Chicken Biryani', 'Fragrant basmati rice with tender chicken', 90.00,
 'ca000001-0000-0000-0000-000000000003', 'Meals', '', true, 25, 5, 20, 650,
 4.8, 180, false, true, false, '',
 '[{"name":"Extra Raita","price":10},{"name":"Boiled Egg","price":15}]'::jsonb,
 '{"biryani","non-veg","popular"}'),

('ae000001-0000-0000-0000-000000000009',
 'Paneer Butter Masala + Naan', 'Rich creamy paneer curry with butter naan', 85.00,
 'ca000001-0000-0000-0000-000000000003', 'Meals', '', true, 20, 5, 18, 600,
 4.5, 90, true, false, false, '',
 '[{"name":"Extra Naan","price":15}]'::jsonb,
 '{"north-indian","paneer"}'),

-- Desserts
('ae000001-0000-0000-0000-00000000000a',
 'Gulab Jamun', 'Warm milk-solid dumplings in rose syrup', 30.00,
 'ca000001-0000-0000-0000-000000000004', 'Desserts', '', true, 50, 10, 5, 300,
 4.4, 70, true, true, false, '',
 '[]'::jsonb, '{"sweet","indian","dessert"}'),

('ae000001-0000-0000-0000-00000000000b',
 'Brownie with Ice Cream', 'Warm chocolate brownie served with vanilla ice cream', 50.00,
 'ca000001-0000-0000-0000-000000000004', 'Desserts', '', true, 25, 5, 8, 420,
 4.6, 55, true, false, true, 'Sweet Treat',
 '[{"name":"Extra Scoop","price":20}]'::jsonb,
 '{"chocolate","dessert"}'),

-- South Indian
('ae000001-0000-0000-0000-00000000000c',
 'Masala Dosa', 'Crispy crepe filled with spiced potato, served with sambar & chutney', 45.00,
 'ca000001-0000-0000-0000-000000000005', 'South Indian', '', true, 35, 8, 12, 350,
 4.5, 100, true, true, false, '',
 '[{"name":"Extra Sambar","price":10}]'::jsonb,
 '{"south-indian","breakfast","popular"}'),

('ae000001-0000-0000-0000-00000000000d',
 'Idli Sambar', 'Steamed rice cakes with sambar and coconut chutney', 30.00,
 'ca000001-0000-0000-0000-000000000005', 'South Indian', '', true, 45, 10, 8, 220,
 4.3, 80, true, false, false, '',
 '[{"name":"Extra Idli (2 pcs)","price":15}]'::jsonb,
 '{"south-indian","healthy"}');

-- ══════════════════════════════════════════════
-- NOTE: Test user accounts
-- ══════════════════════════════════════════════
-- Create test users via Supabase Auth (Dashboard → Authentication → Users → Add User):
--
-- 1. Student:  student@canteenx.com  / canteenx123
-- 2. Admin:    admin@canteenx.com    / canteenx123
--
-- After creating auth users, update their profiles:
--
-- UPDATE profiles SET name = 'Test Student', role = 'student', student_id = 'STU2024001', wallet_balance = 500
-- WHERE email = 'student@canteenx.com';
--
-- UPDATE profiles SET name = 'Admin User', role = 'admin'
-- WHERE email = 'admin@canteenx.com';
-- ══════════════════════════════════════════════
