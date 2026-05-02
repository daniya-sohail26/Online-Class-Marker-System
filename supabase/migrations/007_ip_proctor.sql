-- IP Proctor Check migration
CREATE TABLE IF NOT EXISTS ip_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('start','answer','submit','heartbeat','ip_change')),
  is_vpn BOOLEAN DEFAULT false,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ip_logs_attempt ON ip_logs(attempt_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_test ON ip_logs(test_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip ON ip_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_logs_student ON ip_logs(student_id);

ALTER TABLE attempts ADD COLUMN IF NOT EXISTS initial_ip TEXT;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS ip_locked BOOLEAN DEFAULT false;

ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for ip_logs" ON ip_logs FOR ALL USING (true);
