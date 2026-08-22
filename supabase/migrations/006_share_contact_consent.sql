-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

alter table families add column if not exists share_contact_consent boolean not null default false;
alter table providers add column if not exists share_contact_consent boolean not null default false;
