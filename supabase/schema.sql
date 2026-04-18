-- Tulane Marketplace schema + RLS
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  graduation_year int,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  condition text not null,
  tags text[] not null default '{}',
  meetup_location text not null,
  meetup_note text,
  payment_method text not null check (payment_method in ('Cash', 'Venmo')),
  status text not null default 'available' check (status in ('available','pending','sold')),
  moderation_flag text not null default 'clean',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  parent_offer_id uuid references public.offers(id) on delete set null,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null check (status in ('pending','accepted','rejected','countered')),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  moderation_flag text not null default 'pending_review',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.likes enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_verified_tulane_user(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = uid
      and p.verification_status = 'verified'
      and coalesce(u.email, '') like '%@tulane.edu'
      and u.email_confirmed_at is not null
  );
$$;

create policy "profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can delete own profile"
on public.profiles for delete
using (auth.uid() = id);

create policy "users can insert own profile"
on public.profiles for insert
with check (
  auth.uid() = id
  and verification_status in ('pending', 'verified')
);

create policy "listings viewable by everyone"
on public.listings for select
using (true);

create policy "verified tulane users can create listings"
on public.listings for insert
with check (
  auth.uid() = seller_id
  and public.is_verified_tulane_user(auth.uid())
);

create policy "users can edit own listings"
on public.listings for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "users can delete own listings"
on public.listings for delete
using (auth.uid() = seller_id);

create policy "listing images viewable by everyone"
on public.listing_images for select
using (true);

create policy "verified users can add listing images"
on public.listing_images for insert
with check (
  public.is_verified_tulane_user(auth.uid())
  and exists (
    select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()
  )
);

create policy "likes viewable by owner"
on public.likes for select
using (auth.uid() = user_id);

create policy "verified users can like"
on public.likes for insert
with check (auth.uid() = user_id and public.is_verified_tulane_user(auth.uid()));

create policy "verified users can unlike their likes"
on public.likes for delete
using (auth.uid() = user_id);

create policy "offers visible to buyer or seller"
on public.offers for select
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "verified users can make offers"
on public.offers for insert
with check (auth.uid() = buyer_id and public.is_verified_tulane_user(auth.uid()));

create policy "seller can update offer status"
on public.offers for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "buyer can cancel own pending offers"
on public.offers for delete
using (auth.uid() = buyer_id and status = 'pending');

create policy "messages visible to participants"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "verified users can send messages"
on public.messages for insert
with check (auth.uid() = sender_id and public.is_verified_tulane_user(auth.uid()));

create policy "verified users can submit reports"
on public.reports for insert
with check (auth.uid() = reporter_id and public.is_verified_tulane_user(auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  if right(new.email, 11) <> '@tulane.edu' then
    raise exception 'Only @tulane.edu emails are allowed';
  end if;

  insert into public.profiles (id, username, graduation_year, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'graduation_year', '')::int,
    case when new.email_confirmed_at is not null then 'verified' else 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
