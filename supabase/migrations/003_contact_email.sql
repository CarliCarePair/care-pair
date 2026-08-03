-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

alter table families add column if not exists contact_email text;
alter table providers add column if not exists contact_email text;
