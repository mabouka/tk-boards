-- ============================================================
-- TK Boards — admin role
-- Migration 0003
-- Gates the seller dashboard (/admin). Promote a user with:
--   update public.profiles set role = 'admin' where id = '<uuid>';
-- ============================================================
alter table public.profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'admin'));
