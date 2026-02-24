-- ============================================
-- CanteenX – Update trigger for Phone Auth
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- ============================================

-- Update the trigger function to handle phone-based signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;
