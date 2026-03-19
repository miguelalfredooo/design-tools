-- Notifications system
CREATE TABLE IF NOT EXISTS carrier_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  related_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_notifications_created ON carrier_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carrier_notifications_session ON carrier_notifications(related_session_id);

-- Track which users have read which notifications
CREATE TABLE IF NOT EXISTS carrier_notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES carrier_notifications(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_notification_reads_voter ON carrier_notification_reads(voter_id);
CREATE INDEX IF NOT EXISTS idx_carrier_notification_reads_notification ON carrier_notification_reads(notification_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_carrier_notification_reads_unique ON carrier_notification_reads(notification_id, voter_id);

-- RLS
ALTER TABLE carrier_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications are publicly readable" ON carrier_notifications FOR SELECT USING (true);
CREATE POLICY "Notifications are publicly insertable" ON carrier_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Reads are publicly readable" ON carrier_notification_reads FOR SELECT USING (true);
CREATE POLICY "Reads are publicly insertable" ON carrier_notification_reads FOR INSERT WITH CHECK (true);
