-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists families (
  id text primary key,
  label text not null default '',
  zip text,
  flexible boolean not null default false,
  days jsonb not null default '[]',
  start_time text,
  end_time text,
  specific_dates jsonb not null default '[]',
  term text,
  hours_guaranteed boolean not null default false,
  start_date text,
  ages text,
  rate text,
  care_location text,
  needs_transport boolean not null default false,
  transport_car text,
  requires_driving_record boolean not null default false,
  requires_cpr boolean not null default false,
  requires_clearances boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists providers (
  id text primary key,
  label text not null default '',
  zip text,
  flexible boolean not null default false,
  days jsonb not null default '[]',
  start_time text,
  end_time text,
  specific_dates jsonb not null default '[]',
  terms_accepted text,
  start_date text,
  min_age text,
  max_age text,
  age_no_preference boolean not null default false,
  rate text,
  care_location text,
  has_transport boolean not null default false,
  cpr_certified boolean not null default false,
  has_clearances boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table families enable row level security;
alter table providers enable row level security;

-- Only signed-in users (i.e. you, the admin) can read or write.
create policy "Authenticated users can manage families"
  on families for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage providers"
  on providers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
