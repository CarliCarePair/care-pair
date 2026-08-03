-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

create table matches (
  id uuid primary key default gen_random_uuid(),
  family_id text not null references families(id) on delete cascade,
  provider_id text not null references providers(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  unique (family_id, provider_id)
);
alter table matches enable row level security;

-- Replace the old blanket "any authenticated user" policies with an
-- admin-email-scoped one (update this email if the admin login ever changes).
drop policy "Authenticated users can manage families" on families;
drop policy "Authenticated users can manage providers" on providers;

create policy "Admin manages families" on families for all
  using (auth.jwt() ->> 'email' = 'carlicoyne@gmail.com')
  with check (auth.jwt() ->> 'email' = 'carlicoyne@gmail.com');
create policy "Admin manages providers" on providers for all
  using (auth.jwt() ->> 'email' = 'carlicoyne@gmail.com')
  with check (auth.jwt() ->> 'email' = 'carlicoyne@gmail.com');
create policy "Admin manages matches" on matches for all
  using (auth.jwt() ->> 'email' = 'carlicoyne@gmail.com')
  with check (auth.jwt() ->> 'email' = 'carlicoyne@gmail.com');

-- End users may read their own row, and any row they're confirmed-matched with.
create policy "Users read own or matched family" on families for select
  using (
    contact_email = auth.jwt() ->> 'email'
    or exists (select 1 from matches m join providers p on p.id = m.provider_id
               where m.family_id = families.id and p.contact_email = auth.jwt() ->> 'email')
  );
create policy "Users read own or matched provider" on providers for select
  using (
    contact_email = auth.jwt() ->> 'email'
    or exists (select 1 from matches m join families f on f.id = m.family_id
               where m.provider_id = providers.id and f.contact_email = auth.jwt() ->> 'email')
  );
create policy "Users read their own matches" on matches for select
  using (
    exists (select 1 from families f where f.id = matches.family_id and f.contact_email = auth.jwt() ->> 'email')
    or exists (select 1 from providers p where p.id = matches.provider_id and p.contact_email = auth.jwt() ->> 'email')
  );
