CREATE TYPE religious_knowledge_test_status AS ENUM ('ready_for_test', 'passed', 'failed');

CREATE TABLE religious_knowledge_test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  status religious_knowledge_test_status NOT NULL DEFAULT 'ready_for_test',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_id)
);

CREATE INDEX idx_rk_test_requests_user ON religious_knowledge_test_requests(user_id);
CREATE INDEX idx_rk_test_requests_status_time ON religious_knowledge_test_requests(status, requested_at DESC);

ALTER TABLE religious_knowledge_test_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon religious_knowledge_test_requests"
ON religious_knowledge_test_requests FOR ALL USING (false);
