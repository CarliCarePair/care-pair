-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- after supabase/schema.sql has already been applied.

alter table families add column if not exists status text not null default 'approved';
alter table providers add column if not exists status text not null default 'approved';

alter table families add constraint families_status_check check (status in ('pending','approved'));
alter table providers add constraint providers_status_check check (status in ('pending','approved'));

-- Public (logged-out) visitors may only insert new rows, always as "pending".
-- They get no select/update/delete access, so they can never read or change
-- anyone else's submission — only the authenticated admin can do that
-- (covered by the existing "Authenticated users can manage families/providers"
-- policies from supabase/schema.sql).
create policy "Public can submit pending families"
  on families for insert to anon
  with check (status = 'pending');

create policy "Public can submit pending providers"
  on providers for insert to anon
  with check (status = 'pending');
