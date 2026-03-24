-- Migration: add carrier_notifications and carrier_notification_reads tables
-- Required by app/api/design/notifications/route.ts

create table if not exists carrier_notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  type        text not null default 'info',  -- 'info' | 'warning' | 'success' | 'error'
  created_at  timestamptz not null default now()
);

create table if not exists carrier_notification_reads (
  id               uuid primary key default gen_random_uuid(),
  notification_id  uuid not null references carrier_notifications(id) on delete cascade,
  voter_id         text not null,
  created_at       timestamptz not null default now(),
  unique (notification_id, voter_id)
);

create index if not exists carrier_notification_reads_voter_idx
  on carrier_notification_reads(voter_id);

create index if not exists carrier_notifications_created_idx
  on carrier_notifications(created_at desc);
