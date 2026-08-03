-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Fixes "infinite recursion detected in policy for relation families" from
-- migration 004: the families and providers SELECT policies each queried
-- the other RLS-protected table directly, which caused Postgres to evaluate
-- each policy while evaluating the other, forever. security definer
-- functions break the loop by bypassing RLS for just that internal lookup.

create or replace function family_ids_matched_to(user_email text)
returns setof text
language sql
security definer
set search_path = public
as $$
  select m.family_id from matches m
  join providers p on p.id = m.provider_id
  where p.contact_email = user_email;
$$;

create or replace function provider_ids_matched_to(user_email text)
returns setof text
language sql
security definer
set search_path = public
as $$
  select m.provider_id from matches m
  join families f on f.id = m.family_id
  where f.contact_email = user_email;
$$;

drop policy "Users read own or matched family" on families;
create policy "Users read own or matched family" on families for select
  using (
    contact_email = auth.jwt() ->> 'email'
    or id in (select family_ids_matched_to(auth.jwt() ->> 'email'))
  );

drop policy "Users read own or matched provider" on providers;
create policy "Users read own or matched provider" on providers for select
  using (
    contact_email = auth.jwt() ->> 'email'
    or id in (select provider_ids_matched_to(auth.jwt() ->> 'email'))
  );
