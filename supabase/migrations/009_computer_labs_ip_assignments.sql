-- Computer lab IP assignment support.
-- Teachers can attach a lab to a test; each enrolled student gets one expected IP.

CREATE TABLE IF NOT EXISTS computer_labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS computer_lab_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES computer_labs(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (lab_id, ip_address)
);

ALTER TABLE tests ADD COLUMN IF NOT EXISTS computer_lab_id UUID REFERENCES computer_labs(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS test_ip_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES computer_labs(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_ip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (test_id, student_id),
  UNIQUE (test_id, assigned_ip)
);

ALTER TABLE attempts ADD COLUMN IF NOT EXISTS assigned_ip TEXT;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS ip_mismatch BOOLEAN DEFAULT false;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS duplicate_ip_detected BOOLEAN DEFAULT false;

ALTER TABLE ip_logs DROP CONSTRAINT IF EXISTS ip_logs_action_check;
ALTER TABLE ip_logs
  ADD CONSTRAINT ip_logs_action_check
  CHECK (action IN ('start','answer','submit','heartbeat','ip_change','unauthorized_ip','duplicate_ip'));

CREATE INDEX IF NOT EXISTS idx_computer_lab_ips_lab ON computer_lab_ips(lab_id);
CREATE INDEX IF NOT EXISTS idx_test_ip_assignments_test ON test_ip_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_ip_assignments_student ON test_ip_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_test_ip_assignments_ip ON test_ip_assignments(test_id, assigned_ip);

ALTER TABLE computer_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_lab_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_ip_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for computer_labs" ON computer_labs FOR ALL USING (true);
CREATE POLICY "Allow all for computer_lab_ips" ON computer_lab_ips FOR ALL USING (true);
CREATE POLICY "Allow all for test_ip_assignments" ON test_ip_assignments FOR ALL USING (true);
