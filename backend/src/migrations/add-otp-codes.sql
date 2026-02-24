-- ============================================
-- CanteenX – Add otp_codes table
-- Run in Supabase SQL Editor
-- ============================================

create table if not exists otp_codes (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified boolean default false,
  created_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_otp_phone on otp_codes(phone);
create index if not exists idx_otp_expires on otp_codes(expires_at);

-- Disable RLS for demo
alter table otp_codes disable row level security;

-- Auto-cleanup: delete OTPs older than 1 hour (run periodically or use pg_cron)
-- If you have pg_cron enabled:
-- select cron.schedule('cleanup-old-otps', '*/30 * * * *', $$delete from otp_codes where created_at < now() - interval '1 hour'$$);
