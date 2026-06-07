-- ============================================================
-- TK Boards — Member area
-- Board registration · warranty · theft declaration
-- Migration 0001
-- ============================================================
-- Identity lives in auth.users (Supabase Auth).
-- The board *catalog* lives in Sanity — here we only store a
-- reference (Sanity _id) + a denormalized name snapshot.
-- ============================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------- Shared updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles  (1–1 with auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  locale      text not null default 'fr' check (locale in ('fr', 'en', 'es')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'locale', 'fr')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- board_registrations  (a board owned by a user)
-- ============================================================
create table public.board_registrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  board_ref       text not null,            -- Sanity board _id (stable across renames)
  board_name      text not null,            -- snapshot for display
  serial_number   text not null,
  purchased_at    date,
  purchase_proof  text,                     -- path in the 'purchase-proofs' bucket
  status          text not null default 'active'
                    check (status in ('active', 'stolen', 'transferred')),
  warranty_until  date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One ACTIVE owner per physical board; keeps historical 'transferred' rows valid
create unique index board_registrations_active_serial_uq
  on public.board_registrations (serial_number)
  where status = 'active';

create index board_registrations_user_idx
  on public.board_registrations (user_id);

create trigger board_registrations_set_updated_at
  before update on public.board_registrations
  for each row execute function public.set_updated_at();

-- ============================================================
-- claims  (theft / warranty, tied to one registration)
-- ============================================================
create table public.claims (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.board_registrations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  type            text not null check (type in ('theft', 'warranty')),
  description     text,
  photo_paths     text[] not null default '{}',  -- paths in the 'claim-photos' bucket
  status          text not null default 'open'
                    check (status in ('open', 'in_review', 'resolved', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index claims_user_idx on public.claims (user_id);
create index claims_registration_idx on public.claims (registration_id);

create trigger claims_set_updated_at
  before update on public.claims
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- A user only ever sees / touches their own rows.
-- Admin review uses the service_role key, which bypasses RLS.
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.board_registrations enable row level security;
alter table public.claims              enable row level security;

-- ----- profiles -----
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
-- (insert handled by the signup trigger, which is security definer)

-- ----- board_registrations -----
create policy "registrations: read own"
  on public.board_registrations for select
  using (user_id = auth.uid());

create policy "registrations: insert own"
  on public.board_registrations for insert
  with check (user_id = auth.uid());

create policy "registrations: update own"
  on public.board_registrations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "registrations: delete own"
  on public.board_registrations for delete
  using (user_id = auth.uid());

-- ----- claims -----
create policy "claims: read own"
  on public.claims for select
  using (user_id = auth.uid());

create policy "claims: insert own"
  on public.claims for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.board_registrations r
      where r.id = registration_id
        and r.user_id = auth.uid()
    )
  );
-- No user UPDATE policy by design: claim status is moved by admin
-- (service_role) only — a user can't mark their own claim "resolved".

-- ============================================================
-- Storage buckets + policies (private)
-- Convention: files live under <user_id>/… so access scopes by folder.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('purchase-proofs', 'purchase-proofs', false),
       ('claim-photos',    'claim-photos',    false)
on conflict (id) do nothing;

create policy "proofs: user manages own folder"
  on storage.objects for all
  using (
    bucket_id = 'purchase-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'purchase-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "claim-photos: user manages own folder"
  on storage.objects for all
  using (
    bucket_id = 'claim-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'claim-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
