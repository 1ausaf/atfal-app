-- Letter to Huzoor: one submission per tifl per month
CREATE TABLE activity_letter_huzoor_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  submission_month TEXT NOT NULL, -- format: YYYY-MM (computed in Toronto timezone)
  letter_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, submission_month)
);

CREATE INDEX idx_activity_letter_huzoor_user ON activity_letter_huzoor_submissions(user_id);
CREATE INDEX idx_activity_letter_huzoor_month ON activity_letter_huzoor_submissions(submission_month DESC);

ALTER TABLE activity_letter_huzoor_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon activity_letter_huzoor_submissions" ON activity_letter_huzoor_submissions FOR ALL USING (false);

