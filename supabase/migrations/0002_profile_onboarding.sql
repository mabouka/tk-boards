-- ============================================================
-- TK Boards — Member area · profile + onboarding
-- Migration 0002
--   · split name into first_name / last_name, add phone
--   · addresses table (default delivery address)
--   · email_exists() for the email-first sign-in flow
--   · refresh handle_new_user() to fill the new columns
-- ============================================================

-- ---------- profiles: first/last name + phone ----------
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists onboarded  boolean not null default false;

-- ---------- addresses (one default delivery address per user) ----------
create table if not exists public.addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  line1        text not null,
  line2        text,
  postal_code  text,
  city         text,
  country      text,
  phone        text,
  is_default   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id);

-- at most one default address per user
create unique index if not exists addresses_one_default
  on public.addresses (user_id) where is_default;

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;

drop policy if exists "addresses: read own"   on public.addresses;
drop policy if exists "addresses: insert own" on public.addresses;
drop policy if exists "addresses: update own" on public.addresses;
drop policy if exists "addresses: delete own" on public.addresses;

create policy "addresses: read own"   on public.addresses for select using (user_id = auth.uid());
create policy "addresses: insert own" on public.addresses for insert with check (user_id = auth.uid());
create policy "addresses: update own" on public.addresses for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses: delete own" on public.addresses for delete using (user_id = auth.uid());

-- ---------- refresh signup trigger (first/last/full name + phone) ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, full_name, phone, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      nullif(trim(concat_ws(' ',
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name')), '')
    ),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'locale', 'fr')
  );
  return new;
end;
$$;

-- ---------- email_exists() for the email-first flow ----------
-- Called server-side with the service_role key (never exposed to the browser).
create or replace function public.email_exists(p_email text)
returns boolean
language sql
security definer set search_path = public, auth
as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email));
$$;

revoke all on function public.email_exists(text) from public;
grant execute on function public.email_exists(text) to service_role;
